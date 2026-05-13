/**
 * apply-setup.ts
 * Applies ALL files in supabase/setup/ in alphabetical order.
 * Unlike migrate.ts (which tracks applied files), this is idempotent —
 * every SQL file uses IF NOT EXISTS / DROP ... IF EXISTS so it's safe to re-run.
 *
 * Usage:
 *   Copy .env.example to .env.local and set DATABASE_URL, then run:
 *   npx tsx scripts/db/apply-setup.ts
 */
import { getSqlClient, readOrderedSqlFiles } from './shared';

async function main() {
  const sql = getSqlClient();

  try {
    const files = readOrderedSqlFiles('supabase/setup');

    if (!files.length) {
      console.log('No SQL files found in supabase/setup/');
      return;
    }

    for (const file of files) {
      console.log(`▶ Applying ${file.name} ...`);
      try {
        await sql.unsafe(file.sql);
        console.log(`  ✓ ${file.name}`);
      } catch (err: any) {
        console.error(`  ✗ ${file.name}: ${err.message}`);
        throw err;
      }
    }

    console.log(`\n✅ Applied ${files.length} setup file(s) successfully.`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error.message ?? error);
  process.exit(1);
});
