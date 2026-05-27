-- Allow 'rejected' status on documents.
-- Required by the sync_document_review_status() trigger defined in
-- 04_document_reviews.sql, which sets documents.status = 'rejected' when a
-- linked document_review is confirmed. Without this, confirming a rejection
-- that has document_id set would fail with documents_status_check violation.

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft', 'ready', 'generated', 'archived', 'rejected'));

NOTIFY pgrst, 'reload schema';
