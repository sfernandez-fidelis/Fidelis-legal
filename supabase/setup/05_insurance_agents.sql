-- Insurance Agents: table for insurance agent records managed by admins
-- Kept separate from contacts to maintain clean data architecture

create table if not exists public.insurance_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  code text,
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

-- Indexes
create index if not exists insurance_agents_org_active_idx
  on public.insurance_agents (organization_id, is_active, full_name)
  where archived_at is null;

-- Triggers
drop trigger if exists insurance_agents_set_updated_at on public.insurance_agents;
create trigger insurance_agents_set_updated_at
before update on public.insurance_agents
for each row execute function app.set_updated_at();

drop trigger if exists insurance_agents_activity_log on public.insurance_agents;
create trigger insurance_agents_activity_log
after insert or update or delete on public.insurance_agents
for each row execute function app.log_activity();

-- RLS
alter table public.insurance_agents enable row level security;

drop policy if exists "insurance_agents_select_members" on public.insurance_agents;
create policy "insurance_agents_select_members" on public.insurance_agents
for select using (app.is_org_member(organization_id));

drop policy if exists "insurance_agents_insert_admins" on public.insurance_agents;
create policy "insurance_agents_insert_admins" on public.insurance_agents
for insert with check (app.has_org_role(organization_id, 'admin'));

drop policy if exists "insurance_agents_update_admins" on public.insurance_agents;
create policy "insurance_agents_update_admins" on public.insurance_agents
for update using (app.has_org_role(organization_id, 'admin'))
with check (app.has_org_role(organization_id, 'admin'));

drop policy if exists "insurance_agents_delete_admins" on public.insurance_agents;
create policy "insurance_agents_delete_admins" on public.insurance_agents
for delete using (app.has_org_role(organization_id, 'admin'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.insurance_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.insurance_agents TO service_role;

NOTIFY pgrst, 'reload schema';
