import fs from 'fs';
import path from 'path';
import { getSqlClient } from './shared';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const sql = getSqlClient();

  try {
    const orgs = await sql`SELECT id FROM public.organizations LIMIT 1`;
    if (!orgs.length) {
      throw new Error('No se encontró ninguna organización en la base de datos. Ejecuta primero npm run db:setup');
    }
    const organizationId = orgs[0].id;
    console.log(`▶ Usando organización ID: ${organizationId}`);

    // ==========================================
    // SECCIÓN 1: IMPORTAR AGENTES
    // ==========================================
    const agentesPath = path.resolve('.sql/agentes.csv');
    if (fs.existsSync(agentesPath)) {
      console.log('▶ Procesando agentes.csv ...');
      const content = fs.readFileSync(agentesPath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length > 1) {
        const headers = parseCsvLine(lines[0]);
        const agentsToInsert: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length < headers.length) continue;
          
          const row: any = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
          }

          const cleanEmail = row.EMAIL 
            ? row.EMAIL.split(',').map((e: string) => e.trim()).filter(Boolean).join(',')
            : null;

          agentsToInsert.push({
            organization_id: organizationId,
            full_name: row.NOMBRE || 'Sin Nombre',
            code: row.NUMERO_AGENTE || null,
            email: cleanEmail,
            phone: row.TELEFONO || null,
            notes: `NIT: ${row.NIT || ''} | Reg SIB: ${row.REGISTRO_SIB || ''}`,
            is_active: row.ESTADO === 'A'
          });
        }

        console.log(`  Limpiando agentes existentes...`);
        await sql`DELETE FROM public.insurance_agents WHERE organization_id = ${organizationId}`;

        console.log(`  Insertando ${agentsToInsert.length} agentes...`);
        const batchSize = 100;
        for (let i = 0; i < agentsToInsert.length; i += batchSize) {
          const batch = agentsToInsert.slice(i, i + batchSize);
          await sql`
            INSERT INTO public.insurance_agents ${(sql as any)(batch, 'organization_id', 'full_name', 'code', 'email', 'phone', 'notes', 'is_active')}
          `;
        }
        console.log('  ✓ Agentes importados correctamente.');
      }
    }

    // ==========================================
    // SECCIÓN 2: IMPORTAR CLIENTES
    // ==========================================
    const clientesPath = path.resolve('.sql/clientes.csv');
    if (fs.existsSync(clientesPath)) {
      console.log('▶ Procesando clientes.csv ...');
      const content = fs.readFileSync(clientesPath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length > 1) {
        const headers = parseCsvLine(lines[0]);
        const uniqueContacts = new Map<string, any>();

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length < headers.length) continue;
          
          const row: any = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
          }

          const externalKey = row.COD_CONTACTO_CLIENTE || null;
          if (!externalKey) continue;

          // Si ya existe el contacto, agregamos el representante adicional a una lista secundaria en JSONB
          if (uniqueContacts.has(externalKey)) {
            const existing = uniqueContacts.get(externalKey);
            if (row.NOMBRE_REPRESENTANTE) {
              if (!existing.party.representatives) {
                existing.party.representatives = [
                  { name: existing.party.representative, code: existing.party.representative_code }
                ];
              }
              existing.party.representatives.push({
                name: row.NOMBRE_REPRESENTANTE,
                code: row.COD_CONTACTO_REPRE
              });
            }
            continue;
          }

          const clientName = row.NOMBRE_CLIENTE || '';
          const nit = row.NIT_CLIENTE || '';
          const dpi = row.DPI_CLIENTE || '';

          uniqueContacts.set(externalKey, {
            organization_id: organizationId,
            kind: 'party',
            external_key: externalKey,
            party: {
              name: clientName,
              nit: nit,
              dpi: dpi,
              type: row.TIPO_CLIENTE || 'INDIVIDUAL',
              representative: row.NOMBRE_REPRESENTANTE || '',
              representative_code: row.COD_CONTACTO_REPRE || ''
            },
            search_text: `${clientName.toLowerCase()} ${nit.toLowerCase()} ${dpi.toLowerCase()}`.trim()
          });
        }

        const contactsToInsert = Array.from(uniqueContacts.values());
        console.log(`  Limpiando contactos existentes...`);
        await sql`DELETE FROM public.contacts WHERE organization_id = ${organizationId}`;

        console.log(`  Insertando ${contactsToInsert.length} contactos únicos (de un total de ${lines.length - 1} filas)...`);
        const batchSize = 200;
        for (let i = 0; i < contactsToInsert.length; i += batchSize) {
          const batch = contactsToInsert.slice(i, i + batchSize);
          await sql`
            INSERT INTO public.contacts ${(sql as any)(batch, 'organization_id', 'kind', 'external_key', 'party', 'search_text')}
          `;
        }
        console.log('  ✓ Clientes/contactos importados correctamente.');
      }
    }

    console.log('\n✅ Proceso de importación finalizado con éxito.');
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
  } finally {
    await sql.end();
  }
}

main();
