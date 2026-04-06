import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import type { CounterGuaranteeData, DocumentVersion, PaginatedResult } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { documentService } from '../api/documentService';

export function useDocumentQuery(id?: string) {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  return useQuery({
    queryKey: queryKeys.document(organizationId, id ?? ''),
    queryFn: () => documentService.getDocument(organizationId!, id!),
    enabled: Boolean(organizationId && id),
    staleTime: 60 * 1000,
    gcTime: 20 * 60 * 1000,
    initialData: () => findDocumentInCachedLists(queryClient, organizationId, id),
    initialDataUpdatedAt: () =>
      findDocumentInCachedLists(queryClient, organizationId, id) ? Date.now() - 30 * 1000 : undefined,
  });
}

export function useDocumentVersionsQuery(id?: string) {
  const session = useAppSession();
  const organizationId = session?.activeOrganization.id;

  return useQuery<DocumentVersion[]>({
    queryKey: queryKeys.documentVersions(organizationId, id ?? ''),
    queryFn: () => documentService.listDocumentVersions(organizationId!, id!),
    enabled: Boolean(organizationId && id),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export async function prefetchDocumentDetail(
  queryClient: QueryClient,
  organizationId: string | undefined,
  id: string,
) {
  if (!organizationId) {
    return;
  }

  await queryClient.prefetchQuery({
    queryKey: queryKeys.document(organizationId, id),
    queryFn: () => documentService.getDocument(organizationId, id),
    staleTime: 60 * 1000,
  });
}

function findDocumentInCachedLists(
  queryClient: QueryClient,
  organizationId: string | undefined,
  id?: string,
) {
  if (!organizationId || !id) {
    return undefined;
  }

  const listEntries = queryClient.getQueriesData<PaginatedResult<CounterGuaranteeData>>({
    queryKey: ['documents', organizationId],
  });

  for (const [, list] of listEntries) {
    const match = list?.items.find((item) => item.id === id);
    if (match) {
      return match;
    }
  }

  return undefined;
}
