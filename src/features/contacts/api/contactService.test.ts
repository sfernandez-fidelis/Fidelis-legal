import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContact, createParty } from '../../../test/fixtures';

const mocks = vi.hoisted(() => {
  return {
    from: vi.fn(),
    supabase: {
      from: vi.fn((...args: unknown[]) => mocks.from(...args)),
    },
  };
});

vi.mock('../../../lib/supabase/client', () => ({
  supabase: mocks.supabase,
}));

import { contactService } from './contactService';

describe('contactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists contacts with client-side filters and pagination', async () => {
    const contact = createContact();

    mocks.from.mockImplementation((table: string) => {
      if (table !== 'contacts') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              ilike: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: contact.id,
                    organization_id: contact.organizationId,
                    kind: contact.kind,
                    external_key: contact.externalKey,
                    party: contact.party,
                    metadata: contact.metadata,
                    created_at: contact.createdAt,
                    updated_at: contact.updatedAt,
                    archived_at: null,
                  },
                ],
                error: null,
              }),
            })),
          })),
        })),
      };
    });

    const result = await contactService.listContacts('org-1', { search: 'ana', sort: 'name' }, 1);
    expect(result.total).toBe(1);
    expect(result.items[0]?.displayName).toBe('Ana Principal');
  });

  it('updates an existing contact when a matching external key is found', async () => {
    const contact = createContact();
    const update = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));

    mocks.from.mockImplementation((table: string) => {
      if (table !== 'contacts') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: contact.id,
                    organization_id: contact.organizationId,
                    kind: contact.kind,
                    external_key: contact.externalKey,
                    party: contact.party,
                    metadata: contact.metadata,
                    created_at: contact.createdAt,
                    updated_at: contact.updatedAt,
                    archived_at: null,
                  },
                  error: null,
                }),
              })),
            })),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: contact.id,
                organization_id: contact.organizationId,
                kind: contact.kind,
                external_key: contact.externalKey,
                party: contact.party,
                metadata: contact.metadata,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt,
                archived_at: null,
              },
              error: null,
            }),
          })),
        })),
        update,
      };
    });

    const id = await contactService.upsertContact('org-1', createParty(), { actorId: 'user-1' });

    expect(id).toBe(contact.id);
    expect(update).toHaveBeenCalled();
  });

  it('extracts related contacts from a represented party', () => {
    const contacts = contactService.extractDocumentContacts(createParty(), 'principal');

    expect(contacts).toHaveLength(3);
    expect(contacts[0]?.contactTypes).toContain('representative');
    expect(contacts[1]?.recordType).toBe('entity');
    expect(contacts[2]?.contactTypes).toEqual(['notary']);
  });
});
