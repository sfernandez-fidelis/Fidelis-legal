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
    // 1. Obtener todas las organizaciones de la base de datos
    const orgs = await sql`SELECT id, name FROM public.organizations`;
    if (!orgs.length) {
      throw new Error('No se encontró ninguna organización en la base de datos. Ejecuta primero npm run db:setup');
    }
    console.log(`▶ Encontradas ${orgs.length} organizaciones en la base de datos.`);

    // ==========================================
    // SECCIÓN 1: LEER Y PARSEAR AGENTES
    // ==========================================
    const agentesPath = path.resolve('.sql/agentes.csv');
    let agentsTemplate: any[] = [];
    if (fs.existsSync(agentesPath)) {
      console.log('▶ Procesando agentes.csv ...');
      const content = fs.readFileSync(agentesPath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length > 1) {
        const headers = parseCsvLine(lines[0]);

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

          agentsTemplate.push({
            full_name: row.NOMBRE || 'Sin Nombre',
            code: row.NUMERO_AGENTE || null,
            email: cleanEmail,
            phone: row.TELEFONO || null,
            notes: `NIT: ${row.NIT || ''} | Reg SIB: ${row.REGISTRO_SIB || ''}`,
            is_active: row.ESTADO === 'A'
          });
        }
        console.log(`  ✓ Se parsearon ${agentsTemplate.length} agentes.`);
      }
    }

    // ==========================================
    // SECCIÓN 2: LEER Y PARSEAR CLIENTES
    // ==========================================
    const clientesPath = path.resolve('.sql/clientes.csv');
    let clientsTemplate: any[] = [];
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
          const isEmpresa = row.TIPO_CLIENTE === 'EMPRESA';

          uniqueContacts.set(externalKey, {
            kind: 'party',
            external_key: externalKey,
            party: {
              name: clientName,
              nit: nit,
              dpi: dpi,
              idNumber: dpi,
              cui: dpi,
              type: row.TIPO_CLIENTE || 'INDIVIDUAL',
              entityName: isEmpresa ? clientName : '',
              isRepresenting: Boolean(row.NOMBRE_REPRESENTANTE),
              role: row.NOMBRE_REPRESENTANTE ? 'Representante Legal' : '',
              representative: row.NOMBRE_REPRESENTANTE || '',
              representative_code: row.COD_CONTACTO_REPRE || ''
            },
            metadata: {
              displayName: clientName,
              recordType: isEmpresa ? 'entity' : 'person',
              contactTypes: isEmpresa ? ['entity', 'principal', 'guarantor'] : ['principal', 'guarantor']
            },
            search_text: `${clientName.toLowerCase()} ${nit.toLowerCase()} ${dpi.toLowerCase()}`.trim()
          });
        }
        clientsTemplate = Array.from(uniqueContacts.values());
        console.log(`  ✓ Se parsearon ${clientsTemplate.length} contactos únicos.`);
      }
    }

    // ==========================================
    // SECCIÓN 3: IMPORTAR EN CADA ORGANIZACIÓN
    // ==========================================
    for (const org of orgs) {
      const organizationId = org.id;
      console.log(`\n▶ Importando datos para organización: "${org.name}" (ID: ${organizationId})`);

      // Importar Agentes
      if (agentsTemplate.length > 0) {
        console.log(`  Limpiando agentes existentes...`);
        await sql`DELETE FROM public.insurance_agents WHERE organization_id = ${organizationId}`;

        const agentsToInsert = agentsTemplate.map(agent => ({
          ...agent,
          organization_id: organizationId
        }));

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

      // Importar Contactos
      if (clientsTemplate.length > 0) {
        console.log(`  Limpiando contactos existentes...`);
        await sql`DELETE FROM public.contacts WHERE organization_id = ${organizationId}`;

        const contactsToInsert = clientsTemplate.map(contact => ({
          ...contact,
          organization_id: organizationId
        }));

        console.log(`  Insertando ${contactsToInsert.length} contactos...`);
        const batchSize = 200;
        for (let i = 0; i < contactsToInsert.length; i += batchSize) {
          const batch = contactsToInsert.slice(i, i + batchSize);
          await sql`
            INSERT INTO public.contacts ${(sql as any)(batch, 'organization_id', 'kind', 'external_key', 'party', 'metadata', 'search_text')}
          `;
        }
        console.log('  ✓ Clientes/contactos importados correctamente.');
      }
    }

    console.log('\n✅ Proceso de importación en todas las organizaciones finalizado con éxito.');
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
  } finally {
    await sql.end();
  }
}

main();
