import { CounterGuaranteeData, PartyDetails } from '../../../types';
import { formatDPI, formatDateInWords, formatNumberWithWords, formatPolicyType } from '../formatters';

const getPartyLegalString = (p: PartyDetails) => {
  const base = `${p.name}, de ${p.age} años de edad, ${p.maritalStatus}, ${p.profession}, guatemalteco, de este domicilio, se identifica con el Documento Personal de Identificación con Código Único de Identificación número ${formatDPI(p.cui)}`;
  
  if (p.isRepresenting) {
    return `${base}, quien actúa en su calidad de ${p.role} de la entidad ${p.entityName}, calidad que acredita con el Acta Notarial de su nombramiento autorizada en esta ciudad por el Notario ${p.notaryName}, el ${p.actDate}, la cual se encuentra debidamente inscrita en el Registro Mercantil General de la República al número ${formatNumberWithWords(p.regNumber || '')}, folio ${formatNumberWithWords(p.regFolio || '')} del libro ${formatNumberWithWords(p.regBook || '')} de Auxiliares de Comercio`;
  }
  return base;
};

export const generateMortgageGuaranteeHTML = (data: CounterGuaranteeData) => {
  const principalStr = getPartyLegalString(data.principal);
  const dateStr = formatDateInWords(data.contractDate);

  return `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.8; text-align: justify; font-size: 12pt; padding: 40px;">
      <p style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 30px;">NUMERO _________ (____). ESCRITURA PÚBLICA DE CONSTITUCIÓN DE GARANTÍA HIPOTECARIA.</p>
      
      <p>En la ciudad de Guatemala, el ${dateStr}, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${principalStr}, a quien en lo sucesivo se le denominará "EL DEUDOR HIPOTECARIO"; y por otra parte el representante de AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA... [RESTO DEL TEXTO LEGAL DE GARANTÍA HIPOTECARIA]</p>
      
      <p><strong>PRIMERA: ANTECEDENTES.</strong> ... <strong>SEGUNDA: CONSTITUCIÓN DE HIPOTECA.</strong> ...</p>

      <div style="margin-top: 80px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          ${data.signatureNames.map(name => `
            <div style="text-align: center;">
              <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
              <p style="font-size: 10pt; margin: 0;">${name}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};
