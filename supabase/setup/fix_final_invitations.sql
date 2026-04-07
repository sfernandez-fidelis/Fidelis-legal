-- ============================================================
-- CONSOLIDATED FIX: log_activity and invitation accepting
-- ============================================================

-- 1. Ensure log_activity is SECURITY DEFINER and handles tables
--    that don't have certain columns (like archived_at or updated_by)
--    by using dynamic SQL or safer record access.

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
  org_id uuid;
  actor_uuid uuid;
begin
  target := case when tg_op = 'DELETE' then old else new end;
  target_data := to_jsonb(target);
  action_name := lower(tg_table_name) || '.' || lower(tg_op);

  -- Safely check for archived_at using jsonb to avoid column-not-found errors on records
  if tg_op = 'UPDATE' 
     and target_data ? 'archived_at' 
     and (to_jsonb(old) ->> 'archived_at') is distinct from (to_jsonb(new) ->> 'archived_at')
     and (to_jsonb(new) ->> 'archived_at') is not null 
  then
    action_name := lower(tg_table_name) || '.archived';
  end if;

  -- Safely extract organization_id
  org_id := (target_data ->> 'organization_id')::uuid;

  -- Safely extract actor_id, falling back to auth.uid()
  -- Using metadata-based keys first, then fallback
  actor_uuid := coalesce(
    (target_data ->> 'updated_by')::uuid,
    (target_data ->> 'created_by')::uuid,
    (target_data ->> 'invited_by')::uuid, -- Added for invitations/members
    auth.uid()
  );

  insert into public.activity_log (organization_id, entity_type, entity_id, action, actor_id, metadata)
  values (
    org_id,
    tg_table_name,
    target.id,
    action_name,
    actor_uuid,
    jsonb_build_object(
      'table', tg_table_name,
      'op', tg_op,
      'source', 'trigger'
    )
  );

  return case when tg_op = 'DELETE' then old else new end;
exception
  when others then
    -- Fail safe: don't block the actual data operation if logging fails
    -- (Alternatively, remove this if audit is legally mandatory)
    raise warning 'Logging failed for table %: %', tg_table_name, sqlerrm;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- 2. Update organization_invitations RLS to allow viewing own invites
drop policy if exists "organization_invitations_select_own_email" on public.organization_invitations;
create policy "organization_invitations_select_own_email" on public.organization_invitations
for select using (
  email = (select email from public.profiles where id = auth.uid())
  or app.is_org_member(organization_id)
);
