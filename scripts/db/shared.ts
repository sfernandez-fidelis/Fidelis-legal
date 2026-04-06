import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '../..');

export function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run database scripts.');
  }

  return postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes('localhost') ? 'prefer' : 'require',
  });
}

export function readOrderedSqlFiles(relativeDir: string) {
  const absoluteDir = path.join(rootDir, relativeDir);

  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  return fs
    .readdirSync(absoluteDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      name: file,
      absolutePath: path.join(absoluteDir, file),
      sql: fs.readFileSync(path.join(absoluteDir, file), 'utf8'),
    }));
}

export async function ensureMigrationTable(sql: postgres.Sql) {
  await sql`
    create table if not exists public.schema_migrations (
      id bigserial primary key,
      filename text not null unique,
      applied_at timestamptz not null default now()
    )
  `;
}
