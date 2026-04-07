import { supabase } from '../../../lib/supabase/client';
import type {
  CounterGuaranteeData,
  DocumentFilters,
  DocumentGenerationRecord,
  DocumentMetadata,
  DocumentSort,
  DocumentStatus,
  DocumentVersion,
  PaginatedResult,
} from '../../../types';
import { ContractType } from '../../../types';
import { contactService } from '../../contacts/api/contactService';

const PAGE_SIZE = 10;

interface SaveDocumentOptions {
  snapshotReason?: string | null;
}

function normalizeDocument(row: any): CounterGuaranteeData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    status: row.status,
    title: row.title,
    contactId: row.contact_id,
    templateId: row.template_id,
    metadata: row.metadata ?? undefined,
    type: row.contract_type,
    ...(row.payload ?? row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  } as CounterGuaranteeData;
}

function normalizeVersion(row: any): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    organizationId: row.organization_id,
    versionNumber: row.version_number,
    payloadSnapshot: row.payload_snapshot ?? {},
    templateSnapshot: row.template_snapshot,
    createdBy: row.created_by,
    createdAt: row.created_at,
    immutableHash: row.immutable_hash,
    snapshotReason: row.snapshot_reason ?? null,
    status: row.status ?? row.payload_snapshot?.status,
  };
}

function buildDocumentTitle(document: CounterGuaranteeData) {
  return [document.principal.name, document.contractDate].filter(Boolean).join(' - ');
}

function buildDocumentSearchText(document: CounterGuaranteeData) {
  return [
    document.title,
    document.principal.name,
    document.principal.entityName,
    document.beneficiaryName,
    ...(document.policies ?? []).map((policy) => policy.number),
    ...(document.guarantors ?? []).map((guarantor) => guarantor.name),
  ]
    .filter(Boolean)
    .join(' ');
}

function getContractTypeLabel(type: ContractType) {
  switch (type) {
    case ContractType.COUNTER_GUARANTEE_PRIVATE:
      return 'Contragarantía privada';
    case ContractType.COUNTER_GUARANTEE_PUBLIC:
      return 'Contragarantía pública';
    case ContractType.MORTGAGE_GUARANTEE:
      return 'Garantía hipotecaria';
    default:
      return 'Documento legal';
  }
}

function buildMetadata(
  document: CounterGuaranteeData,
  existingMetadata?: DocumentMetadata,
  overrides?: Partial<DocumentMetadata>,
): DocumentMetadata {
  const currentVersion = existingMetadata?.lifecycle?.currentVersion ?? 1;

  return {
    ...existingMetadata,
    ...overrides,
    summary: {
      ...existingMetadata?.summary,
      ...overrides?.summary,
      principalName: document.principal.name,
      principalEntity: document.principal.entityName,
      beneficiaryName: document.beneficiaryName,
      policyCount: document.policies.length,
      guarantorCount: document.guarantors.length,
    },
    reporting: {
      ...existingMetadata?.reporting,
      ...overrides?.reporting,
      contractYear: document.contractDate ? Number(document.contractDate.slice(0, 4)) : null,
      policyNumbers: document.policies.map((policy) => policy.number).filter(Boolean),
      documentTypeLabel: getContractTypeLabel(document.type),
    },
    lifecycle: {
      ...existingMetadata?.lifecycle,
      ...overrides?.lifecycle,
      currentVersion,
      lastSavedAt: new Date().toISOString(),
    },
    generationHistory: overrides?.generationHistory ?? existingMetadata?.generationHistory ?? [],
    snapshotReason: overrides?.snapshotReason ?? null,
  };
}

async function persistDocumentContacts(
  organizationId: string,
  actorId: string,
  document: CounterGuaranteeData,
) {
  const links: Array<{ contactId: string; role: 'principal' | 'guarantor' | 'entity' | 'notary' | 'representative'; title?: string }> = [];

  for (const extracted of contactService.extractDocumentContacts(document.principal, 'principal')) {
    if (!extracted.party.name && !extracted.party.entityName) {
      continue;
    }

    const contactId = await contactService.upsertContact(organizationId, extracted.party, {
      actorId,
      recordType: extracted.recordType,
      contactTypes: extracted.contactTypes,
      tags: ['document-captured'],
      source: 'document',
    });

    links.push(...extracted.contactTypes.map((role) => ({ contactId, role, title: document.title })));
  }

  for (const guarantor of document.guarantors) {
    for (const extracted of contactService.extractDocumentContacts(guarantor, 'guarantor')) {
      if (!extracted.party.name && !extracted.party.entityName) {
        continue;
      }

      const contactId = await contactService.upsertContact(organizationId, extracted.party, {
        actorId,
        recordType: extracted.recordType,
        contactTypes: extracted.contactTypes,
        tags: ['document-captured'],
        source: 'document',
      });

      links.push(...extracted.contactTypes.map((role) => ({ contactId, role, title: document.title })));
    }
  }

  return links;
}

