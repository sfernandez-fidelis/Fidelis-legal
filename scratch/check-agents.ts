import { getSqlClient } from '../scripts/db/shared';

async function main() {
  const sql = getSqlClient();
  try {
    const res = await sql`
      SELECT count(*), is_active 
      FROM public.insurance_agents 
      GROUP BY is_active
    `;
    console.log('Agent status counts:', res);

    const firstFew = await sql`
      SELECT id, full_name, code, is_active, organization_id
      FROM public.insurance_agents
      LIMIT 10
    `;
    console.log('First few agents:', firstFew);

    const orgs = await sql`
      SELECT id, name, slug FROM public.organizations;
    `;
    console.log('Organizations:', orgs);
  } catch (err) {
    console.error('Error fetching agents:', err);
  } finally {
    await sql.end();
  }
}

main();
