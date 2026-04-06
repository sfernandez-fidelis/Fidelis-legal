import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '../../../lib/queryKeys';
import type { DocumentFilters } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { documentService } from '../api/documentService';

export function useDocumentsQuery(filters: DocumentFilters, page: number) {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  const query = useQuery({
    queryKey: queryKeys.documents(organizationId, filters, page),
    queryFn: () => documentService.listDocuments(organizationId!, filters, page),
    enabled: Boolean(organizationId),
    staleTime: 20 * 1000,
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
      queryKey: queryKeys.documents(organizationId, filters, page + 1),
      queryFn: () => documentService.listDocuments(organizationId, filters, page + 1),
      staleTime: 20 * 1000,
    });
  }, [filters, organizationId, page, query.data, queryClient]);

  return query;
}
