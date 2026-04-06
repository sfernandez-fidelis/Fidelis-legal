import { ContractType, type AppSession, type ContactData, type CounterGuaranteeData, type PartyDetails, type TemplateDetailData } from '../types';
import { createEmptyParty } from '../features/contacts/contactUtils';

export function createParty(overrides: Partial<PartyDetails> = {}): PartyDetails {
  return {
    ...createEmptyParty(),
    name: 'Ana Principal',
    age: '32',
    idNumber: '1234567890101',
    cui: '1234567890101',
    entityName: 'Servicios Legales SA',
    notaryName: 'Mario Notario',
    actDate: '2026-01-15',
    regNumber: '15',
    regFolio: '20',
    regBook: '30',
    ...overrides,
  };
}

export function createDocument(overrides: Partial<CounterGuaranteeData> = {}): CounterGuaranteeData {
  return {
    id: 'doc-1',
    organizationId: 'org-1',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    status: 'draft',
    title: 'Documento base',
    templateId: 'tpl-1',
    type: ContractType.COUNTER_GUARANTEE_PRIVATE,
    contractDate: '2026-04-05',
    principal: createParty(),
    guarantors: [createParty({ name: 'Luis Fiador', idNumber: '9876543210101', cui: '9876543210101' })],
    policies: [{ number: 'PZ-001', type: 'Cumplimiento', amount: 5000, amountInWords: 'Cinco mil quetzales' }],
    notificationAddress: 'Zona 10, Ciudad de Guatemala',
    beneficiaryName: 'Municipalidad de Guatemala',
    signatureNames: ['Ana Principal', 'Luis Fiador'],
    createdAt: '2026-04-05T10:00:00.000Z',
    updatedAt: '2026-04-05T11:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

export function createContact(overrides: Partial<ContactData> = {}): ContactData {
  const party = createParty();

  return {
    id: 'contact-1',
    organizationId: 'org-1',
    kind: 'person',
    externalKey: party.idNumber,
    party,
    metadata: {
      displayName: party.name,
      recordType: 'person',
      contactTypes: ['principal'],
      tags: ['vip'],
      useCount: 2,
      lastUsedAt: '2026-04-05T10:00:00.000Z',
      recentDocumentIds: ['doc-1'],
      recentDocumentTitles: ['Documento base'],
      documentLinks: [{ id: 'doc-1', title: 'Documento base', role: 'principal' }],
      source: 'manual',
      duplicateKey: `dpi:${party.idNumber}`,
      mergedIntoId: null,
    },
    displayName: party.name,
    recordType: 'person',
    contactTypes: ['principal'],
    tags: ['vip'],
    createdAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

export function createTemplateDetail(overrides: Partial<TemplateDetailData> = {}): TemplateDetailData {
  return {
    id: 'tpl-1',
    name: 'Counter Guarantee Private',
    type: ContractType.COUNTER_GUARANTEE_PRIVATE,
    content: '<p>Draft</p>',
    organizationId: 'org-1',
    status: 'draft',
    isPublished: true,
    createdAt: '2026-04-04T10:00:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
    publishedAt: '2026-04-05T10:00:00.000Z',
    publishedVersionId: 'ver-1',
    draftVersionId: 'ver-2',
    latestVersionNumber: 2,
    usedByDocuments: 1,
    hasUnpublishedChanges: true,
    publishedContent: '<p>Published</p>',
    draftContent: '<p>Draft</p>',
    versions: [
      {
        id: 'ver-2',
        templateId: 'tpl-1',
        organizationId: 'org-1',
        versionNumber: 2,
        content: '<p>Draft</p>',
        changeNote: 'Draft updated',
        sourceVersionId: 'ver-1',
        createdBy: 'user-1',
        createdAt: '2026-04-05T10:00:00.000Z',
        isPublished: false,
        isDraft: true,
      },
      {
        id: 'ver-1',
        templateId: 'tpl-1',
        organizationId: 'org-1',
        versionNumber: 1,
        content: '<p>Published</p>',
        changeNote: 'Initial publish',
        sourceVersionId: null,
        createdBy: 'user-1',
        createdAt: '2026-04-04T10:00:00.000Z',
        isPublished: true,
        isDraft: false,
      },
    ],
    publishedVersion: {
      id: 'ver-1',
      templateId: 'tpl-1',
      organizationId: 'org-1',
      versionNumber: 1,
      content: '<p>Published</p>',
      changeNote: 'Initial publish',
      sourceVersionId: null,
      createdBy: 'user-1',
      createdAt: '2026-04-04T10:00:00.000Z',
      isPublished: true,
      isDraft: false,
    },
    draftVersion: {
      id: 'ver-2',
      templateId: 'tpl-1',
      organizationId: 'org-1',
      versionNumber: 2,
      content: '<p>Draft</p>',
      changeNote: 'Draft updated',
      sourceVersionId: 'ver-1',
      createdBy: 'user-1',
      createdAt: '2026-04-05T10:00:00.000Z',
      isPublished: false,
      isDraft: true,
    },
    ...overrides,
  };
}

export function createSession(overrides: Partial<AppSession> = {}): AppSession {
  return {
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      user_metadata: {
        full_name: 'Workspace Owner',
      },
    },
    profile: {
      id: 'user-1',
      email: 'owner@example.com',
      fullName: 'Workspace Owner',
    },
    membership: {
      organizationId: 'org-1',
      role: 'owner',
    },
    activeOrganization: {
      id: 'org-1',
      name: 'Workspace Owner Workspace',
      slug: 'workspace-owner-workspace',
    },
    permissions: {
      canManageOrganization: true,
      canEditContent: true,
      canViewAuditLog: true,
    },
    ...overrides,
  };
}
