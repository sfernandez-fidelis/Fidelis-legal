import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { teamService } from '../api/teamService';

export function useTeamMembersQuery() {
  const session = useAppSession();
  const orgId = session?.activeOrganization.id;
  return useQuery({
    queryKey: queryKeys.teamMembers(orgId),
    queryFn: () => teamService.listMembers(orgId!),
    enabled: Boolean(orgId),
    staleTime: 60 * 1000,
  });
}

export function useInvitationsQuery() {
  const session = useAppSession();
  const orgId = session?.activeOrganization.id;
  return useQuery({
    queryKey: queryKeys.invitations(orgId),
    queryFn: () => teamService.listInvitations(orgId!),
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
}

export function useInviteMember() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; role: 'admin' | 'editor' | 'viewer' }) => {
      const orgId = session?.activeOrganization.id;
      const actorId = session?.user.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      if (!actorId) throw new Error('Usuario no identificado. Recarga la página.');
      return teamService.inviteMember(orgId, actorId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations(session?.activeOrganization.id) });
    },
  });
}

export function useUpdateMemberRole() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'admin' | 'editor' | 'viewer' }) => {
      const orgId = session?.activeOrganization.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      return teamService.updateMemberRole(orgId, memberId, role);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(session?.activeOrganization.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    },
  });
}

export function useRevokeInvitation() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId }: { invitationId: string }) => {
      const orgId = session?.activeOrganization.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      return teamService.revokeInvitation(orgId, invitationId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations(session?.activeOrganization.id) });
    },
  });
}

export function useAuditLogQuery() {
  const session = useAppSession();
  const orgId = session?.activeOrganization.id;
  return useQuery({
    queryKey: queryKeys.auditLog(orgId),
    queryFn: () => teamService.listAuditLog(orgId!),
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
}