export const documentService = {
  async listDocuments(
    organizationId: string,
    filters: DocumentFilters,
    page: number,
  ): Promise<PaginatedResult<CounterGuaranteeData>> {
    const pageSize = filters.pageSize ?? PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .range(from, to);

    const trimmedSearch = filters.search?.trim();
    if (trimmedSearch) {
      query = query.ilike('search_text', `%${trimmedSearch}%`);
    }

    if (filters.status === 'archived') {
      query = query.not('archived_at', 'is', null);
    } else {
      query = query.is('archived_at', null);
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.contractType && filters.contractType !== 'all') {
      query = query.eq('contract_type', filters.contractType);
    }

    const { column, ascending } = parseSort(filters.sort);
    query = query.order(column, { ascending });

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    return {
      items: (data ?? []).map(normalizeDocument),
      page,
      pageSize,
      total: count ?? 0,
    };
  },

  async getDocument(organizationId: string, id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return normalizeDocument(data);
  },

  async listDocumentVersions(organizationId: string, id: string) {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_id', id)
      .order('version_number', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeVersion);
  },

  async saveDocument(
    organizationId: string,
    actorId: string,
    document: CounterGuaranteeData,
    options: SaveDocumentOptions = {},
  ) {
    const links = await persistDocumentContacts(organizationId, actorId, document);
    const contactId = links.find((link) => link.role === 'principal')?.contactId ?? null;

    const {
      id,
      createdAt,
      updatedAt: _updatedAt,
      archivedAt: _archivedAt,
      organizationId: _organizationId,
      createdBy: _createdBy,
      updatedBy: _documentUpdatedBy,
      status,
      title,
      contactId: _existingContactId,
      templateId,
      metadata,
      ...dataToSave
    } = document;

    const nextTitle = title || buildDocumentTitle(document);
    const nextSearchText = buildDocumentSearchText(document);
    const nextMetadata = buildMetadata(document, metadata, {
      snapshotReason: options.snapshotReason ?? null,
      summary: {
        ...metadata?.summary,
      },
      reporting: {
        ...metadata?.reporting,
      },
    });
    nextMetadata.reporting = {
      ...nextMetadata.reporting,
      contactLinks: links,
    };
    const nextStatus = status ?? 'draft';

    if (id) {
      const { error } = await supabase
        .from('documents')
        .update({
          payload: dataToSave,
          contract_type: document.type,
          title: nextTitle,
          contact_id: contactId,
          template_id: templateId ?? null,
          search_text: nextSearchText,
          status: nextStatus,
          metadata: nextMetadata,
          updated_by: actorId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      await contactService.linkDocumentUsage(
        organizationId,
        actorId,
        links.map((link) => ({ ...link, documentId: id, title: nextTitle })),
      );

      return id;
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        created_by: actorId,
        updated_by: actorId,
        status: nextStatus,
        contract_type: document.type,
        title: nextTitle,
        contact_id: contactId,
        template_id: templateId ?? null,
        payload: dataToSave,
        metadata: nextMetadata,
        search_text: nextSearchText,
        created_at: createdAt,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    await contactService.linkDocumentUsage(
      organizationId,
      actorId,
      links.map((link) => ({ ...link, documentId: data.id, title: nextTitle })),
    );

    return data.id;
  },

  async updateDocumentLifecycle(
    organizationId: string,
    actorId: string,
    document: CounterGuaranteeData,
    status: DocumentStatus,
    extra?: {
      archived?: boolean;
      snapshotReason?: string | null;
      generationRecord?: DocumentGenerationRecord | null;
    },
  ) {
    if (!document.id) {
      throw new Error('Document id is required');
    }

    const generationHistory = extra?.generationRecord
      ? [extra.generationRecord, ...(document.metadata?.generationHistory ?? [])].slice(0, 10)
      : document.metadata?.generationHistory ?? [];
    const metadata = buildMetadata(document, document.metadata, {
      lifecycle: {
        ...document.metadata?.lifecycle,
        lastMilestone: extra?.snapshotReason ?? status,
        lastGeneratedAt: extra?.generationRecord?.generatedAt ?? document.metadata?.lifecycle?.lastGeneratedAt,
        lastGeneratedFormat: extra?.generationRecord?.format ?? document.metadata?.lifecycle?.lastGeneratedFormat ?? null,
        lastGeneratedLabel: extra?.generationRecord?.label ?? document.metadata?.lifecycle?.lastGeneratedLabel ?? null,
      },
      generationHistory,
      snapshotReason: extra?.snapshotReason ?? status,
    });

    const { error } = await supabase
      .from('documents')
      .update({
        status,
        archived_at: extra?.archived ? new Date().toISOString() : null,
        metadata,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.id)
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }
  },

  async duplicateDocument(organizationId: string, actorId: string, document: CounterGuaranteeData) {
    const duplicatedDocument: CounterGuaranteeData = {
      ...document,
      id: undefined,
      status: 'draft',
      title: `${document.title ?? buildDocumentTitle(document)} (copia)`,
      metadata: buildMetadata(document, document.metadata, {
        lifecycle: {
          currentVersion: 1,
          versionCount: 1,
          lastMilestone: 'duplicated',
        },
        generationHistory: [],
        snapshotReason: 'duplicated',
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };

    return this.saveDocument(organizationId, actorId, duplicatedDocument, { snapshotReason: 'duplicated' });
  },
};

function parseSort(sort: DocumentSort | undefined) {
  switch (sort) {
    case 'created_at:asc':
      return { column: 'created_at', ascending: true };
    case 'title:asc':
      return { column: 'title', ascending: true };
    case 'title:desc':
      return { column: 'title', ascending: false };
    case 'updated_at:desc':
      return { column: 'updated_at', ascending: false };
    case 'created_at:desc':
    default:
      return { column: 'created_at', ascending: false };
  }
}
