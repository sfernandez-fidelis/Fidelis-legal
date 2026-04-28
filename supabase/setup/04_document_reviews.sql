-- Document Reviews: tracks rejection workflow between Archivo and Legal teams
-- Archivo marks documents as rejected → Legal reviews and confirms/restores

create table if not exists public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,

  -- File info
  original_file_name text not null,
  original_storage_path text not null,
  stamped_storage_path text,

  -- Workflow status
  status text not null default 'pending_review'
    check (status in ('pending_review', 'confirmed', 'restored')),

  -- Archivo (who rejected)
  rejected_by uuid references public.profiles (id),
  rejected_at timestamptz not null default timezone('utc', now()),
  rejection_reason text,

  -- Legal (who reviewed)
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_notes text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists document_reviews_org_status_idx
  on public.document_reviews (organization_id, status, created_at desc);

create index if not exists document_reviews_org_created_at_idx
  on public.document_reviews (organization_id, created_at desc);

-- Triggers
drop trigger if exists document_reviews_set_updated_at on public.document_reviews;
create trigger document_reviews_set_updated_at
before update on public.document_reviews
for each row execute function app.set_updated_at();

drop trigger if exists document_reviews_activity_log on public.document_reviews;
create trigger document_reviews_activity_log
after insert or update or delete on public.document_reviews
for each row execute function app.log_activity();

-- Trigger for syncing status to documents table
CREATE OR REPLACE FUNCTION sync_document_review_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_id IS NOT NULL THEN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
      UPDATE public.documents
      SET archived_at = NOW(),
          status = 'rejected'
      WHERE id = NEW.document_id;
    ELSIF NEW.status = 'restored' AND OLD.status != 'restored' THEN
      UPDATE public.documents
      SET archived_at = NULL,
          status = 'draft'
      WHERE id = NEW.document_id AND status = 'rejected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

drop trigger if exists trigger_sync_document_review_status on public.document_reviews;
create trigger trigger_sync_document_review_status
after update on public.document_reviews
for each row execute function sync_document_review_status();

-- RLS
alter table public.document_reviews enable row level security;

drop policy if exists "document_reviews_select_members" on public.document_reviews;
create policy "document_reviews_select_members" on public.document_reviews
for select using (app.is_org_member(organization_id));

drop policy if exists "document_reviews_insert_archivo" on public.document_reviews;
create policy "document_reviews_insert_archivo" on public.document_reviews
for insert with check (
  app.has_org_role(organization_id, 'editor') AND
  auth.jwt() -> 'user_metadata' ->> 'department' = 'archivo'
);

drop policy if exists "document_reviews_update_legal" on public.document_reviews;
create policy "document_reviews_update_legal" on public.document_reviews
for update using (
  app.has_org_role(organization_id, 'editor') AND
  auth.jwt() -> 'user_metadata' ->> 'department' = 'legal'
)
with check (
  app.has_org_role(organization_id, 'editor') AND
  auth.jwt() -> 'user_metadata' ->> 'department' = 'legal'
);

-- Storage bucket for review files
insert into storage.buckets (id, name, public)
values ('review-files', 'review-files', false)
on conflict (id) do nothing;

drop policy if exists "review_files_storage_select_members" on storage.objects;
create policy "review_files_storage_select_members" on storage.objects
for select using (
  bucket_id = 'review-files'
  and app.is_org_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "review_files_storage_insert_editors" on storage.objects;
create policy "review_files_storage_insert_editors" on storage.objects
for insert with check (
  bucket_id = 'review-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
);

drop policy if exists "review_files_storage_update_editors" on storage.objects;
create policy "review_files_storage_update_editors" on storage.objects
for update using (
  bucket_id = 'review-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
)
with check (
  bucket_id = 'review-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
);

-- Grant privileges explicitly to avoid 403 errors
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_reviews TO service_role;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';