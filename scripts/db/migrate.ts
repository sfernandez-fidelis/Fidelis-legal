import { ensureMigrationTable, getSqlClient, readOrderedSqlFiles } from './shared';

async function main() {
  const sql = getSqlClient();

  try {
    await ensureMigrationTable(sql);

    const applied = await sql<{ filename: string }[]>`select filename from public.schema_migrations order by filename asc`;
    const appliedSet = new Set(applied.map((item) => item.filename));
    const migrations = readOrderedSqlFiles('supabase/setup').filter((file) => file.name.startsWith('01_'));
    const pending = migrations.filter((migration) => !appliedSet.has(migration.name));

    if (!pending.length) {
      console.log('Database is already up to date.');
      return;
    }

    for (const migration of pending) {
      console.log(`Applying ${migration.name}`);
      await sql.begin(async (transaction) => {
        await transaction.unsafe(migration.sql);
        await transaction`
          insert into public.schema_migrations (filename)
          values (${migration.name})
        `;
      });
    }

    console.log(`Applied ${pending.length} migration(s).`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
