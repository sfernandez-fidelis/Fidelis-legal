import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

export function useMergeContacts() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;
  const actorId = session?.user.id;

  return useMutation({
    mutationFn: ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) =>
      contactService.mergeContacts(organizationId!, primaryId, duplicateIds, actorId),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts', organizationId] }),
        queryClient.invalidateQueries({ queryKey: ['contactSuggestions', organizationId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.contact(organizationId, variables.primaryId) }),
        ...variables.duplicateIds.map((id) => queryClient.invalidateQueries({ queryKey: queryKeys.contact(organizationId, id) })),
      ]);
    },
  });
}
