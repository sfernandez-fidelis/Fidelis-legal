import { getSqlClient, readOrderedSqlFiles } from './shared';

async function main() {
  const environment = process.argv[2] ?? process.env.SEED_ENV ?? 'local';
  const sql = getSqlClient();

  try {
    const seedFileName =
      environment === 'staging' ? '03_seed_staging.sql' : environment === 'local' ? '02_seed_local.sql' : null;

    if (!seedFileName) {
      throw new Error(`Unsupported seed environment "${environment}". Use "local" or "staging".`);
    }

    const seeds = readOrderedSqlFiles('supabase/setup').filter((file) => file.name === seedFileName);

    if (!seeds.length) {
      console.log(`No seed files found for environment "${environment}".`);
      return;
    }

    for (const seed of seeds) {
      console.log(`Seeding ${seed.name}`);
      await sql.unsafe(seed.sql);
    }

    console.log(`Applied ${seeds.length} seed file(s) for ${environment}.`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
