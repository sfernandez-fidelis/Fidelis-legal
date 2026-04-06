import { useAppSession, useActiveMembership } from './useSessionQuery';

export function usePermissions() {
  const session = useAppSession();
  const role = session?.membership.role;

  return {
    role,
    isViewer: role === 'viewer',
    isEditor: role === 'editor',
    isAdmin: role === 'admin' || role === 'owner',
    canEditContent: Boolean(session?.permissions.canEditContent),
    canManageOrganization: Boolean(session?.permissions.canManageOrganization),
    canViewAuditLog: Boolean(session?.permissions.canViewAuditLog),
  };
}

export function useRoleLabel() {
  const membership = useActiveMembership();
  return membership?.role ?? 'viewer';
}
