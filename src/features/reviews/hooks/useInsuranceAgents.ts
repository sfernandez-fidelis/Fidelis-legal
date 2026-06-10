import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuranceAgentService, type InsuranceAgent } from '../api/insuranceAgentService';
import { useAppSession } from '../../auth/hooks/useSessionQuery';

const AGENT_KEYS = {
  all: (orgId: string) => ['insuranceAgents', orgId] as const,
};

export function useInsuranceAgentsQuery() {
  const session = useAppSession();
  const orgId = session?.membership.organizationId ?? '';

  return useQuery({
    queryKey: AGENT_KEYS.all(orgId),
    queryFn: () => insuranceAgentService.listAgents(orgId),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes — agent list changes rarely
  });
}

export function useAgentSuggestions(
  search: string,
  options: { limit?: number; enabled?: boolean } = {},
) {
  const session = useAppSession();
  const orgId = session?.membership.organizationId ?? '';

  return useQuery({
    queryKey: ['agentSuggestions', orgId, search, options.limit],
    queryFn: () => insuranceAgentService.searchAgents(orgId, search, options),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    staleTime: search.trim() ? 30 * 1000 : 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useCreateInsuranceAgent() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      fullName: string;
      code?: string;
      email?: string;
      phone?: string;
      notes?: string;
    }) => {
      const orgId = session?.membership.organizationId;
      const actorId = session?.user.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      if (!actorId) throw new Error('Usuario no identificado. Recarga la página.');
      return insuranceAgentService.createAgent(orgId, actorId, payload);
    },
    onSuccess: () => {
      const orgId = session?.membership.organizationId ?? '';
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all(orgId) });
    },
  });
}

export function useUpdateInsuranceAgent() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      ...payload
    }: {
      agentId: string;
      fullName?: string;
      code?: string;
      email?: string;
      phone?: string;
      notes?: string;
      isActive?: boolean;
    }) => {
      const orgId = session?.membership.organizationId;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      return insuranceAgentService.updateAgent(orgId, agentId, payload);
    },
    onSuccess: () => {
      const orgId = session?.membership.organizationId ?? '';
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all(orgId) });
    },
  });
}
