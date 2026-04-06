import { supabase } from '../../../lib/supabase/client';
import type {
  ContactData,
  ContactFilters,
  ContactMetadata,
  ContactRecordType,
  ContactType,
  PaginatedResult,
  PartyDetails,
} from '../../../types';
import {
  buildContactDisplayName,
  buildContactExternalKey,
  buildContactMetadata,
  contactMatchesSearch,
  createEntityParty,
  createNotaryParty,
  findDuplicateGroups,
  mergePartyDetails,
  mergeUnique,
  normalizeText,
  sortContacts,
} from '../contactUtils';

const PAGE_SIZE = 10;

interface SaveContactOptions {
  actorId?: string;
  existingId?: string | null;
  recordType?: ContactRecordType;
  contactTypes?: ContactType[];
  tags?: string[];
  notes?: string;
  source?: 'document' | 'manual' | 'merge';
}

function hydrateContact(row: any): ContactData {
  const party = (row.party ?? {}) as PartyDetails;
  const metadata = buildContactMetadata(
    party,
    {
      ...(row.metadata ?? {}),
      recordType: row.metadata?.recordType ?? (row.kind === 'entity' ? 'entity' : 'person'),
    },
    row.metadata?.recordType ?? (row.kind === 'entity' ? 'entity' : 'person'),
  );

  return {
    id: row.id,
    organizationId: row.organization_id,
    kind: row.kind,
    externalKey: row.external_key,
    party,
    metadata,
    displayName: buildContactDisplayName(party, metadata),
    recordType: metadata.recordType ?? 'person',
    contactTypes: metadata.contactTypes ?? [],
    tags: metadata.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function buildSearchText(party: PartyDetails, metadata: ContactMetadata) {
  return [
    party.name,
    party.entityName,
    party.idNumber,
    party.cui,
    party.notaryName,
    metadata.displayName,
    ...(metadata.tags ?? []),
    ...(metadata.contactTypes ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

function applyContactFilters(items: ContactData[], filters: ContactFilters) {
  let nextItems = items;

  if (filters.search?.trim()) {
    nextItems = nextItems.filter((contact) => contactMatchesSearch(contact, filters.search!));
  }

  if (filters.types?.length) {
    nextItems = nextItems.filter((contact) => filters.types?.some((type) => contact.contactTypes.includes(type)));
  }

  if (filters.tag?.trim()) {
    const tag = normalizeText(filters.tag);
    nextItems = nextItems.filter((contact) => contact.tags.some((item) => normalizeText(item) === tag));
  }

  if (filters.duplicatesOnly) {
    const duplicateIds = new Set(findDuplicateGroups(nextItems).flatMap((group) => group.map((item) => item.id)));
    nextItems = nextItems.filter((contact) => duplicateIds.has(contact.id));
  }

  return sortContacts(nextItems, filters.sort);
}

async function loadOrganizationContacts(organizationId: string, search?: string) {
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', organizationId)
    .is('archived_at', null);

  if (search?.trim()) {
    query = query.ilike('search_text', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map(hydrateContact);
}

function buildPayload(
  party: PartyDetails,
  existing: ContactData | null,
  options: SaveContactOptions,
) {
  const recordType = options.recordType ?? existing?.recordType ?? (party.entityName ? 'entity' : 'person');
  const mergedParty = existing ? mergePartyDetails(existing.party, party) : party;
  const metadata = buildContactMetadata(
    mergedParty,
    {
      ...(existing?.metadata ?? {}),
      contactTypes: mergeUnique([...(existing?.contactTypes ?? []), ...(options.contactTypes ?? [])]) as ContactType[],
      tags: mergeUnique([...(existing?.tags ?? []), ...(options.tags ?? [])]),
      notes: options.notes ?? existing?.metadata.notes,
      source: options.source ?? existing?.metadata.source,
    },
    recordType,
  );

  return {
    kind: recordType,
    external_key: buildContactExternalKey(mergedParty, recordType),
    party: mergedParty,
    metadata,
    search_text: buildSearchText(mergedParty, metadata),
  };
}

async function findExistingContact(
  organizationId: string,
  party: PartyDetails,
  options: SaveContactOptions,
) {
  if (options.existingId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', options.existingId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? hydrateContact(data) : null;
  }

  const recordType = options.recordType ?? (party.entityName ? 'entity' : 'person');
  const externalKey = buildContactExternalKey(party, recordType);

  if (externalKey) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('external_key', externalKey)
      .is('archived_at', null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return hydrateContact(data);
    }
  }

  const term = party.idNumber || party.cui || party.entityName || party.name;
  if (!term) {
    return null;
  }

  const matches = await loadOrganizationContacts(organizationId, term);
  const exactMatch = matches.find((contact) => {
    if (party.idNumber && contact.party.idNumber === party.idNumber) {
      return true;
    }

    if (party.cui && contact.party.cui === party.cui) {
      return true;
    }

    if (party.entityName && normalizeText(contact.party.entityName) === normalizeText(party.entityName)) {
      return true;
    }

    return normalizeText(contact.party.name) === normalizeText(party.name);
  });

  return exactMatch ?? null;
}

async function incrementUsage(contact: ContactData, organizationId: string, actorId: string | undefined, documentLink?: {
  id: string;
  title?: string;
  role: ContactType;
}) {
  const recentDocumentIds = mergeUnique([...(contact.metadata.recentDocumentIds ?? []), documentLink?.id ?? '']).slice(-8);
  const recentDocumentTitles = mergeUnique([...(contact.metadata.recentDocumentTitles ?? []), documentLink?.title ?? '']).slice(-8);
  const documentLinks = documentLink
    ? [
        documentLink,
        ...(contact.metadata.documentLinks ?? []).filter((item) => item.id !== documentLink.id || item.role !== documentLink.role),
      ].slice(0, 12)
    : contact.metadata.documentLinks ?? [];
  const metadata = {
    ...contact.metadata,
    useCount: (contact.metadata.useCount ?? 0) + 1,
    lastUsedAt: new Date().toISOString(),
    recentDocumentIds,
    recentDocumentTitles,
    documentLinks,
  };

  const { error } = await supabase
    .from('contacts')
    .update({
      metadata,
      updated_by: actorId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contact.id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}

export const contactService = {
  async listContacts(
    organizationId: string,
    filters: ContactFilters,
    page: number,
  ): Promise<PaginatedResult<ContactData>> {
    const pageSize = filters.pageSize ?? PAGE_SIZE;
    const allContacts = await loadOrganizationContacts(organizationId, filters.search);
    const filtered = applyContactFilters(allContacts, filters);
    const from = (page - 1) * pageSize;
    const items = filtered.slice(from, from + pageSize);

    return {
      items,
      page,
      pageSize,
      total: filtered.length,
    };
  },

  async getContact(organizationId: string, id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return hydrateContact(data);
  },

  async searchContacts(
    organizationId: string,
    search: string,
    options: { limit?: number; types?: ContactType[]; sort?: 'recent' | 'frequent' | 'name' } = {},
  ) {
    const items = await loadOrganizationContacts(organizationId, search);
    const filtered = applyContactFilters(items, {
      search,
      types: options.types,
      sort: options.sort ?? (search.trim() ? 'frequent' : 'recent'),
    });
    return filtered.slice(0, options.limit ?? 8);
  },

  async upsertContact(organizationId: string, party: PartyDetails, options: SaveContactOptions = {}) {
    const existing = await findExistingContact(organizationId, party, options);
    const payload = buildPayload(party, existing, options);

    if (existing) {
      const { error } = await supabase
        .from('contacts')
        .update({
          ...payload,
          updated_by: options.actorId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw error;
      }

      return existing.id;
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        ...payload,
        created_by: options.actorId ?? null,
        updated_by: options.actorId ?? null,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  },

  async updateContact(
    organizationId: string,
    id: string,
    party: PartyDetails,
    metadata: Partial<ContactMetadata>,
    actorId?: string,
  ) {
    const existing = await this.getContact(organizationId, id);
    const payload = buildPayload(party, existing, {
      actorId,
      existingId: id,
      recordType: metadata.recordType ?? existing.recordType,
      contactTypes: metadata.contactTypes ?? existing.contactTypes,
      tags: metadata.tags ?? existing.tags,
      notes: metadata.notes ?? existing.metadata.notes,
      source: existing.metadata.source ?? 'manual',
    });

    const { error } = await supabase
      .from('contacts')
      .update({
        ...payload,
        updated_by: actorId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }

    return id;
  },

  async deleteContact(id: string) {
    const { error } = await supabase
      .from('contacts')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async mergeContacts(organizationId: string, primaryId: string, duplicateIds: string[], actorId?: string) {
    const primary = await this.getContact(organizationId, primaryId);
    const duplicates = await Promise.all(duplicateIds.map((id) => this.getContact(organizationId, id)));

    const mergedParty = duplicates.reduce((current, duplicate) => mergePartyDetails(current, duplicate.party), primary.party);
    const mergedMetadata = duplicates.reduce<ContactMetadata>(
      (current, duplicate) => ({
        ...current,
        contactTypes: mergeUnique([...(current.contactTypes ?? []), ...duplicate.contactTypes]) as ContactType[],
        tags: mergeUnique([...(current.tags ?? []), ...duplicate.tags]),
        useCount: (current.useCount ?? 0) + (duplicate.metadata.useCount ?? 0),
        recentDocumentIds: mergeUnique([...(current.recentDocumentIds ?? []), ...(duplicate.metadata.recentDocumentIds ?? [])]).slice(-8),
        recentDocumentTitles: mergeUnique([
          ...(current.recentDocumentTitles ?? []),
          ...(duplicate.metadata.recentDocumentTitles ?? []),
        ]).slice(-8),
        documentLinks: [...(current.documentLinks ?? []), ...(duplicate.metadata.documentLinks ?? [])].slice(0, 12),
      }),
      primary.metadata,
    );

    await this.updateContact(organizationId, primaryId, mergedParty, mergedMetadata, actorId);

    if (duplicateIds.length) {
      const { error: archiveError } = await supabase
        .from('contacts')
        .update({
          archived_at: new Date().toISOString(),
          metadata: {
            mergedIntoId: primaryId,
            source: 'merge',
          },
          updated_by: actorId ?? null,
          updated_at: new Date().toISOString(),
        })
        .in('id', duplicateIds)
        .eq('organization_id', organizationId);

      if (archiveError) {
        throw archiveError;
      }

      const { error: documentError } = await supabase
        .from('documents')
        .update({
          contact_id: primaryId,
          updated_by: actorId ?? null,
          updated_at: new Date().toISOString(),
        })
        .in('contact_id', duplicateIds)
        .eq('organization_id', organizationId);

      if (documentError) {
        throw documentError;
      }
    }
  },

  async linkDocumentUsage(
    organizationId: string,
    actorId: string | undefined,
    links: Array<{ contactId: string; role: ContactType; documentId: string; title?: string }>,
  ) {
    for (const link of links) {
      const contact = await this.getContact(organizationId, link.contactId);
      await incrementUsage(contact, organizationId, actorId, {
        id: link.documentId,
        title: link.title,
        role: link.role,
      });
    }
  },

  extractDocumentContacts(party: PartyDetails, role: 'principal' | 'guarantor') {
    const contacts: Array<{ party: PartyDetails; recordType: ContactRecordType; contactTypes: ContactType[] }> = [
      {
        party,
        recordType: party.entityName ? 'entity' : 'person',
        contactTypes: party.isRepresenting ? [role, 'representative'] : [role],
      },
    ];

    if (party.entityName) {
      contacts.push({
        party: createEntityParty(party),
        recordType: 'entity',
        contactTypes: ['entity'],
      });
    }

    if (party.notaryName) {
      contacts.push({
        party: createNotaryParty(party),
        recordType: 'person',
        contactTypes: ['notary'],
      });
    }

    return contacts;
  },
};
