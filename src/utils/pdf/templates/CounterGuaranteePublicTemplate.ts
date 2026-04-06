import { CounterGuaranteeData, PartyDetails } from '../../../types';
import { formatDPI, formatDateInWords, formatNumberWithWords, formatPolicyType } from '../formatters';

const getPartyLegalString = (p: PartyDetails) => {
  const base = `${p.name}, de ${p.age} años de edad, ${p.maritalStatus}, ${p.profession}, guatemalteco, de este domicilio, se identifica con el Documento Personal de Identificación con Código Único de Identificación número ${formatDPI(p.cui)}`;
  
  if (p.isRepresenting) {
    return `${base}, quien actúa en su calidad de ${p.role} de la entidad ${p.entityName}, calidad que acredita con el Acta Notarial de su nombramiento autorizada en esta ciudad por el Notario ${p.notaryName}, el ${p.actDate}, la cual se encuentra debidamente inscrita en el Registro Mercantil General de la República al número ${formatNumberWithWords(p.regNumber || '')}, folio ${formatNumberWithWords(p.regFolio || '')} del libro ${formatNumberWithWords(p.regBook || '')} de Auxiliares de Comercio`;
  }
  return base;
};

export const generateCounterGuaranteePublicHTML = (data: CounterGuaranteeData) => {
  const principalStr = getPartyLegalString(data.principal);
  const guarantorsStr = data.guarantors.map(g => getPartyLegalString(g)).join('; ');
  
  const policiesStr = data.policies.map((p) => {
    return `póliza número ${formatNumberWithWords(p.number)}, Clase ${formatPolicyType(p.type)}, por el valor de ${p.amountInWords} (Q.${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  }).join(', ');

  const dateStr = formatDateInWords(data.contractDate);

  return `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.8; text-align: justify; font-size: 12pt; padding: 40px;">
      <p style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 30px;">NUMERO _________ (____). ESCRITURA PÚBLICA DE CONTRAGARANTÍA.</p>
      
      <p>En la ciudad de Guatemala, el ${dateStr}, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${principalStr}, a quien en lo sucesivo se le denominará "EL FIADO"; ${data.guarantors.length > 0 ? `Y POR OTRA PARTE: ${guarantorsStr}, a quienes se les denominará "LOS FIADORES SOLIDARIOS";` : ''} Los comparecientes me aseguran hallarse en el libre ejercicio de sus derechos civiles y que por el presente instrumento celebran <strong>CONTRATO DE CONTRAGARANTÍA</strong> contenido en las siguientes cláusulas: <strong>PRIMERA:</strong> Manifiesta "EL FIADO" que ha solicitado a la entidad AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA, la emisión de la(s) ${policiesStr}, a favor de ${data.beneficiaryName}. <strong>SEGUNDA:</strong> Por el presente acto, "EL FIADO" y "LOS FIADORES SOLIDARIOS" se constituyen en fiadores solidarios y mancomunados de AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA, por todas las sumas que ésta llegare a pagar en concepto de la(s) póliza(s) identificada(s) en la cláusula anterior... [RESTO DEL TEXTO LEGAL DE ESCRITURA PÚBLICA]</p>
      
      <p>Yo, el Notario, DOY FE: a) De todo lo expuesto; b) De haber tenido a la vista los documentos de identificación relacionados; c) De que por designación de los comparecientes les leí lo escrito y bien enterados de su contenido, objeto, validez y efectos legales, lo ratifican, aceptan y firman.</p>

      <div style="margin-top: 80px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          ${data.signatureNames.map(name => `
            <div style="text-align: center;">
              <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
              <p style="font-size: 10pt; margin: 0;">${name}</p>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 60px; text-align: center;">
          <p>ANTE MÍ:</p>
          <div style="border-top: 1px solid black; width: 200px; margin: 40px auto 10px;"></div>
          <p style="font-size: 10pt;">FIRMA Y SELLO DEL NOTARIO</p>
        </div>
      </div>
    </div>
  `;
};
