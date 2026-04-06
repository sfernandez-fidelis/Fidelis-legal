<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally

This project uses Supabase for authentication and database access.

## Prerequisites

Node.js

## Setup

1. Install dependencies:
   `npm install`
2. Create `.env.local` and set the required values:
   `GEMINI_API_KEY`
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
   `DATABASE_URL`
   `VITE_SENTRY_DSN` (optional, recommended in staging/production)
3. Run the app:
   `npm run dev`

## Quality gates

- `npm run lint` runs TypeScript validation.
- `npm run test` runs unit and integration coverage with Vitest.
- `npm run test:e2e` runs Playwright smoke coverage for the guest journey.
- `npm run build` produces the production bundle with sourcemaps and bundle warnings.
- `npm run release:check` runs the full pre-release verification sequence.

## Database workflow

- Run-ready SQL files live together in `supabase/setup`.
- `01_initial_schema.sql` creates the full schema, policies, functions, and storage bucket.
- `02_seed_local.sql` is only for local/dev data.
- `03_seed_staging.sql` is only for staging data.
- Apply the schema with `npm run db:migrate`.
- Seed local with `npm run db:seed -- local`.
- Seed staging with `npm run db:seed -- staging`.
- Do not run both seed files in the same environment.

## Release process

1. Add the next ordered SQL file under `supabase/setup` if you need a fresh bootstrap step, or create a regular migration file and document when it should run.
2. Run `npm run db:migrate` against the target environment.
3. Run `npm run db:seed -- <env>` if seed data changed.
4. Run `npm run release:check`.
5. Deploy only after CI passes and Sentry is configured for the target environment.
