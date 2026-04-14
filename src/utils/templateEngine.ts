import { CounterGuaranteeData, ContractType, PartyDetails } from '../types';
import {
  buildAdditionalTextHtml,
  decorateVariableHtml,
  injectAdditionalText,
  injectPreviewInsertions,
  type TemplateRenderMode,
} from './documentAdditionalText';
import { formatDPI, formatDateInWords, formatNumberWithWords, getPartyIdentityNumber } from './pdf/formatters';
import { generateCounterGuaranteePrivateHTML } from './pdf/templates/CounterGuaranteePrivateTemplate';
import { generateCounterGuaranteePublicHTML } from './pdf/templates/CounterGuaranteePublicTemplate';
import { generateMortgageGuaranteeHTML } from './pdf/templates/MortgageGuaranteeTemplate';
import { getRenderableSignatureNames } from './signatureNames';

function buildPartyTemplateString(party: PartyDetails, mode: TemplateRenderMode) {
  if (!party.name) {
    return '';
  }

  const identityNumber = getPartyIdentityNumber(party);
  const base = `<b>${party.name}</b>, de ${party.age} años de edad, ${party.maritalStatus}, ${party.profession}, con domicilio en ${party.domicile}, se identifica con Documento Personal de Identificación (DPI) Código Único de Identificación (CUI) número ${formatDPI(identityNumber)} extendido por el Registro Nacional de las Personas de la República de Guatemala`;

  if (!party.isRepresenting) {
    return decorateVariableHtml(base, mode);
  }

  return decorateVariableHtml(
    `${base}, quien actúa en representación de <b>${party.entityName}</b>, calidad que acredita con el acta notarial autorizada en esta ciudad por el Notario ${party.notaryName} de fecha ${formatDateInWords(party.actDate, { includeYearLabel: true })}, inscrita en el Registro Mercantil General de la República al número ${formatNumberWithWords(party.regNumber || '')}, folio ${formatNumberWithWords(party.regFolio || '')}, libro ${formatNumberWithWords(party.regBook || '')}`,
    mode,
  );
}

