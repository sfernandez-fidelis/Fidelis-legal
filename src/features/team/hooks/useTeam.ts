import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { teamService } from '../api/teamService';

export function useTeamMembersQuery() {
  const session = useAppSession();
  return useQuery({
    queryKey: queryKeys.teamMembers(session?.activeOrganization.id),
    queryFn: () => teamService.listMembers(session!.activeOrganization.id),
    enabled: Boolean(session?.activeOrganization.id),
    staleTime: 60 * 1000,
  });
}

export function useInvitationsQuery() {
  const session = useAppSession();
  return useQuery({
    queryKey: queryKeys.invitations(session?.activeOrganization.id),
    queryFn: () => teamService.listInvitations(session!.activeOrganization.id),
    enabled: Boolean(session?.activeOrganization.id),
    staleTime: 30 * 1000,
  });
}

export function useInviteMember() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; role: 'admin' | 'editor' | 'viewer' }) =>
      teamService.inviteMember(session!.activeOrganization.id, session!.user.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations(session?.activeOrganization.id) });
    },
  });
}

export function useUpdateMemberRole() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'admin' | 'editor' | 'viewer' }) =>
      teamService.updateMemberRole(session!.activeOrganization.id, memberId, role),
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
    mutationFn: ({ invitationId }: { invitationId: string }) =>
      teamService.revokeInvitation(session!.activeOrganization.id, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations(session?.activeOrganization.id) });
    },
  });
}

export function useAuditLogQuery() {
  const session = useAppSession();
  return useQuery({
    queryKey: queryKeys.auditLog(session?.activeOrganization.id),
    queryFn: () => teamService.listAuditLog(session!.activeOrganization.id),
    enabled: Boolean(session?.activeOrganization.id),
    staleTime: 30 * 1000,
  });
}
