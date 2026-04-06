import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument } from '../../../test/fixtures';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  supabase: {
    from: vi.fn((...args: unknown[]) => mocks.from(...args)),
  },
  contactService: {
    extractDocumentContacts: vi.fn(),
    upsertContact: vi.fn(),
    linkDocumentUsage: vi.fn(),
  },
}));

vi.mock('../../../lib/supabase/client', () => ({
  supabase: mocks.supabase,
}));

vi.mock('../../contacts/api/contactService', () => ({
  contactService: mocks.contactService,
}));

import { documentService } from './documentService';

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.contactService.extractDocumentContacts.mockImplementation((party: any, role: string) => [
      {
        party,
        recordType: party.entityName ? 'entity' : 'person',
        contactTypes: role === 'principal' ? ['principal'] : ['guarantor'],
      },
    ]);
    mocks.contactService.upsertContact.mockResolvedValue('contact-1');
    mocks.contactService.linkDocumentUsage.mockResolvedValue(undefined);
  });

  it('lists documents with normalized payloads', async () => {
    const document = createDocument();

    mocks.from.mockImplementation((table: string) => {
      if (table !== 'documents') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            range: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: document.id,
                      organization_id: document.organizationId,
                      created_by: document.createdBy,
                      updated_by: document.updatedBy,
                      status: document.status,
                      title: document.title,
                      contact_id: 'contact-1',
                      template_id: document.templateId,
                      metadata: document.metadata,
                      contract_type: document.type,
                      payload: {
                        principal: document.principal,
                        guarantors: document.guarantors,
                        policies: document.policies,
                        notificationAddress: document.notificationAddress,
                        beneficiaryName: document.beneficiaryName,
                        signatureNames: document.signatureNames,
                        contractDate: document.contractDate,
                        createdAt: document.createdAt,
                      },
                      created_at: document.createdAt,
                      updated_at: document.updatedAt,
                      archived_at: null,
                    },
                  ],
                  error: null,
                  count: 1,
                }),
              })),
            })),
          })),
        })),
      };
    });

    const result = await documentService.listDocuments('org-1', {}, 1);
    expect(result.total).toBe(1);
    expect(result.items[0]?.principal.name).toBe('Ana Principal');
  });

  it('saves a new document and links generated contacts', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: 'doc-created' },
          error: null,
        }),
      })),
    }));

    mocks.from.mockImplementation((table: string) => {
      if (table !== 'documents') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert,
      };
    });

    const id = await documentService.saveDocument(
      'org-1',
      'user-1',
      createDocument({
        id: undefined,
        title: '',
      }),
      { snapshotReason: 'manual-save' },
    );

    expect(id).toBe('doc-created');
    expect(mocks.contactService.upsertContact).toHaveBeenCalled();
    expect(mocks.contactService.linkDocumentUsage).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
  });
});
