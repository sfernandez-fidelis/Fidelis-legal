-- ============================================================
-- FIX: app.log_activity() debe ser SECURITY DEFINER
-- 
-- PROBLEMA: El trigger app.log_activity() corre como SECURITY
-- INVOKER (default). Al insertar en activity_log, la política RLS
-- "activity_log_insert_editors" llama a app.has_org_role(), que
-- requiere que auth.uid() sea válido. Si la sesión JWT está siendo
-- refrescada (o timeout), auth.uid() devuelve null, la política
-- falla, y toda la transacción de organization_invitations se
-- revierte con 400 Bad Request. Además, asume que todas las
-- tablas tienen la columna 'archived_at', causando errores
-- en tablas como 'document_reviews' que no la tienen.
--
-- FIX: SECURITY DEFINER + search_path fijo + acceso dinámico 
-- a 'archived_at' a través de jsonb.
-- ============================================================

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
    raise warning 'Logging failed for table %: %', tg_table_name, sqlerrm;
    return case when tg_op = 'DELETE' then old else new end;
end;
$$;
