import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import type {
  CounterGuaranteeData,
  DocumentFilters,
  DocumentGenerationRecord,
  DocumentStatus,
  PaginatedResult,
} from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { documentService } from '../api/documentService';

interface SaveDocumentVariables {
  document: CounterGuaranteeData;
  snapshotReason?: string | null;
}

interface LifecycleVariables {
  document: CounterGuaranteeData;
  status: DocumentStatus;
  archived?: boolean;
  snapshotReason?: string | null;
  generationRecord?: DocumentGenerationRecord | null;
}

function updateDocumentList(
  current: PaginatedResult<CounterGuaranteeData> | undefined,
  document: CounterGuaranteeData,
  filters: DocumentFilters,
  page: number,
) {
  if (!current) {
    return current;
  }

  if (!matchesDocumentFilters(document, filters)) {
    return {
      ...current,
      items: current.items.filter((item) => item.id !== document.id),
    };
  }

  const existingIndex = current.items.findIndex((item) => item.id === document.id);
  let items = [...current.items];

  if (existingIndex >= 0) {
    items[existingIndex] = { ...items[existingIndex], ...document };
  } else if (page === 1) {
    items = [document, ...items].slice(0, current.pageSize);
  }

  return {
    ...current,
    items,
    total: existingIndex >= 0 ? current.total : current.total + 1,
  };
}

function matchesDocumentFilters(document: CounterGuaranteeData, filters: DocumentFilters) {
  if (filters.status === 'archived') {
    if (!document.archivedAt) {
      return false;
    }
  } else {
    if (document.archivedAt) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && document.status !== filters.status) {
      return false;
    }
  }

  if (filters.contractType && filters.contractType !== 'all' && document.type !== filters.contractType) {
    return false;
  }

  const term = filters.search?.trim().toLowerCase();
  if (!term) {
    return true;
  }

  return [
    document.title,
    document.principal.name,
    document.principal.entityName,
    document.beneficiaryName,
    ...(document.policies ?? []).map((policy) => policy.number),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

function useOptimisticDocumentCache() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  const snapshotLists = async (document?: CounterGuaranteeData) => {
    if (!organizationId) {
      return {
        organizationId,
        previousLists: [],
        previousDetail: undefined,
        optimisticId: undefined,
      };
    }

    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['documents', organizationId] }),
      document?.id
        ? queryClient.cancelQueries({ queryKey: queryKeys.document(organizationId, document.id) })
        : Promise.resolve(),
    ]);

    const previousLists = queryClient.getQueriesData<PaginatedResult<CounterGuaranteeData>>({
      queryKey: ['documents', organizationId],
    });
    const previousDetail = document?.id
      ? queryClient.getQueryData<CounterGuaranteeData>(queryKeys.document(organizationId, document.id))
      : undefined;

    return {
      organizationId,
      previousLists,
      previousDetail,
      optimisticId: document?.id ?? `optimistic-${crypto.randomUUID()}`,
    };
  };

  const writeOptimisticDocument = (
    optimisticDocument: CounterGuaranteeData,
    previousLists: Array<[readonly unknown[], PaginatedResult<CounterGuaranteeData> | undefined]>,
  ) => {
    if (!organizationId) {
      return;
    }

    for (const [queryKey, value] of previousLists) {
      const filters = queryKey[2] as DocumentFilters;
      const page = queryKey[3] as number;
      queryClient.setQueryData<PaginatedResult<CounterGuaranteeData>>(queryKey, updateDocumentList(value, optimisticDocument, filters, page));
    }

    if (optimisticDocument.id) {
      queryClient.setQueryData(queryKeys.document(organizationId, optimisticDocument.id), optimisticDocument);
    }
  };

  const rollback = (context: {
    organizationId?: string;
    previousLists?: Array<[readonly unknown[], PaginatedResult<CounterGuaranteeData> | undefined]>;
    previousDetail?: CounterGuaranteeData;
    existingId?: string;
    optimisticId?: string;
  }) => {
    if (!context.organizationId) {
      return;
    }

    for (const [queryKey, value] of context.previousLists ?? []) {
      queryClient.setQueryData(queryKey, value);
    }

    if (context.existingId && context.previousDetail) {
      queryClient.setQueryData(queryKeys.document(context.organizationId, context.existingId), context.previousDetail);
    }

    if (context.optimisticId) {
      queryClient.removeQueries({ queryKey: queryKeys.document(context.organizationId, context.optimisticId), exact: true });
    }
  };

  const finalize = async (
    id: string,
    document: CounterGuaranteeData,
    context?: { organizationId?: string; optimisticId?: string },
  ) => {
    if (!organizationId) {
      return;
    }

    const finalDocument: CounterGuaranteeData = {
      ...(queryClient.getQueryData<CounterGuaranteeData>(queryKeys.document(organizationId, context?.optimisticId ?? id)) ?? document),
      ...document,
      id,
      organizationId,
    };

    queryClient.setQueryData(queryKeys.document(organizationId, id), finalDocument);

    if (context?.optimisticId && context.optimisticId !== id) {
      queryClient.removeQueries({ queryKey: queryKeys.document(organizationId, context.optimisticId), exact: true });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documents', organizationId] }),
      queryClient.invalidateQueries({ queryKey: ['contacts', organizationId] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.document(organizationId, id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.documentVersions(organizationId, id) }),
    ]);
  };

  return { organizationId, session, snapshotLists, writeOptimisticDocument, rollback, finalize };
}

