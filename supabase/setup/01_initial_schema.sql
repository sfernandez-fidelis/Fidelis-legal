create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists app;

insert into storage.buckets (id, name, public)
values ('generated-files', 'generated-files', false)
on conflict (id) do nothing;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.contacts') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contacts'
      and column_name = 'user_id'
  ) then
    alter table public.contacts rename to legacy_contacts;
  end if;
end
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  unique (organization_id, user_id)
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  invited_by uuid references public.profiles (id),
  token text not null unique,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function app.current_organization_ids()
returns setof uuid
language sql
stable
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
    and archived_at is null
$$;

create or replace function app.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and archived_at is null
  )
$$;

create or replace function app.has_org_role(target_organization_id uuid, minimum_role text)
returns boolean
language sql
stable
as $$
  with membership as (
    select role
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and archived_at is null
    limit 1
  )
  select exists (
    select 1
    from membership
    where case minimum_role
      when 'viewer' then role in ('viewer', 'editor', 'admin', 'owner')
      when 'editor' then role in ('editor', 'admin', 'owner')
      when 'admin' then role in ('admin', 'owner')
      when 'owner' then role = 'owner'
      else false
    end
  )
$$;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null default 'party',
  external_key text,
  party jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  contract_type text not null,
  name text not null,
  description text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_published boolean not null default false,
  draft_version_id uuid,
  published_version_id uuid,
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.document_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.document_templates (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  version_number integer not null,
  content text not null,
  change_note text,
  source_version_id uuid references public.document_template_versions (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, version_number)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  status text not null default 'draft' check (status in ('draft', 'ready', 'generated', 'archived')),
  contract_type text not null,
  title text not null,
  contact_id uuid references public.contacts (id),
  template_id uuid references public.document_templates (id),
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

alter table public.documents
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.documents drop constraint if exists documents_status_check;
  alter table public.documents
    add constraint documents_status_check check (status in ('draft', 'ready', 'generated', 'archived'));
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  version_number integer not null,
  payload_snapshot jsonb not null,
  template_snapshot text,
  status text,
  snapshot_reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  immutable_hash text,
  unique (document_id, version_number)
);

alter table public.document_versions add column if not exists status text;
alter table public.document_versions add column if not exists snapshot_reason text;

