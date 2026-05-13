-- document_reviews v2: add extended metadata fields and relax RLS
-- RLS is now role-based (any editor) rather than department-based,
-- while audit trail is preserved through the activity_log trigger.

-- New metadata columns
ALTER TABLE public.document_reviews
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS fidelis_entry_date date,
  ADD COLUMN IF NOT EXISTS agent_id uuid references public.insurance_agents (id) on delete set null,
  ADD COLUMN IF NOT EXISTS agent_name text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS signature_principal_detail text,
  ADD COLUMN IF NOT EXISTS signature_guarantor_detail text,
  ADD COLUMN IF NOT EXISTS rejection_options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Drop old department-restricted policies
DROP POLICY IF EXISTS "document_reviews_insert_archivo" ON public.document_reviews;
DROP POLICY IF EXISTS "document_reviews_update_legal" ON public.document_reviews;

-- Any authenticated editor can insert rejection records
-- Actor identity is captured via rejected_by FK → activity_log provides full audit trail
DROP POLICY IF EXISTS "document_reviews_insert_editors" ON public.document_reviews;
CREATE POLICY "document_reviews_insert_editors" ON public.document_reviews
FOR INSERT WITH CHECK (app.has_org_role(organization_id, 'editor'));

-- Any authenticated editor can update (resolve) rejection records
DROP POLICY IF EXISTS "document_reviews_update_editors" ON public.document_reviews;
CREATE POLICY "document_reviews_update_editors" ON public.document_reviews
FOR UPDATE USING (app.has_org_role(organization_id, 'editor'))
WITH CHECK (app.has_org_role(organization_id, 'editor'));

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
