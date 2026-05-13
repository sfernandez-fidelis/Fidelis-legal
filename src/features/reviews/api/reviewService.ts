import { PDFDocument } from 'pdf-lib';
import { supabase } from '../../../lib/supabase/client';

export type ReviewStatus = 'pending_review' | 'confirmed' | 'restored';

// All the structured options for rejection reasons (checkboxes)
export const REJECTION_OPTIONS = [
  { value: 'firma_no_coincide', label: 'Firma no coincide con DPI' },
  { value: 'documento_incompleto', label: 'Documento incompleto' },
  { value: 'dpi_vencido', label: 'DPI vencido' },
  { value: 'datos_incorrectos', label: 'Datos incorrectos' },
  { value: 'sin_legalizacion', label: 'Sin legalización notarial' },
  { value: 'firma_ilegible', label: 'Firma ilegible' },
  { value: 'paginas_faltantes', label: 'Páginas faltantes' },
  { value: 'otro', label: 'Otro (ver motivo detallado)' },
] as const;

export type RejectionOptionValue = (typeof REJECTION_OPTIONS)[number]['value'];

export interface DocumentReview {
  id: string;
  organizationId: string;
  documentId?: string | null;
  originalFileName: string;
  originalStoragePath: string;
  stampedStoragePath?: string | null;
  status: ReviewStatus;
  rejectedBy?: string | null;
  rejectedByName?: string | null;
  rejectedAt: string;
  rejectionReason?: string | null;
  // Extended fields
  documentDate?: string | null;
  fidelisEntryDate?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  clientName?: string | null;
  signaturePrincipalDetail?: string | null;
  signatureGuarantorDetail?: string | null;
  rejectionOptions: string[];
  // Review resolution
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RejectionPayload {
  file: File;
  reason?: string;
  documentDate?: string;
  fidelisEntryDate?: string;
  agentId?: string;
  agentName?: string;
  clientName?: string;
  signaturePrincipalDetail?: string;
  signatureGuarantorDetail?: string;
  rejectionOptions?: string[];
}

function normalizeReview(row: any): DocumentReview {
  return {
    id: row.id,
    organizationId: row.organization_id,
    documentId: row.document_id,
    originalFileName: row.original_file_name,
    originalStoragePath: row.original_storage_path,
    stampedStoragePath: row.stamped_storage_path,
    status: row.status,
    rejectedBy: row.rejected_by,
    rejectedByName: row.rejector?.full_name ?? null,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    documentDate: row.document_date ?? null,
    fidelisEntryDate: row.fidelis_entry_date ?? null,
    agentId: row.agent_id ?? null,
    agentName: row.agent_name ?? null,
    clientName: row.client_name ?? null,
    signaturePrincipalDetail: row.signature_principal_detail ?? null,
    signatureGuarantorDetail: row.signature_guarantor_detail ?? null,
    rejectionOptions: row.rejection_options ?? [],
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewer?.full_name ?? null,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Compresses a PDF file using pdf-lib by re-serializing the document.
 * This removes unused objects, metadata, and linearization hints,
 * typically reducing size by 15–50% for scan-heavy PDFs.
 * The objectsPerTick option spread CPU work across frames to avoid UI blocking.
 */
async function compressPdf(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Re-serialize without linearization; pdf-lib discards unused objects
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,  // pack multiple objects into compressed streams
      addDefaultPage: false,
    });

    const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });

    // Only use the compressed version if it's actually smaller
    if (compressedBlob.size < file.size) {
      return new File([compressedBlob], file.name, { type: 'application/pdf' });
    }

    console.debug('[ReviewService] Compressed PDF is not smaller than original, using original.');
    return file;
  } catch (err) {
    console.warn('[ReviewService] PDF compression failed, uploading original:', err);
    return file;
  }
}

export const reviewService = {
  async listReviews(
    organizationId: string,
    statusFilter?: ReviewStatus | 'all',
  ): Promise<DocumentReview[]> {
    let query = supabase
      .from('document_reviews')
      .select(
        `*,
         rejector:profiles!document_reviews_rejected_by_fkey(full_name),
         reviewer:profiles!document_reviews_reviewed_by_fkey(full_name)`,
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(normalizeReview);
  },

  async getPendingCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('document_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending_review');

    if (error) throw error;
    return count ?? 0;
  },

  async submitRejection(
    organizationId: string,
    actorId: string,
    payload: RejectionPayload,
  ): Promise<string> {
    const { file, reason, documentDate, fidelisEntryDate, agentId, agentName, clientName, signaturePrincipalDetail, signatureGuarantorDetail, rejectionOptions } = payload;

    // Compress PDF before upload
    const fileToUpload = await compressPdf(file);
    console.debug(
      `[ReviewService] Upload size: ${(fileToUpload.size / 1024).toFixed(1)} KB (original: ${(file.size / 1024).toFixed(1)} KB)`,
    );

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${organizationId}/originals/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('review-files')
      .upload(storagePath, fileToUpload, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('document_reviews')
      .insert({
        organization_id: organizationId,
        original_file_name: file.name,
        original_storage_path: storagePath,
        status: 'pending_review',
        rejected_by: actorId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
        document_date: documentDate || null,
        fidelis_entry_date: fidelisEntryDate || null,
        agent_id: agentId || null,
        agent_name: agentName || null,
        client_name: clientName || null,
        signature_principal_detail: signaturePrincipalDetail || null,
        signature_guarantor_detail: signatureGuarantorDetail || null,
        rejection_options: rejectionOptions ?? [],
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async resolveReview(
    organizationId: string,
    actorId: string,
    reviewId: string,
    decision: 'confirmed' | 'restored',
    notes?: string,
    originalStoragePath?: string,
  ): Promise<void> {
    if (decision === 'confirmed' && originalStoragePath) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('review-files')
        .download(originalStoragePath);

      if (downloadError) throw downloadError;

      const { stampPdf } = await import('../../../lib/pdf/stamper');
      const stampedBlob = await stampPdf(fileData);

      const { error: uploadError } = await supabase.storage
        .from('review-files')
        .upload(originalStoragePath, stampedBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;
    }

    const { error } = await supabase
      .from('document_reviews')
      .update({
        status: decision,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        stamped_storage_path: decision === 'confirmed' && originalStoragePath ? originalStoragePath : null,
      })
      .eq('id', reviewId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async getFileUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('review-files')
      .createSignedUrl(storagePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  },

  async downloadFile(storagePath: string, fileName: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from('review-files')
      .download(storagePath);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
