import { describe, expect, it } from 'vitest';
import {
  buildDuplicateKey,
  contactMatchesSearch,
  createEntityParty,
  findDuplicateGroups,
  mergePartyDetails,
  normalizeText,
  sortContacts,
} from './contactUtils';
import { createContact, createParty } from '../../test/fixtures';

describe('contactUtils', () => {
  it('normalizes accents and whitespace for searching', () => {
    expect(normalizeText('  José   María  ')).toBe('jose maria');
  });

  it('builds duplicate keys from strongest identifiers first', () => {
    expect(buildDuplicateKey(createParty(), 'person')).toBe('dpi:1234567890101');
    expect(buildDuplicateKey(createParty({ idNumber: '', cui: '', entityName: 'Ábaco SA' }), 'entity')).toBe('entity:abaco sa');
  });

  it('matches search across nested contact fields', () => {
    expect(contactMatchesSearch(createContact(), 'ana principal')).toBe(true);
    expect(contactMatchesSearch(createContact(), 'vip')).toBe(true);
    expect(contactMatchesSearch(createContact(), 'missing')).toBe(false);
  });

  it('sorts contacts by recency, frequency, and name', () => {
    const contacts = [
      createContact({ id: 'a', displayName: 'Zeta', metadata: { ...createContact().metadata, useCount: 1, lastUsedAt: '2026-04-01T00:00:00.000Z' } }),
      createContact({ id: 'b', displayName: 'Alpha', metadata: { ...createContact().metadata, useCount: 5, lastUsedAt: '2026-04-02T00:00:00.000Z' } }),
    ];

    expect(sortContacts(contacts, 'name')[0].displayName).toBe('Alpha');
    expect(sortContacts(contacts, 'frequent')[0].id).toBe('b');
    expect(sortContacts(contacts, 'recent')[0].id).toBe('b');
  });

  it('groups duplicates and merges party details safely', () => {
    const existing = createParty({ profession: 'Abogada', domicile: 'Zona 14' });
    const incoming = createParty({ profession: '', domicile: 'Zona 10', entityName: 'Nuevo Nombre SA' });

    const merged = mergePartyDetails(existing, incoming);
    expect(merged.profession).toBe('Abogada');
    expect(merged.domicile).toBe('Zona 10');
    expect(createEntityParty(createParty()).entityName).toBe('Servicios Legales SA');

    const duplicates = findDuplicateGroups([
      createContact({ id: '1' }),
      createContact({ id: '2', externalKey: 'other', metadata: { ...createContact().metadata } }),
    ]);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toHaveLength(2);
  });
});