export function useSaveDocument() {
  const { organizationId, session, snapshotLists, writeOptimisticDocument, rollback, finalize } =
    useOptimisticDocumentCache();

  return useMutation({
    mutationFn: ({ document, snapshotReason }: SaveDocumentVariables) =>
      documentService.saveDocument(organizationId!, session!.user.id, document, { snapshotReason }),
    onMutate: async ({ document }) => {
      const context = await snapshotLists(document);
      const now = new Date().toISOString();
      const optimisticDocument: CounterGuaranteeData = {
        ...document,
        id: context.optimisticId,
        organizationId,
        createdAt: document.createdAt || now,
        updatedAt: now,
        status: document.status ?? 'draft',
      };

      writeOptimisticDocument(optimisticDocument, context.previousLists);

      return {
        ...context,
        existingId: document.id,
      };
    },
    onError: (_error, _variables, context) => {
      rollback(context ?? {});
    },
    onSuccess: async (id, variables, context) => {
      await finalize(id, variables.document, context);
    },
  });
}

export function useUpdateDocumentLifecycle() {
  const { organizationId, session, snapshotLists, writeOptimisticDocument, rollback, finalize } =
    useOptimisticDocumentCache();

  return useMutation({
    mutationFn: ({ document, status, archived, snapshotReason, generationRecord }: LifecycleVariables) =>
      documentService.updateDocumentLifecycle(organizationId!, session!.user.id, document, status, {
        archived,
        snapshotReason,
        generationRecord,
      }),
    onMutate: async (variables) => {
      const context = await snapshotLists(variables.document);
      const optimisticDocument: CounterGuaranteeData = {
        ...variables.document,
        status: variables.status,
        archivedAt: variables.archived ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      writeOptimisticDocument(optimisticDocument, context.previousLists);

      return {
        ...context,
        existingId: variables.document.id,
      };
    },
    onError: (_error, _variables, context) => {
      rollback(context ?? {});
    },
    onSuccess: async (_result, variables, context) => {
      if (variables.document.id) {
        await finalize(variables.document.id, { ...variables.document, status: variables.status }, context);
      }
    },
  });
}

export function useDuplicateDocument() {
  const { organizationId, session, finalize } = useOptimisticDocumentCache();

  return useMutation({
    mutationFn: (document: CounterGuaranteeData) => documentService.duplicateDocument(organizationId!, session!.user.id, document),
    onSuccess: async (id, document) => {
      await finalize(id, { ...document, id, status: 'draft', archivedAt: null });
    },
  });
}
