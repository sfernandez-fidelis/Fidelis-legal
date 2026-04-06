import { saveAs } from 'file-saver';
import { supabase } from '../../../lib/supabase/client';
import type { CounterGuaranteeData, GeneratedFileData } from '../../../types';

const GENERATED_FILES_BUCKET = 'generated-files';

function normalizeGeneratedFile(row: any): GeneratedFileData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    documentId: row.document_id,
    documentVersionId: row.document_version_id ?? null,
    fileKind: row.file_kind,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    createdBy: row.created_by ?? null,
    createdByName: row.creator?.full_name ?? row.creator?.email ?? null,
    createdAt: row.created_at,
    versionLabel:
      row.metadata?.documentVersionNumber != null ? `v${row.metadata.documentVersionNumber}` : row.document_version_id ? 'Versioned' : null,
    metadata: row.metadata ?? {},
  };
}

function buildStoragePath(
  organizationId: string,
  documentId: string,
  kind: GeneratedFileData['fileKind'],
  fileName: string,
) {
  const safeName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  return `${organizationId}/${documentId}/${Date.now()}-${crypto.randomUUID()}-${kind}-${safeName}`;
}

export const generatedFileService = {
  async listGeneratedFiles(organizationId: string, documentId: string): Promise<GeneratedFileData[]> {
    const { data, error } = await supabase
      .from('generated_files')
      .select('*, creator:created_by(full_name, email)')
      .eq('organization_id', organizationId)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeGeneratedFile);
  },

  async createGeneratedArtifact(options: {
    organizationId: string;
    actorId: string;
    document: CounterGuaranteeData;
    templateContent?: string;
    kind: 'pdf' | 'docx';
    source?: 'generated' | 'manual-replacement';
    replacedFileId?: string | null;
  }) {
    const { organizationId, actorId, document, templateContent, kind, source = 'generated', replacedFileId = null } = options;
    if (!document.id) {
      throw new Error('Document id is required');
    }

    const rendered =
      kind === 'pdf'
        ? await import('../../../utils/pdf/pdfGenerator').then((module) => module.renderContractPDF(document, templateContent))
        : await import('../../../utils/word/wordGenerator').then((module) => module.renderWordDocument(document, templateContent));
    const storagePath = buildStoragePath(organizationId, document.id, kind, rendered.fileName);

    const { error: uploadError } = await supabase.storage
      .from(GENERATED_FILES_BUCKET)
      .upload(storagePath, rendered.blob, {
        contentType: rendered.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: latestVersionRow, error: versionError } = await supabase
      .from('document_versions')
      .select('id, version_number')
      .eq('organization_id', organizationId)
      .eq('document_id', document.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      throw versionError;
    }

    const { data, error } = await supabase
      .from('generated_files')
      .insert({
        organization_id: organizationId,
        document_id: document.id,
        document_version_id: latestVersionRow?.id ?? null,
        file_kind: kind,
        storage_bucket: GENERATED_FILES_BUCKET,
        storage_path: storagePath,
        created_by: actorId,
        metadata: {
          fileName: rendered.fileName,
          source,
          templateId: document.templateId ?? null,
          documentVersionNumber: latestVersionRow?.version_number ?? null,
          contentType: rendered.contentType,
          size: rendered.blob.size,
          replacedFileId,
        },
      })
      .select('*, creator:created_by(full_name, email)')
      .single();

    if (error) {
      throw error;
    }

    return normalizeGeneratedFile(data);
  },

  async replaceGeneratedArtifact(options: {
    organizationId: string;
    actorId: string;
    documentId: string;
    previousFileId?: string | null;
    file: File;
  }) {
    const { organizationId, actorId, documentId, previousFileId = null, file } = options;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const kind: GeneratedFileData['fileKind'] =
      extension === 'pdf' ? 'pdf' : extension === 'docx' ? 'docx' : extension === 'html' ? 'html' : 'other';
    const storagePath = buildStoragePath(organizationId, documentId, kind, file.name);

    const { error: uploadError } = await supabase.storage
      .from(GENERATED_FILES_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('generated_files')
      .insert({
        organization_id: organizationId,
        document_id: documentId,
        file_kind: kind,
        storage_bucket: GENERATED_FILES_BUCKET,
        storage_path: storagePath,
        created_by: actorId,
        metadata: {
          fileName: file.name,
          source: 'manual-replacement',
          contentType: file.type || null,
          size: file.size,
          replacedFileId: previousFileId,
        },
      })
      .select('*, creator:created_by(full_name, email)')
      .single();

    if (error) {
      throw error;
    }

    return normalizeGeneratedFile(data);
  },

  async createSignedDownloadUrl(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60, {
      download: true,
    });

    if (error) {
      throw error;
    }

    return data.signedUrl;
  },

  async createSignedPreviewUrl(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  },

  async downloadFile(file: GeneratedFileData) {
    const signedUrl = await this.createSignedDownloadUrl(file.storageBucket, file.storagePath);
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    saveAs(blob, file.metadata?.fileName || file.storagePath.split('/').pop() || `generated-${file.fileKind}`);
  },
};
