-- document_reviews v4: add tracking columns for sent emails

ALTER TABLE public.document_reviews
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_sent_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_email text;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
