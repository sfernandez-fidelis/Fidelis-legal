import type { ContactFilters, DocumentFilters } from '../types';

export const queryKeys = {
  session: () => ['session'] as const,
  teamMembers: (organizationId: string | undefined) => ['teamMembers', organizationId] as const,
  invitations: (organizationId: string | undefined) => ['invitations', organizationId] as const,
  auditLog: (organizationId: string | undefined) => ['auditLog', organizationId] as const,
  documents: (organizationId: string | undefined, filters: DocumentFilters, page: number) =>
    ['documents', organizationId, filters, page] as const,
  document: (organizationId: string | undefined, id: string) => ['document', organizationId, id] as const,
  documentVersions: (organizationId: string | undefined, id: string) =>
    ['documentVersions', organizationId, id] as const,
  generatedFiles: (organizationId: string | undefined, id: string) => ['generatedFiles', organizationId, id] as const,
  generatedFileSignedUrl: (fileId: string) => ['generatedFileSignedUrl', fileId] as const,
  templates: (organizationId?: string) => ['templates', organizationId] as const,
  template: (organizationId: string | undefined, id: string) => ['template', organizationId, id] as const,
  templateVersions: (organizationId: string | undefined, id: string) => ['templateVersions', organizationId, id] as const,
  publishedTemplates: (organizationId?: string) => ['publishedTemplates', organizationId] as const,
  templatePreviewData: (type: string) => ['templatePreviewData', type] as const,
  contacts: (organizationId: string | undefined, filters: ContactFilters, page: number) =>
    ['contacts', organizationId, filters, page] as const,
  contact: (organizationId: string | undefined, id: string) => ['contact', organizationId, id] as const,
  contactSuggestions: (
    organizationId: string | undefined,
    search: string,
    options: { limit?: number; types?: string[]; sort?: string } = {},
  ) => ['contactSuggestions', organizationId, search, options] as const,
};
