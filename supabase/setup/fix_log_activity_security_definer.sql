-- ============================================================
-- FIX: app.log_activity() debe ser SECURITY DEFINER
-- 
-- PROBLEMA: El trigger app.log_activity() corre como SECURITY
-- INVOKER (default). Al insertar en activity_log, la política RLS
-- "activity_log_insert_editors" llama a app.has_org_role(), que
-- requiere que auth.uid() sea válido. Si la sesión JWT está siendo
-- refrescada (o timeout), auth.uid() devuelve null, la política
-- falla, y toda la transacción de organization_invitations se
-- revierte con 400 Bad Request.
--
-- FIX: SECURITY DEFINER + search_path fijo hace que el trigger
-- corra con privilegios de su propietario (postgres), bypass RLS
-- en activity_log, sin dejar de capturar auth.uid() para actor_id.
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
