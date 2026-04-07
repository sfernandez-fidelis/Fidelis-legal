-- ============================================================
-- FIX 1: Permitir que un usuario vea invitaciones dirigidas
--         a su propio email (para poder aceptarlas al login)
--
-- PROBLEMA: La política SELECT de organization_invitations
-- solo permite a miembros de la organización ver invitaciones.
-- Un usuario recién invitado AÚN NO ES MIEMBRO, así que
-- acceptPendingInvitations() en authService.ts nunca encuentra
-- invitaciones → el usuario no puede unirse a la org.
--
-- FIX: Agregar política adicional que permite a cualquier
-- usuario autenticado ver invitaciones dirigidas a su email.
-- ============================================================

drop policy if exists "organization_invitations_select_own_email" on public.organization_invitations;
create policy "organization_invitations_select_own_email" on public.organization_invitations
for select using (
  -- El usuario puede ver invitaciones que tienen su email (para aceptarlas)
  email = (select email from public.profiles where id = auth.uid())
  -- O ya es miembro de esa org (para que los admins vean las pendientes)
  or app.is_org_member(organization_id)
);

-- Eliminar la política anterior que era más restrictiva
drop policy if exists "organization_invitations_select_members" on public.organization_invitations;


-- ============================================================
-- FIX 2: app.log_activity() debe ser SECURITY DEFINER
-- (por si no se aplicó antes)
--
-- PROBLEMA: El trigger corre como SECURITY INVOKER. Si
-- auth.uid() es null en ese momento (refresh de sesión),
-- la política RLS de activity_log falla y la transacción
-- completa de organization_invitations falla con 400.
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
