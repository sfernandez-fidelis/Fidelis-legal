import { supabase } from '../../../lib/supabase/client';

export type ReviewStatus = 'pending_review' | 'confirmed' | 'restored';

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
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
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
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewer?.full_name ?? null,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    file: File,
    reason?: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${organizationId}/originals/${timestamp}_${safeName}`;

    // Upload original file to storage
    const { error: uploadError } = await supabase.storage
      .from('review-files')
      .upload(storagePath, file, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create review record
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
      // 1. Download clean file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('review-files')
        .download(originalStoragePath);
        
      if (downloadError) throw downloadError;
      
      // 2. Stamp file
      const { stampPdf } = await import('../../../lib/pdf/stamper');
      const stampedBlob = await stampPdf(fileData);
      
      // 3. Re-upload stamped file to same path (upsert)
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
      .createSignedUrl(storagePath, 3600); // 1 hour

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
