import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import type { CounterGuaranteeData, GeneratedFileData } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { generatedFileService } from '../api/generatedFileService';

export function useGeneratedFilesQuery(documentId?: string) {
  const session = useAppSession();
  const organizationId = session?.activeOrganization.id;

  return useQuery({
    queryKey: queryKeys.generatedFiles(organizationId, documentId ?? ''),
    queryFn: () => generatedFileService.listGeneratedFiles(organizationId!, documentId!),
    enabled: Boolean(organizationId && documentId),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGenerateFileArtifact() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      document,
      templateContent,
      kind,
    }: {
      document: CounterGuaranteeData;
      templateContent?: string;
      kind: 'pdf' | 'docx';
    }) =>
      generatedFileService.createGeneratedArtifact({
        organizationId: session!.activeOrganization.id,
        actorId: session!.user.id,
        document,
        templateContent,
        kind,
      }),
    onSuccess: async (file) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.generatedFiles(session?.activeOrganization.id, file.documentId),
      });
    },
  });
}

export function useReplaceGeneratedFile() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      file,
      previousFileId,
    }: {
      documentId: string;
      file: File;
      previousFileId?: string | null;
    }) =>
      generatedFileService.replaceGeneratedArtifact({
        organizationId: session!.activeOrganization.id,
        actorId: session!.user.id,
        documentId,
        file,
        previousFileId,
      }),
    onSuccess: async (savedFile) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.generatedFiles(session?.activeOrganization.id, savedFile.documentId),
      });
    },
  });
}

export function useDownloadGeneratedFile() {
  return useMutation<void, Error, GeneratedFileData>({
    mutationFn: (file) => generatedFileService.downloadFile(file),
  });
}

export function usePreviewGeneratedFile() {
  return useMutation<string, Error, { bucket: string; path: string }>({
    mutationFn: ({ bucket, path }: { bucket: string; path: string }) =>
      generatedFileService.createSignedPreviewUrl(bucket, path),
  });
}
