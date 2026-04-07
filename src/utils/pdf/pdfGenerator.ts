import { jsPDF } from 'jspdf';
import { CounterGuaranteeData, ContractType } from '../../types';
import { generateCounterGuaranteePrivateHTML } from './templates/CounterGuaranteePrivateTemplate';
import { generateCounterGuaranteePublicHTML } from './templates/CounterGuaranteePublicTemplate';
import { generateMortgageGuaranteeHTML } from './templates/MortgageGuaranteeTemplate';
import { compileTemplate } from '../templateEngine';

function buildBaseFileName(data: CounterGuaranteeData) {
  const typeLabel =
    data.type === ContractType.COUNTER_GUARANTEE_PRIVATE
      ? 'Documento Privado'
      : data.type === ContractType.COUNTER_GUARANTEE_PUBLIC
        ? 'Escritura Pública'
        : 'Hipoteca';
  const policiesLabel = data.policies.map((policy) => policy.number).join(' y ');
  const entityLabel = data.principal.entityName || data.principal.name || 'Documento legal';
  return `${entityLabel} - ${typeLabel}${policiesLabel ? ` - ${policiesLabel}` : ''}`.replace(/[\\/:*?"<>|]+/g, '').trim();
}

function getHtml(data: CounterGuaranteeData, customTemplateStr?: string) {
  if (customTemplateStr) {
    return compileTemplate(customTemplateStr, data);
  }

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

export async function renderContractPDF(data: CounterGuaranteeData, customTemplateStr?: string) {
  const html = getHtml(data, customTemplateStr);
  const element = document.createElement('div');
  element.innerHTML = html;
  element.style.width = '170mm';
  element.style.fontSize = '11pt';
  element.style.fontFamily = 'Times New Roman, serif';
  element.style.lineHeight = '1.6';
  element.style.textAlign = 'justify';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  try {
    await doc.html(element, {
      callback: () => undefined,
      x: 20,
      y: 20,
      width: 170,
      windowWidth: 800,
      autoPaging: 'text',
    });

    const blob = doc.output('blob');
    return {
      blob,
      fileName: `${buildBaseFileName(data)}.pdf`,
      contentType: 'application/pdf',
    };
  } finally {
    document.body.removeChild(element);
  }
}
