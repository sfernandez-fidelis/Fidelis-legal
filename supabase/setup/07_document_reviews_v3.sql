-- document_reviews v3: add policy_number for better identification

ALTER TABLE public.document_reviews
  ADD COLUMN IF NOT EXISTS policy_number text;

-- Update status constraint to include needs_info
ALTER TABLE public.document_reviews
  DROP CONSTRAINT IF EXISTS document_reviews_status_check;

ALTER TABLE public.document_reviews
  ADD CONSTRAINT document_reviews_status_check 
  CHECK (status IN ('pending_review', 'confirmed', 'restored', 'needs_info'));

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
