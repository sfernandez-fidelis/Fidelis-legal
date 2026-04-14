import { CounterGuaranteeData, PartyDetails } from '../../../types';
import { decorateVariableHtml, type TemplateRenderMode } from '../../documentAdditionalText';
import { formatDPI, formatDateInWords, formatNumberWithWords, getPartyIdentityNumber } from '../formatters';
import { getRenderableSignatureNames } from '../../signatureNames';

const getPartyLegalString = (party: PartyDetails, mode: TemplateRenderMode) => {
  const base = `${party.name}, de ${party.age} años de edad, ${party.maritalStatus}, ${party.profession}, guatemalteco, de este domicilio, se identifica con el Documento Personal de Identificación con Código Único de Identificación número ${formatDPI(getPartyIdentityNumber(party))}`;

  if (party.isRepresenting) {
    return decorateVariableHtml(
      `${base}, quien actúa en su calidad de ${party.role} de la entidad ${party.entityName}, calidad que acredita con el Acta Notarial de su nombramiento autorizada en esta ciudad por el Notario ${party.notaryName}, el ${formatDateInWords(party.actDate, { includeYearLabel: true })}, la cual se encuentra debidamente inscrita en el Registro Mercantil General de la República al número ${formatNumberWithWords(party.regNumber || '')}, folio ${formatNumberWithWords(party.regFolio || '')} del libro ${formatNumberWithWords(party.regBook || '')} de Auxiliares de Comercio`,
      mode,
    );
  }

  return decorateVariableHtml(base, mode);
};

export const generateMortgageGuaranteeHTML = (
  data: CounterGuaranteeData,
  additionalTextHtml = '',
  mode: TemplateRenderMode = 'export',
) => {
  const renderableSignatureNames = getRenderableSignatureNames(data.signatureNames);
  const principalStr = getPartyLegalString(data.principal, mode);
  const dateStr = formatDateInWords(data.contractDate);

  return `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.8; text-align: justify; font-size: 12pt; padding: 40px;">
      <p style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 30px;">NUMERO _________ (____). ESCRITURA PÚBLICA DE CONSTITUCIÓN DE GARANTÍA HIPOTECARIA.</p>

      <p>En la ciudad de Guatemala, el ${decorateVariableHtml(dateStr, mode)}, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${principalStr}, a quien en lo sucesivo se le denominará "EL DEUDOR HIPOTECARIO"; y por otra parte el representante de AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA... [RESTO DEL TEXTO LEGAL DE GARANTÍA HIPOTECARIA]</p>

      <p><strong>PRIMERA: ANTECEDENTES.</strong> ... <strong>SEGUNDA: CONSTITUCIÓN DE HIPOTECA.</strong> ...</p>

      ${additionalTextHtml}

      <div style="margin-top: 80px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          ${renderableSignatureNames
            .map(
              (name) => `
            <div style="text-align: center;">
              <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
              <p style="font-size: 10pt; margin: 0;">${decorateVariableHtml(name, mode)}</p>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
};
