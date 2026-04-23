import type { ContactData, ContactMetadata, ContactRecordType, ContactType, PartyDetails } from '../../types';

export const contactTypeLabels: Record<ContactType, string> = {
  principal: 'Principal',
  guarantor: 'Fiador',
  entity: 'Entidad',
  notary: 'Notario',
  representative: 'Representante',
};

export const contactRecordTypeLabels: Record<ContactRecordType, string> = {
  person: 'Persona',
  entity: 'Entidad',
};

export function createEmptyParty(): PartyDetails {
  return {
    name: '',
    age: '',
    birthDate: '',
    maritalStatus: 'casado',
    profession: 'Ejecutivo',
    domicile: 'departamento de Guatemala',
    idNumber: '',
    cui: '',
    isRepresenting: false,
    role: 'ADMINISTRADOR UNICO Y REPRESENTANTE LEGAL',
    entityName: '',
    notaryName: '',
    actDate: '',
    regNumber: '',
    regFolio: '',
    regBook: '',
  };
}

export function normalizeText(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function buildContactDisplayName(party: PartyDetails, metadata?: ContactMetadata) {
  return metadata?.displayName || party.entityName || party.name || 'Contacto sin título';
}

export function buildDuplicateKey(party: PartyDetails, recordType: ContactRecordType) {
  if (party.idNumber) {
    return `dpi:${party.idNumber}`;
  }

  if (party.cui) {
    return `cui:${party.cui}`;
  }

  if (recordType === 'entity' && party.entityName) {
    return `entity:${normalizeText(party.entityName)}`;
  }

  if (party.entityName) {
    return `entity:${normalizeText(party.entityName)}`;
  }

  return `name:${normalizeText(party.name)}`;
}

export function buildContactExternalKey(party: PartyDetails, recordType: ContactRecordType) {
  return party.idNumber || party.cui || (recordType === 'entity' ? party.entityName : '') || party.name;
}

export function buildContactMetadata(
  party: PartyDetails,
  metadata: Partial<ContactMetadata> | undefined,
  recordType: ContactRecordType,
): ContactMetadata {
  return {
    displayName: buildContactDisplayName(party, metadata),
    normalizedName: normalizeText(party.name),
    normalizedEntityName: normalizeText(party.entityName),
    recordType,
    contactTypes: mergeContactTypes(metadata?.contactTypes, recordType),
    tags: mergeUnique(metadata?.tags ?? []),
    notes: metadata?.notes?.trim() || '',
    useCount: metadata?.useCount ?? 0,
    lastUsedAt: metadata?.lastUsedAt ?? null,
    recentDocumentIds: metadata?.recentDocumentIds ?? [],
    recentDocumentTitles: metadata?.recentDocumentTitles ?? [],
    documentLinks: metadata?.documentLinks ?? [],
    source: metadata?.source ?? 'manual',
    duplicateKey: buildDuplicateKey(party, recordType),
    mergedIntoId: metadata?.mergedIntoId ?? null,
  };
}

export function mergePartyDetails(existing: PartyDetails, incoming: PartyDetails) {
  return {
    name: incoming.name || existing.name,
    age: incoming.age || existing.age,
    birthDate: incoming.birthDate || existing.birthDate,
    maritalStatus: incoming.maritalStatus || existing.maritalStatus,
    profession: incoming.profession || existing.profession,
    domicile: incoming.domicile || existing.domicile,
    idNumber: incoming.idNumber || existing.idNumber,
    cui: incoming.cui || existing.cui,
    isRepresenting: incoming.isRepresenting,
    role: incoming.role || existing.role,
    entityName: incoming.entityName || existing.entityName,
    notaryName: incoming.notaryName || existing.notaryName,
    actDate: incoming.actDate || existing.actDate,
    regNumber: incoming.regNumber || existing.regNumber,
    regFolio: incoming.regFolio || existing.regFolio,
    regBook: incoming.regBook || existing.regBook,
  };
}

export function mergeContactTypes(types: ContactType[] | undefined, recordType: ContactRecordType) {
  const baseType = recordType === 'entity' ? 'entity' : 'principal';
  return Array.from(new Set([baseType, ...(types ?? [])])) as ContactType[];
}

export function sortContacts(items: ContactData[], sort: 'recent' | 'frequent' | 'name' = 'recent') {
  return [...items].sort((left, right) => {
    if (sort === 'name') {
      return left.displayName.localeCompare(right.displayName);
    }

    if (sort === 'frequent') {
      const useDelta = (right.metadata.useCount ?? 0) - (left.metadata.useCount ?? 0);
      if (useDelta !== 0) {
        return useDelta;
      }
    }

    const rightDate = right.metadata.lastUsedAt || right.updatedAt || right.createdAt;
    const leftDate = left.metadata.lastUsedAt || left.updatedAt || left.createdAt;
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

export function contactMatchesSearch(contact: ContactData, search: string) {
  const term = normalizeText(search);
  if (!term) {
    return true;
  }

  return [
    contact.displayName,
    contact.party.name,
    contact.party.entityName,
    contact.party.idNumber,
    contact.party.cui,
    contact.party.notaryName,
    contact.tags.join(' '),
    contact.contactTypes.join(' '),
  ]
    .filter(Boolean)
    .some((value) => normalizeText(String(value)).includes(term));
}

export function findDuplicateGroups(contacts: ContactData[]) {
  const groups = new Map<string, ContactData[]>();

  contacts.forEach((contact) => {
    const key = contact.metadata.duplicateKey || buildDuplicateKey(contact.party, contact.recordType);
    if (!key) {
      return;
    }

    const current = groups.get(key) ?? [];
    current.push(contact);
    groups.set(key, current);
  });

  return Array.from(groups.values()).filter((group) => group.length > 1);
}

export function createEntityParty(party: PartyDetails): PartyDetails {
  return {
    ...createEmptyParty(),
    name: party.entityName || party.name,
    entityName: party.entityName || party.name,
    isRepresenting: false,
    role: party.role,
    regBook: party.regBook,
    regFolio: party.regFolio,
    regNumber: party.regNumber,
  };
}

export function createNotaryParty(party: PartyDetails): PartyDetails {
  return {
    ...createEmptyParty(),
    name: party.notaryName || '',
    profession: 'Notario',
    isRepresenting: false,
  };
}
