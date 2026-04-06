import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { ContractType, type CounterGuaranteeData } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { getDefaultTemplate } from '../api/defaultTemplates';
import { templateService } from '../api/templateService';
import { getTemplatePreviewData } from '../previewData';

export function useTemplatesQuery() {
  const session = useAppSession();

  return useQuery({
    queryKey: queryKeys.templates(session?.activeOrganization.id),
    queryFn: () => templateService.listTemplates(session!.activeOrganization.id),
    enabled: Boolean(session?.activeOrganization.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTemplateQuery(id?: string) {
  const session = useAppSession();

  return useQuery({
    queryKey: queryKeys.template(session?.activeOrganization.id, id ?? ''),
    queryFn: () => templateService.getTemplate(session!.activeOrganization.id, id!),
    enabled: Boolean(session?.activeOrganization.id && id),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function usePublishedTemplatesQuery() {
  const session = useAppSession();

  return useQuery({
    queryKey: queryKeys.publishedTemplates(session?.activeOrganization.id),
    queryFn: () => templateService.listPublishedTemplates(session!.activeOrganization.id),
    enabled: Boolean(session?.activeOrganization.id),
    staleTime: 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

export function useTemplateContent(type: ContractType) {
  const templatesQuery = usePublishedTemplatesQuery();
  const template = templatesQuery.data?.find((item) => item.type === type);

  return {
    ...templatesQuery,
    template,
    content: template?.publishedContent ?? template?.content ?? getDefaultTemplate(type),
  };
}

export function useTemplatePreviewData(type: ContractType, enabled: boolean) {
  return useQuery<CounterGuaranteeData>({
    queryKey: queryKeys.templatePreviewData(type),
    queryFn: async () => getTemplatePreviewData(type),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