function buildSignaturesTemplate(signatureNames: string[], mode: TemplateRenderMode) {
  const renderableSignatureNames = getRenderableSignatureNames(signatureNames);

  return `
    <div style="margin-top: 60px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
          <p style="font-size: 9pt; margin: 0;">BRASIL HAROLDO ARENAS MORALES</p>
        </div>
        ${renderableSignatureNames
          .map(
            (name) => `
          <div style="text-align: center;">
            <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
            <p style="font-size: 9pt; margin: 0 auto; width: 200px; text-align: center;">${decorateVariableHtml(name.toUpperCase(), mode)}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

function buildAuthenticaTemplate(data: CounterGuaranteeData, dateStr: string, firmasStr: string, mode: TemplateRenderMode) {
  if (data.type !== ContractType.COUNTER_GUARANTEE_PRIVATE) {
    return '';
  }

  const allParties = [data.principal, ...(data.guarantors || [])];
  const partiesText = allParties
    .map((party, index) => {
      const label = String.fromCharCode(98 + index);
      let text = `${label}) ${party.name.toUpperCase()}, quien se identifica con el Documento Personal de Identificación -DPI- con Código Único de Identificación -CUI- ${formatDPI(getPartyIdentityNumber(party))} extendido por el Registro Nacional de las Personas de la República de Guatemala`;

      if (party.isRepresenting) {
        text += `, actuando en calidad de ${party.role?.toUpperCase()}, de la entidad denominada ${party.entityName?.toUpperCase()}, lo cual acredita con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario ${party.notaryName}, el ${formatDateInWords(party.actDate, { includeYearLabel: true })}, inscrita en el Registro Mercantil General de la República al número de registro ${formatNumberWithWords(party.regNumber || '')}, folio ${formatNumberWithWords(party.regFolio || '')}, del libro ${formatNumberWithWords(party.regBook || '')} de Auxiliares de Comercio`;
      }

      return text;
    })
    .join(', ');

  return `
    <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px;">
      <p style="margin-bottom: 0;">
        AUTÉNTICA: En la Ciudad de Guatemala, departamento de Guatemala, el día ${decorateVariableHtml(dateStr, mode)}, como Notario, DOY FE: que las firmas que anteceden son auténticas, por haber sido signadas el día de hoy en mi presencia por los señores: a) BRASIL HAROLDO ARENAS MORALES, quien se identifica con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas de la república de Guatemala, quien actúa en su calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredita con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio, ${decorateVariableHtml(partiesText, mode)}. Las firmas se encuentran puestas en un documento privado de CONTRAFIANZA CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS; y los anteriormente mencionados vuelven a firmar al pie de la presente Acta de Legalización.
      </p>
      ${firmasStr}
      <p style="margin-top: 40px; font-weight: bold;">ANTE MÍ:</p>
    </div>
  `;
}

export function compileTemplate(
  templateStr: string,
  data: CounterGuaranteeData,
  options: { mode?: TemplateRenderMode; includeInsertionSlots?: boolean } = {},
): string {
  const mode = options.mode ?? 'export';
  const includeInsertionSlots = options.includeInsertionSlots ?? true;
  const additionalTextHtml = buildAdditionalTextHtml(data.additionalText, mode);
  let compiled = '';

  if (!templateStr || templateStr.trim() === '' || templateStr.includes('<h1>Nuevo Documento</h1>')) {
    switch (data.type) {
      case ContractType.COUNTER_GUARANTEE_PRIVATE:
        compiled = generateCounterGuaranteePrivateHTML(data, additionalTextHtml, mode);
        break;
      case ContractType.COUNTER_GUARANTEE_PUBLIC:
        compiled = generateCounterGuaranteePublicHTML(data, additionalTextHtml, mode);
        break;
      case ContractType.MORTGAGE_GUARANTEE:
        compiled = generateMortgageGuaranteeHTML(data, additionalTextHtml, mode);
        break;
      default:
        compiled = generateCounterGuaranteePrivateHTML(data, additionalTextHtml, mode);
        break;
    }

    return includeInsertionSlots ? injectPreviewInsertions(compiled, data.previewInsertions, mode) : compiled;
  }

  compiled = templateStr.replace(/<mark(?:[^>]*)>\{\{([^}]+)\}\}<\/mark>/g, '{{$1}}');
  compiled = injectAdditionalText(compiled, additionalTextHtml);

  const dateStr = data.contractDate ? formatDateInWords(data.contractDate) : '[FECHA DEL CONTRATO]';
  compiled = compiled.replace(/\{\{FECHA_CONTRATO\}\}/g, decorateVariableHtml(dateStr, mode));

  const principalStr = buildPartyTemplateString(data.principal, mode) || '[DATOS DEL FIADO]';
  compiled = compiled.replace(/\{\{DATOS_FIADO\}\}/g, principalStr);

  const guarantorsStr =
    data.guarantors && data.guarantors.length > 0
      ? data.guarantors.map((guarantor) => buildPartyTemplateString(guarantor, mode)).join('; y ')
      : '[DATOS DE LOS FIADORES]';
  compiled = compiled.replace(/\{\{DATOS_FIADORES\}\}/g, guarantorsStr);

  const policiesStr =
    data.policies && data.policies.length > 0
      ? data.policies
          .map(
            (policy) =>
              decorateVariableHtml(
                `Póliza número <b>${formatNumberWithWords(policy.number)}</b>, clase <b>${policy.type}</b>, por un monto de <b>${policy.amountInWords} (Q.${policy.amount.toFixed(2)})</b>`,
                mode,
              ),
          )
          .join('; y ')
      : '[DATOS DE LAS PÓLIZAS]';
  compiled = compiled.replace(/\{\{DATOS_POLIZAS\}\}/g, policiesStr);

  const beneficiaryStr = data.beneficiaryName ? decorateVariableHtml(`<b>${data.beneficiaryName}</b>`, mode) : '[BENEFICIARIO]';
  compiled = compiled.replace(/\{\{BENEFICIARIO\}\}/g, beneficiaryStr);

  const addressStr = data.notificationAddress
    ? decorateVariableHtml(`<b>${data.notificationAddress}</b>`, mode)
    : '[DIRECCIÓN DE NOTIFICACIONES]';
  compiled = compiled.replace(/\{\{DIRECCION_NOTIFICACIONES\}\}/g, addressStr);

  const firmasStr = buildSignaturesTemplate(data.signatureNames ?? [], mode);
  compiled = compiled.replace(/\{\{FIRMAS\}\}/g, firmasStr);
  compiled = compiled.replace(/\{\{AUTENTICA\}\}/g, buildAuthenticaTemplate(data, dateStr, firmasStr, mode));

  return includeInsertionSlots ? injectPreviewInsertions(compiled, data.previewInsertions, mode) : compiled;
}
