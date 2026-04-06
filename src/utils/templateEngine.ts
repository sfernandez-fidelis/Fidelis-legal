import { CounterGuaranteeData, ContractType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateCounterGuaranteePrivateHTML } from './pdf/templates/CounterGuaranteePrivateTemplate';
import { generateCounterGuaranteePublicHTML } from './pdf/templates/CounterGuaranteePublicTemplate';
import { generateMortgageGuaranteeHTML } from './pdf/templates/MortgageGuaranteeTemplate';

export function compileTemplate(templateStr: string, data: CounterGuaranteeData): string {
  // If there's no custom template string or it's empty, use the default hardcoded templates
  if (!templateStr || templateStr.trim() === '' || templateStr.includes('<h1>Nuevo Documento</h1>')) {
    switch (data.type) {
      case ContractType.COUNTER_GUARANTEE_PRIVATE:
        return generateCounterGuaranteePrivateHTML(data);
      case ContractType.COUNTER_GUARANTEE_PUBLIC:
        return generateCounterGuaranteePublicHTML(data);
      case ContractType.MORTGAGE_GUARANTEE:
        return generateMortgageGuaranteeHTML(data);
      default:
        return generateCounterGuaranteePrivateHTML(data);
    }
  }

  let compiled = templateStr;

  // Strip variable badges added by the rich text editor
  compiled = compiled.replace(/<mark(?:[^>]*)>\{\{([^}]+)\}\}<\/mark>/g, '{{$1}}');

  // 1. FECHA_CONTRATO
  const dateStr = data.contractDate 
    ? format(new Date(data.contractDate), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : '[FECHA DEL CONTRATO]';
  compiled = compiled.replace(/\{\{FECHA_CONTRATO\}\}/g, dateStr);

  // 2. DATOS_FIADO
  const p = data.principal;
  const principalStr = p.name 
    ? `<b>${p.name}</b>, de ${p.age} años de edad, ${p.maritalStatus}, ${p.profession}, con domicilio en ${p.domicile}, se identifica con Documento Personal de Identificación (DPI) Código Único de Identificación (CUI) número ${p.idNumber} extendido por el Registro Nacional de las Personas de la República de Guatemala${p.isRepresenting ? `, quien actúa en representación de <b>${p.entityName}</b>, calidad que acredita con el acta notarial autorizada en esta ciudad por el Notario ${p.notaryName} de fecha ${p.actDate}, inscrita en el Registro Mercantil General de la República al número ${p.regNumber}, folio ${p.regFolio}, libro ${p.regBook}` : ''}`
    : '[DATOS DEL FIADO]';
  compiled = compiled.replace(/\{\{DATOS_FIADO\}\}/g, principalStr);

  // 3. DATOS_FIADORES
  let guarantorsStr = '';
  if (data.guarantors && data.guarantors.length > 0) {
    guarantorsStr = data.guarantors.map(g => 
      `<b>${g.name}</b>, de ${g.age} años de edad, ${g.maritalStatus}, ${g.profession}, con domicilio en ${g.domicile}, se identifica con Documento Personal de Identificación (DPI) Código Único de Identificación (CUI) número ${g.idNumber} extendido por el Registro Nacional de las Personas de la República de Guatemala${g.isRepresenting ? `, quien actúa en representación de <b>${g.entityName}</b>, calidad que acredita con el acta notarial autorizada en esta ciudad por el Notario ${g.notaryName} de fecha ${g.actDate}, inscrita en el Registro Mercantil General de la República al número ${g.regNumber}, folio ${g.regFolio}, libro ${g.regBook}` : ''}`
    ).join('; y ');
  } else {
    guarantorsStr = '[DATOS DE LOS FIADORES]';
  }
  compiled = compiled.replace(/\{\{DATOS_FIADORES\}\}/g, guarantorsStr);

  // 4. DATOS_POLIZAS
  let policiesStr = '';
  if (data.policies && data.policies.length > 0) {
    policiesStr = data.policies.map(pol => 
      `Póliza número <b>${pol.number}</b>, clase <b>${pol.type}</b>, por un monto de <b>${pol.amountInWords} (Q.${pol.amount.toFixed(2)})</b>`
    ).join('; y ');
  } else {
    policiesStr = '[DATOS DE LAS PÓLIZAS]';
  }
  compiled = compiled.replace(/\{\{DATOS_POLIZAS\}\}/g, policiesStr);

  // 5. BENEFICIARIO
  const beneficiaryStr = data.beneficiaryName ? `<b>${data.beneficiaryName}</b>` : '[BENEFICIARIO]';
  compiled = compiled.replace(/\{\{BENEFICIARIO\}\}/g, beneficiaryStr);

  // 6. DIRECCION_NOTIFICACIONES
  const addressStr = data.notificationAddress ? `<b>${data.notificationAddress}</b>` : '[DIRECCIÓN DE NOTIFICACIONES]';
  compiled = compiled.replace(/\{\{DIRECCION_NOTIFICACIONES\}\}/g, addressStr);

  // 7. FIRMAS
  let firmasStr = `
    <div style="margin-top: 60px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
          <p style="font-size: 9pt; margin: 0;">BRASIL HAROLDO ARENAS MORALES</p>
        </div>
        ${data.signatureNames ? data.signatureNames.map(name => `
          <div style="text-align: center;">
            <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
            <p style="font-size: 9pt; margin: 0;">${name.toUpperCase()}</p>
          </div>
        `).join('') : ''}
      </div>
    </div>
  `;
  compiled = compiled.replace(/\{\{FIRMAS\}\}/g, firmasStr);

  // 8. AUTENTICA
  let autenticaStr = '';
  if (data.type === ContractType.COUNTER_GUARANTEE_PRIVATE) {
    const allParties = [data.principal, ...(data.guarantors || [])];
    autenticaStr = `
      <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px;">
        <p style="margin-bottom: 0;">
          AUTÉNTICA: En la Ciudad de Guatemala, departamento de Guatemala, el día ${dateStr}, como Notario, DOY FE: que las firmas que anteceden son auténticas, por haber sido signadas el día de hoy en mi presencia por los señores: a) BRASIL HAROLDO ARENAS MORALES... 
          ${allParties.map((p, i) => {
            const letters = ['b', 'c', 'd', 'e', 'f', 'g'];
            let text = `${letters[i]}) ${p.name.toUpperCase()}, quien se identifica con el Documento Personal de Identificación...`;
            return text;
          }).join(', ')}. 
          Las firmas se encuentran puestas en un documento privado de CONTRAFIANZA CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS; y los anteriormente mencionados vuelven a firmar al pie de la presente Acta de Legalización.
        </p>
        ${firmasStr}
        <p style="margin-top: 40px; font-weight: bold;">ANTE MÍ:</p>
      </div>
    `;
  }
  compiled = compiled.replace(/\{\{AUTENTICA\}\}/g, autenticaStr);

  return compiled;
}
