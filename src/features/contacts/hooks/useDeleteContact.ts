import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContactData, PaginatedResult } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

export function useDeleteContact() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  return useMutation({
    mutationFn: contactService.deleteContact,
    onMutate: async (id) => {
      if (!organizationId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: ['contacts', organizationId] });

      const previousLists = queryClient.getQueriesData<PaginatedResult<ContactData>>({
        queryKey: ['contacts', organizationId],
      });

      for (const [queryKey, value] of previousLists) {
        queryClient.setQueryData<PaginatedResult<ContactData>>(queryKey, (current) => {
          const source = current ?? value;
          if (!source) {
            return source;
          }

          const removed = source.items.some((item) => item.id === id);
          return {
            ...source,
            items: source.items.filter((item) => item.id !== id),
            total: removed ? Math.max(0, source.total - 1) : source.total,
          };
        });
      }

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      for (const [queryKey, value] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, value);
      }
    },
    onSuccess: async () => {
      if (!organizationId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts', organizationId] }),
        queryClient.invalidateQueries({ queryKey: ['contactSuggestions', organizationId] }),
      ]);
    },
  });
}
