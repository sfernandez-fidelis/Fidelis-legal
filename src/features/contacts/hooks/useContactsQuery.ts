import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '../../../lib/queryKeys';
import type { ContactFilters } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

export function useContactsQuery(filters: ContactFilters, page: number) {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  const query = useQuery({
    queryKey: queryKeys.contacts(organizationId, filters, page),
    queryFn: () => contactService.listContacts(organizationId!, filters, page),
    enabled: Boolean(organizationId),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!organizationId || !query.data) {
      return;
    }

    const totalPages = Math.max(1, Math.ceil(query.data.total / query.data.pageSize));
    if (page >= totalPages) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: queryKeys.contacts(organizationId, filters, page + 1),
      queryFn: () => contactService.listContacts(organizationId, filters, page + 1),
      staleTime: 2 * 60 * 1000,
    });
  }, [filters, organizationId, page, query.data, queryClient]);

  return query;
}
