import { useMutation } from '@tanstack/react-query';
import type { CounterGuaranteeData } from '../../../types';
import { useDocumentQuery } from './useDocumentQuery';
import { useUpdateDocumentLifecycle } from './useSaveDocument';

export function useDeleteDocument(id?: string) {
  const lifecycleMutation = useUpdateDocumentLifecycle();
  const documentQuery = useDocumentQuery(id);

  return useMutation({
    mutationFn: async (documentId: string) => {
      const document = documentId === id ? documentQuery.data : undefined;
      if (!document) {
        throw new Error('Document not loaded');
      }

      return lifecycleMutation.mutateAsync({
        document: document as CounterGuaranteeData,
        status: 'archived',
        archived: true,
        snapshotReason: 'archived',
      });
    },
  });
}