create table if not exists public.generated_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  document_version_id uuid references public.document_versions (id) on delete set null,
  file_kind text not null check (file_kind in ('pdf', 'docx', 'html', 'other')),
  storage_bucket text not null default 'generated-files',
  storage_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references public.profiles (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists organizations_archived_at_idx on public.organizations (archived_at);
create index if not exists organization_members_user_id_idx on public.organization_members (user_id) where archived_at is null;
create index if not exists organization_members_org_id_idx on public.organization_members (organization_id) where archived_at is null;
create index if not exists organization_invitations_org_created_at_idx on public.organization_invitations (organization_id, created_at desc);
create index if not exists contacts_org_created_at_idx on public.contacts (organization_id, created_at desc) where archived_at is null;
create index if not exists contacts_search_text_idx on public.contacts using gin (search_text gin_trgm_ops);
create index if not exists documents_org_created_at_idx on public.documents (organization_id, created_at desc) where archived_at is null;
create index if not exists documents_status_idx on public.documents (organization_id, status) where archived_at is null;
create index if not exists documents_search_text_idx on public.documents using gin (search_text gin_trgm_ops);
create index if not exists document_versions_document_id_idx on public.document_versions (document_id, version_number desc);
create index if not exists document_templates_org_type_idx on public.document_templates (organization_id, contract_type) where archived_at is null;
create index if not exists document_template_versions_template_id_idx on public.document_template_versions (template_id, version_number desc);
create index if not exists activity_log_org_created_at_idx on public.activity_log (organization_id, created_at desc);
create unique index if not exists contacts_org_external_key_uidx
  on public.contacts (organization_id, kind, external_key)
  where archived_at is null and external_key is not null;

create or replace function app.prepare_contact()
returns trigger
language plpgsql
as $$
begin
  new.search_text = trim(
    concat_ws(
      ' ',
      coalesce(new.party ->> 'name', ''),
      coalesce(new.party ->> 'entityName', ''),
      coalesce(new.party ->> 'idNumber', ''),
      coalesce(new.party ->> 'cui', ''),
      coalesce(new.metadata ->> 'displayName', ''),
      coalesce(
        (
          select string_agg(value, ' ')
          from jsonb_array_elements_text(coalesce(new.metadata -> 'tags', '[]'::jsonb)) value
        ),
        ''
      ),
      coalesce(
        (
          select string_agg(value, ' ')
          from jsonb_array_elements_text(coalesce(new.metadata -> 'contactTypes', '[]'::jsonb)) value
        ),
        ''
      )
    )
  );

  if new.external_key is null or new.external_key = '' then
    new.external_key = nullif(
      coalesce(new.party ->> 'idNumber', new.party ->> 'cui', new.party ->> 'name'),
      ''
    );
  end if;

  return new;
end;
$$;

create or replace function app.prepare_document()
returns trigger
language plpgsql
as $$
begin
  new.title = coalesce(
    nullif(new.title, ''),
    concat_ws(' - ', new.payload -> 'principal' ->> 'name', new.payload ->> 'contractDate'),
    'Documento sin titulo'
  );

  new.search_text = trim(
    concat_ws(
      ' ',
      coalesce(new.title, ''),
      coalesce(new.payload -> 'principal' ->> 'name', ''),
      coalesce(new.payload -> 'principal' ->> 'entityName', ''),
      coalesce(new.payload ->> 'beneficiaryName', ''),
      coalesce(
        (
          select string_agg(policy ->> 'number', ' ')
          from jsonb_array_elements(coalesce(new.payload -> 'policies', '[]'::jsonb)) policy
        ),
        ''
      ),
      coalesce(
        (
          select string_agg(guarantor ->> 'name', ' ')
          from jsonb_array_elements(coalesce(new.payload -> 'guarantors', '[]'::jsonb)) guarantor
        ),
        ''
      )
    )
  );

  return new;
end;
$$;

create or replace function app.capture_document_version()
returns trigger
language plpgsql
as $$
declare
  next_version integer;
  template_content text;
  should_snapshot boolean;
begin
  should_snapshot := tg_op = 'INSERT'
    or coalesce(new.metadata ->> 'snapshot_reason', '') <> ''
    or new.status is distinct from old.status
    or new.archived_at is distinct from old.archived_at
    or new.template_id is distinct from old.template_id;

  if not should_snapshot then
    return new;
  end if;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.document_versions
  where document_id = new.id;

  select coalesce(version_row.content, template_row.content)
  into template_content
  from public.document_templates template_row
  left join public.document_template_versions version_row
    on version_row.id = template_row.published_version_id
  where template_row.id = new.template_id;

  insert into public.document_versions (
    document_id,
    organization_id,
    version_number,
    payload_snapshot,
    template_snapshot,
    status,
    snapshot_reason,
    created_by,
    immutable_hash
  )
  values (
    new.id,
    new.organization_id,
    next_version,
    new.payload,
    template_content,
    new.status,
    nullif(new.metadata ->> 'snapshot_reason', ''),
    coalesce(new.updated_by, new.created_by),
    md5(coalesce(new.payload::text, '') || coalesce(template_content, ''))
  );

  return new;
end;
$$;

create or replace function app.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target record;
  action_name text;
  target_data jsonb;
begin
  target := case when tg_op = 'DELETE' then old else new end;
  target_data := to_jsonb(target);
  action_name := lower(tg_table_name) || '.' || lower(tg_op);

  if tg_op = 'UPDATE' and old.archived_at is distinct from new.archived_at and new.archived_at is not null then
    action_name := lower(tg_table_name) || '.archived';
  end if;

  insert into public.activity_log (organization_id, entity_type, entity_id, action, actor_id, metadata)
  values (
    target.organization_id,
    tg_table_name,
    target.id,
    action_name,
    coalesce((target_data ->> 'updated_by')::uuid, (target_data ->> 'created_by')::uuid, auth.uid()),
    jsonb_build_object('table', tg_table_name)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function app.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function app.set_updated_at();

drop trigger if exists organization_invitations_set_updated_at on public.organization_invitations;
create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function app.set_updated_at();

drop trigger if exists contacts_prepare on public.contacts;
create trigger contacts_prepare
before insert or update on public.contacts
for each row execute function app.prepare_contact();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function app.set_updated_at();

drop trigger if exists document_templates_set_updated_at on public.document_templates;
create trigger document_templates_set_updated_at
before update on public.document_templates
for each row execute function app.set_updated_at();

drop trigger if exists documents_prepare on public.documents;
create trigger documents_prepare
before insert or update on public.documents
for each row execute function app.prepare_document();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function app.set_updated_at();

drop trigger if exists documents_capture_version on public.documents;
create trigger documents_capture_version
after insert or update on public.documents
for each row execute function app.capture_document_version();

drop trigger if exists contacts_activity_log on public.contacts;
create trigger contacts_activity_log
after insert or update or delete on public.contacts
for each row execute function app.log_activity();

drop trigger if exists documents_activity_log on public.documents;
create trigger documents_activity_log
after insert or update or delete on public.documents
for each row execute function app.log_activity();

drop trigger if exists document_templates_activity_log on public.document_templates;
create trigger document_templates_activity_log
after insert or update or delete on public.document_templates
for each row execute function app.log_activity();

drop trigger if exists organization_members_activity_log on public.organization_members;
create trigger organization_members_activity_log
after insert or update or delete on public.organization_members
for each row execute function app.log_activity();

drop trigger if exists organization_invitations_activity_log on public.organization_invitations;
create trigger organization_invitations_activity_log
after insert or update or delete on public.organization_invitations
for each row execute function app.log_activity();

drop trigger if exists generated_files_activity_log on public.generated_files;
create trigger generated_files_activity_log
after insert or update or delete on public.generated_files
for each row execute function app.log_activity();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.contacts enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_templates enable row level security;
alter table public.document_template_versions enable row level security;
alter table public.generated_files enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "organizations_select_members" on public.organizations;
create policy "organizations_select_members" on public.organizations
for select using (app.is_org_member(id) or created_by = auth.uid());

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated" on public.organizations
for insert with check (auth.uid() = created_by);

drop policy if exists "organizations_update_admins" on public.organizations;
create policy "organizations_update_admins" on public.organizations
for update using (app.has_org_role(id, 'admin')) with check (app.has_org_role(id, 'admin'));

drop policy if exists "organization_members_select_members" on public.organization_members;
create policy "organization_members_select_members" on public.organization_members
for select using (app.is_org_member(organization_id) or user_id = auth.uid());

drop policy if exists "organization_members_insert_admins" on public.organization_members;
create policy "organization_members_insert_admins" on public.organization_members
for insert with check (
  app.has_org_role(organization_id, 'admin')
  or (
    auth.uid() = user_id
    and role = 'owner'
    and not exists (
      select 1
      from public.organization_members existing_members
      where existing_members.organization_id = organization_members.organization_id
        and existing_members.archived_at is null
    )
  )
);

drop policy if exists "organization_members_update_admins" on public.organization_members;
create policy "organization_members_update_admins" on public.organization_members
for update using (app.has_org_role(organization_id, 'admin')) with check (app.has_org_role(organization_id, 'admin'));

drop policy if exists "organization_invitations_select_members" on public.organization_invitations;
create policy "organization_invitations_select_members" on public.organization_invitations
for select using (app.is_org_member(organization_id));

drop policy if exists "organization_invitations_insert_admins" on public.organization_invitations;
create policy "organization_invitations_insert_admins" on public.organization_invitations
for insert with check (app.has_org_role(organization_id, 'admin'));

drop policy if exists "organization_invitations_update_admins" on public.organization_invitations;
create policy "organization_invitations_update_admins" on public.organization_invitations
for update using (app.has_org_role(organization_id, 'admin')) with check (app.has_org_role(organization_id, 'admin'));

drop policy if exists "organization_invitations_delete_admins" on public.organization_invitations;
create policy "organization_invitations_delete_admins" on public.organization_invitations
for delete using (app.has_org_role(organization_id, 'admin'));

drop policy if exists "contacts_select_members" on public.contacts;
create policy "contacts_select_members" on public.contacts
for select using (app.is_org_member(organization_id));

drop policy if exists "contacts_insert_editors" on public.contacts;
create policy "contacts_insert_editors" on public.contacts
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "contacts_update_editors" on public.contacts;
create policy "contacts_update_editors" on public.contacts
for update using (app.has_org_role(organization_id, 'editor')) with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "documents_select_members" on public.documents;
create policy "documents_select_members" on public.documents
for select using (app.is_org_member(organization_id));

drop policy if exists "documents_insert_editors" on public.documents;
create policy "documents_insert_editors" on public.documents
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "documents_update_editors" on public.documents;
create policy "documents_update_editors" on public.documents
for update using (app.has_org_role(organization_id, 'editor')) with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "document_versions_select_members" on public.document_versions;
create policy "document_versions_select_members" on public.document_versions
for select using (app.is_org_member(organization_id));

drop policy if exists "document_versions_insert_editors" on public.document_versions;
create policy "document_versions_insert_editors" on public.document_versions
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "document_template_versions_select_members" on public.document_template_versions;
create policy "document_template_versions_select_members" on public.document_template_versions
for select using (app.is_org_member(organization_id));

drop policy if exists "document_template_versions_insert_editors" on public.document_template_versions;
create policy "document_template_versions_insert_editors" on public.document_template_versions
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "document_template_versions_update_editors" on public.document_template_versions;
create policy "document_template_versions_update_editors" on public.document_template_versions
for update using (app.has_org_role(organization_id, 'editor')) with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "generated_files_select_members" on public.generated_files;
create policy "generated_files_select_members" on public.generated_files
for select using (app.is_org_member(organization_id));

drop policy if exists "generated_files_insert_editors" on public.generated_files;
create policy "generated_files_insert_editors" on public.generated_files
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "generated_files_storage_select_members" on storage.objects;
create policy "generated_files_storage_select_members" on storage.objects
for select using (
  bucket_id = 'generated-files'
  and app.is_org_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "generated_files_storage_insert_editors" on storage.objects;
create policy "generated_files_storage_insert_editors" on storage.objects
for insert with check (
  bucket_id = 'generated-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
);

drop policy if exists "generated_files_storage_update_editors" on storage.objects;
create policy "generated_files_storage_update_editors" on storage.objects
for update using (
  bucket_id = 'generated-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
)
with check (
  bucket_id = 'generated-files'
  and app.has_org_role((storage.foldername(name))[1]::uuid, 'editor')
);

drop policy if exists "activity_log_select_members" on public.activity_log;
create policy "activity_log_select_members" on public.activity_log
for select using (app.is_org_member(organization_id));

drop policy if exists "activity_log_insert_editors" on public.activity_log;
create policy "activity_log_insert_editors" on public.activity_log
for insert with check (app.has_org_role(organization_id, 'editor'));

drop policy if exists "document_templates_select_allowed" on public.document_templates;
create policy "document_templates_select_allowed" on public.document_templates
for select using (
  (organization_id is not null and app.is_org_member(organization_id))
  or (organization_id is null and is_published = true)
);

drop policy if exists "document_templates_insert_role_based" on public.document_templates;
create policy "document_templates_insert_role_based" on public.document_templates
for insert with check (
  (
    organization_id is not null
    and (
      (coalesce(is_published, false) = false and app.has_org_role(organization_id, 'editor'))
      or app.has_org_role(organization_id, 'admin')
    )
  )
  or (organization_id is null and auth.role() = 'service_role')
);

drop policy if exists "document_templates_update_role_based" on public.document_templates;
create policy "document_templates_update_role_based" on public.document_templates
for update using (
  (
    organization_id is not null
    and (
      (coalesce(is_published, false) = false and app.has_org_role(organization_id, 'editor'))
      or app.has_org_role(organization_id, 'admin')
    )
  )
  or (organization_id is null and auth.role() = 'service_role')
)
with check (
  (
    organization_id is not null
    and (
      (coalesce(is_published, false) = false and app.has_org_role(organization_id, 'editor'))
      or app.has_org_role(organization_id, 'admin')
    )
  )
  or (organization_id is null and auth.role() = 'service_role')
);

do $$
begin
  if to_regclass('public.counter_guarantees') is not null then
    insert into public.profiles (id, email, full_name)
    select distinct legacy.user_id, null, 'Migrated User'
    from public.counter_guarantees legacy
    on conflict (id) do nothing;

    insert into public.organizations (id, name, slug, created_by)
    select
      gen_random_uuid(),
      'Migrated Workspace ' || left(legacy.user_id::text, 8),
      'migrated-' || left(legacy.user_id::text, 8),
      legacy.user_id
    from (
      select distinct user_id
      from public.counter_guarantees
    ) legacy
    where not exists (
      select 1
      from public.organization_members members
      where members.user_id = legacy.user_id
        and members.archived_at is null
    );

    insert into public.organization_members (organization_id, user_id, role)
    select organizations.id, organizations.created_by, 'owner'
    from public.organizations
    where organizations.slug like 'migrated-%'
    on conflict (organization_id, user_id) do nothing;

    insert into public.documents (
      organization_id,
      created_by,
      updated_by,
      status,
      contract_type,
      title,
      payload,
      metadata,
      search_text,
      created_at,
      updated_at
    )
    select
      members.organization_id,
      legacy.user_id,
      legacy.user_id,
      'generated',
      legacy.type,
      coalesce(legacy.data -> 'principal' ->> 'name', legacy.type),
      legacy.data,
      jsonb_build_object(
        'summary',
        jsonb_build_object(
          'principalName', legacy.data -> 'principal' ->> 'name',
          'principalEntity', legacy.data -> 'principal' ->> 'entityName',
          'policyCount', jsonb_array_length(coalesce(legacy.data -> 'policies', '[]'::jsonb))
        ),
        'reporting',
        jsonb_build_object(
          'contractYear',
          nullif(left(coalesce(legacy.data ->> 'contractDate', ''), 4), '')::int
        ),
        'lifecycle',
        jsonb_build_object(
          'currentVersion', 1,
          'versionCount', 1,
          'lastMilestone', 'migrated'
        )
      ),
      trim(
        concat_ws(
          ' ',
          coalesce(legacy.data -> 'principal' ->> 'name', ''),
          coalesce(legacy.data -> 'principal' ->> 'entityName', ''),
          coalesce(
            (
              select string_agg(policy ->> 'number', ' ')
              from jsonb_array_elements(coalesce(legacy.data -> 'policies', '[]'::jsonb)) policy
            ),
            ''
          )
        )
      ),
      legacy.created_at,
      legacy.updated_at
    from public.counter_guarantees legacy
    join public.organization_members members
      on members.user_id = legacy.user_id
     and members.archived_at is null
    where not exists (
      select 1
      from public.documents docs
      where docs.organization_id = members.organization_id
        and docs.created_at = legacy.created_at
        and docs.payload = legacy.data
    );
  end if;

  if to_regclass('public.legacy_contacts') is not null then
    insert into public.profiles (id, email, full_name)
    select distinct legacy.user_id, null, 'Migrated User'
    from public.legacy_contacts legacy
    on conflict (id) do nothing;

    insert into public.contacts (
      organization_id,
      kind,
      external_key,
      party,
      search_text,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    select
      members.organization_id,
      'party',
      coalesce(legacy.party ->> 'idNumber', legacy.party ->> 'cui', legacy.party ->> 'name'),
      legacy.party,
      trim(
        concat_ws(
          ' ',
          coalesce(legacy.party ->> 'name', ''),
          coalesce(legacy.party ->> 'entityName', ''),
          coalesce(legacy.party ->> 'idNumber', ''),
          coalesce(legacy.party ->> 'cui', '')
        )
      ),
      legacy.user_id,
      legacy.user_id,
      legacy.created_at,
      legacy.updated_at
    from public.legacy_contacts legacy
    join public.organization_members members
      on members.user_id = legacy.user_id
     and members.archived_at is null
    on conflict do nothing;
  end if;

  if to_regclass('public.templates') is not null then
    insert into public.document_templates (
      organization_id,
      contract_type,
      name,
      content,
      version,
      status,
      is_published,
      published_at,
      created_at,
      updated_at
    )
    select
      null,
      legacy.type,
      legacy.type,
      legacy.content,
      1,
      'published',
      true,
      legacy.updated_at,
      legacy.updated_at,
      legacy.updated_at
    from public.templates legacy
    where not exists (
      select 1
      from public.document_templates templates
      where templates.organization_id is null
        and templates.contract_type = legacy.type
    );
  end if;
end
$$;

do $$
declare
  template_row record;
  version_id uuid;
begin
  for template_row in
    select *
    from public.document_templates
    where not exists (
      select 1
      from public.document_template_versions versions
      where versions.template_id = document_templates.id
    )
  loop
    insert into public.document_template_versions (
      template_id,
      organization_id,
      version_number,
      content,
      change_note,
      created_by,
      created_at
    )
    values (
      template_row.id,
      template_row.organization_id,
      1,
      template_row.content,
      case when template_row.is_published then 'Migrated published template' else 'Migrated draft template' end,
      coalesce(template_row.updated_by, template_row.created_by),
      coalesce(template_row.updated_at, template_row.created_at, timezone('utc', now()))
    )
    returning id into version_id;

    update public.document_templates
    set
      draft_version_id = version_id,
      published_version_id = case when template_row.is_published then version_id else published_version_id end,
      version = greatest(version, 1),
      published_at = case when template_row.is_published and published_at is null then updated_at else published_at end
    where id = template_row.id;
  end loop;
end
$$;
