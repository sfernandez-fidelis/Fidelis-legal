import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { ContractType } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { templateService } from '../api/templateService';

function useTemplateInvalidation() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;

  return async (templateId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.templates(organizationId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.publishedTemplates(organizationId) }),
      templateId ? queryClient.invalidateQueries({ queryKey: queryKeys.template(organizationId, templateId) }) : Promise.resolve(),
    ]);
  };
}

export function useCreateTemplate() {
  const session = useAppSession();
  const invalidate = useTemplateInvalidation();

  return useMutation({
    mutationFn: (type: ContractType) =>
      templateService.createTemplate(session!.activeOrganization.id, session!.user.id, type),
    onSuccess: async (templateId) => {
      await invalidate(templateId);
    },
  });
}

export function useSaveTemplateDraft() {
  const session = useAppSession();
  const invalidate = useTemplateInvalidation();

  return useMutation({
    mutationFn: ({ templateId, content, changeNote }: { templateId: string; content: string; changeNote?: string }) =>
      templateService.saveDraft(session!.activeOrganization.id, session!.user.id, templateId, content, changeNote),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.templateId);
    },
  });
}

export function usePublishTemplate() {
  const session = useAppSession();
  const invalidate = useTemplateInvalidation();

  return useMutation({
    mutationFn: ({ templateId, changeNote }: { templateId: string; changeNote: string }) =>
      templateService.publishTemplate(session!.activeOrganization.id, session!.user.id, templateId, changeNote),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.templateId);
    },
  });
}

export function useRollbackTemplate() {
  const session = useAppSession();
  const invalidate = useTemplateInvalidation();

  return useMutation({
    mutationFn: ({ templateId, versionId, changeNote }: { templateId: string; versionId: string; changeNote?: string }) =>
      templateService.rollbackTemplate(session!.activeOrganization.id, session!.user.id, templateId, versionId, changeNote),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.templateId);
    },
  });
}

export function useArchiveTemplate() {
  const session = useAppSession();
  const invalidate = useTemplateInvalidation();

  return useMutation({
    mutationFn: ({ templateId }: { templateId: string }) =>
      templateService.archiveTemplate(session!.activeOrganization.id, session!.user.id, templateId),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.templateId);
    },
  });
}
