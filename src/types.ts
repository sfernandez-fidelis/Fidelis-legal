export enum ContractType {
  COUNTER_GUARANTEE_PRIVATE = 'COUNTER_GUARANTEE_PRIVATE',
  COUNTER_GUARANTEE_PUBLIC = 'COUNTER_GUARANTEE_PUBLIC',
  MORTGAGE_GUARANTEE = 'MORTGAGE_GUARANTEE',
}

export interface PartyDetails {
  name: string;
  age: string;
  birthDate?: string; // ISO yyyy-MM-dd; age is derived from this when present
  maritalStatus: string;
  profession: string;
  domicile: string;
  idNumber: string; // DPI
  cui: string; // 13 digits
  isRepresenting: boolean;
  role?: string; // e.g., "Administrador Único y Representante Legal"
  entityName?: string;
  notaryName?: string;
  actDate?: string;
  regNumber?: string;
  regFolio?: string;
  regBook?: string;
}

export type ContactRecordType = 'person' | 'entity';
export type ContactType = 'principal' | 'guarantor' | 'entity' | 'notary' | 'representative';
export type ContactSort = 'recent' | 'frequent' | 'name';

export interface ContactMetadata {
  displayName?: string;
  normalizedName?: string;
  normalizedEntityName?: string;
  recordType?: ContactRecordType;
  contactTypes?: ContactType[];
  tags?: string[];
  notes?: string;
  useCount?: number;
  lastUsedAt?: string | null;
  recentDocumentIds?: string[];
  recentDocumentTitles?: string[];
  documentLinks?: Array<{
    id: string;
    title?: string;
    role: ContactType;
  }>;
  source?: 'document' | 'manual' | 'merge';
  duplicateKey?: string;
  mergedIntoId?: string | null;
}

export interface Policy {
  number: string;
  type: string;
  amount: number;
  amountInWords: string;
}

export interface DocumentPreviewInsertion {
  anchorId: string;
  text: string;
  preserveEmpty?: boolean;
}

export interface CounterGuaranteeData {
  id?: string;
  organizationId?: string;
  createdBy?: string;
  updatedBy?: string;
  status?: 'draft' | 'ready' | 'generated' | 'archived';
  title?: string;
  contactId?: string | null;
  templateId?: string | null;
  metadata?: DocumentMetadata;
  type: ContractType;
  contractDate: string;
  principal: PartyDetails;
  guarantors: PartyDetails[];
  policies: Policy[];
  notificationAddress: string;
  beneficiaryName: string;
  additionalText?: string;
  previewInsertions?: DocumentPreviewInsertion[];
  signatureNames: string[];
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  organizationId: string;
  versionNumber: number;
  payloadSnapshot: Partial<CounterGuaranteeData>;
  templateSnapshot?: string | null;
  createdBy?: string | null;
  createdAt: string;
  immutableHash?: string | null;
  snapshotReason?: string | null;
  status?: DocumentStatus;
}

export interface DocumentGenerationRecord {
  generatedAt: string;
  format: 'pdf' | 'word';
  actorId?: string;
  label?: string;
}

export interface GeneratedFileData {
  id: string;
  organizationId: string;
  documentId: string;
  documentVersionId?: string | null;
  fileKind: 'pdf' | 'docx' | 'html' | 'other';
  storageBucket: string;
  storagePath: string;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string;
  versionLabel?: string | null;
  metadata?: {
    fileName?: string;
    source?: 'generated' | 'manual-replacement';
    templateId?: string | null;
    templateVersionId?: string | null;
    documentVersionNumber?: number | null;
    contentType?: string | null;
    size?: number | null;
    replacedFileId?: string | null;
  };
}

export interface DocumentMetadata {
  summary?: {
    principalName?: string;
    principalEntity?: string;
    beneficiaryName?: string;
    policyCount?: number;
    guarantorCount?: number;
  };
  reporting?: {
    contractYear?: number | null;
    policyNumbers?: string[];
    documentTypeLabel?: string;
    contactLinks?: Array<{
      contactId: string;
      role: ContactType;
      title?: string;
    }>;
  };
  lifecycle?: {
    versionCount?: number;
    currentVersion?: number;
    lastSavedAt?: string;
    lastGeneratedAt?: string;
    lastGeneratedFormat?: 'pdf' | 'word' | null;
    lastGeneratedLabel?: string | null;
    lastMilestone?: string | null;
  };
  generationHistory?: DocumentGenerationRecord[];
  snapshotReason?: string | null;
}

export interface TemplateData {
  id: string;
  name: string;
  type: ContractType;
  description?: string | null;
  content: string;
  organizationId?: string | null;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  publishedVersionId?: string | null;
  draftVersionId?: string | null;
  latestVersionNumber: number;
  usedByDocuments: number;
  hasUnpublishedChanges: boolean;
  publishedContent?: string | null;
  draftContent?: string | null;
}

export interface TemplateVersionData {
  id: string;
  templateId: string;
  organizationId: string;
  versionNumber: number;
  content: string;
  changeNote?: string | null;
  sourceVersionId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  isPublished: boolean;
  isDraft: boolean;
}

export interface TemplateDetailData extends TemplateData {
  versions: TemplateVersionData[];
  publishedVersion?: TemplateVersionData | null;
  draftVersion?: TemplateVersionData | null;
}

export interface ContactData {
  id: string;
  organizationId: string;
  kind: string;
  externalKey?: string | null;
  party: PartyDetails;
  metadata: ContactMetadata;
  displayName: string;
  recordType: ContactRecordType;
  contactTypes: ContactType[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
}

export type DocumentStatus = 'draft' | 'ready' | 'generated' | 'archived';
export type DocumentSort = 'updated_at:desc' | 'created_at:desc' | 'created_at:asc' | 'title:asc' | 'title:desc';

export interface DocumentFilters {
  search?: string;
  status?: DocumentStatus | 'all';
  contractType?: ContractType | 'all';
  sort?: DocumentSort;
  pageSize?: number;
  savedViewId?: string;
}

export interface SavedDocumentView {
  id: string;
  name: string;
  filters: DocumentFilters;
  createdAt: string;
}

export interface ContactFilters {
  search?: string;
  types?: ContactType[];
  tag?: string;
  sort?: ContactSort;
  duplicatesOnly?: boolean;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

export interface OrganizationMemberData {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invitedBy?: string | null;
  fullName?: string | null;
  email?: string | null;
  createdAt: string;
  archivedAt?: string | null;
}

export interface OrganizationInvitationData {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy?: string | null;
  invitedByName?: string | null;
  token: string;
  acceptedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  createdAt: string;
  metadata: Record<string, any>;
}

export interface AppSession {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
  };
  membership: {
    organizationId: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
  };
  activeOrganization: OrganizationSummary;
  permissions: {
    canManageOrganization: boolean;
    canEditContent: boolean;
    canViewAuditLog: boolean;
  };
}
