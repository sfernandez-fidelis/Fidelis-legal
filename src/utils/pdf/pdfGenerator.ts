import { jsPDF } from 'jspdf';
import { CounterGuaranteeData, ContractType } from '../../types';
import { generateCounterGuaranteePrivateHTML } from './templates/CounterGuaranteePrivateTemplate';
import { generateCounterGuaranteePublicHTML } from './templates/CounterGuaranteePublicTemplate';
import { generateMortgageGuaranteeHTML } from './templates/MortgageGuaranteeTemplate';
import { compileTemplate } from '../templateEngine';

export const generateContractPDF = async (data: CounterGuaranteeData, customTemplateStr?: string) => {
  let html = '';
  
  if (customTemplateStr) {
    html = compileTemplate(customTemplateStr, data);
  } else {
    switch (data.type) {
      case ContractType.COUNTER_GUARANTEE_PRIVATE:
        html = generateCounterGuaranteePrivateHTML(data);
        break;
      case ContractType.COUNTER_GUARANTEE_PUBLIC:
        html = generateCounterGuaranteePublicHTML(data);
        break;
      case ContractType.MORTGAGE_GUARANTEE:
        html = generateMortgageGuaranteeHTML(data);
        break;
      default:
        html = generateCounterGuaranteePrivateHTML(data);
    }
  }

  const element = document.createElement('div');
  element.innerHTML = html;
  // Ensure the element is styled for A4/Letter width to render correctly
  element.style.width = '170mm'; // Letter width minus margins
  element.style.fontSize = '11pt';
  element.style.fontFamily = 'Times New Roman, serif';
  element.style.lineHeight = '1.6';
  element.style.textAlign = 'justify';
  
  // We need to append it to the body temporarily for jsPDF to render it
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  try {
    await doc.html(element, {
      callback: function (doc) {
        const typeLabel = data.type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Documento Privado' : 'Escritura Pública';
        const policiesLabel = data.policies.map(p => p.number).join(' y ');
        const entityLabel = data.principal.entityName || data.principal.name;
        const fileName = `${entityLabel} -${typeLabel}- ${policiesLabel}.pdf`;
        
        doc.save(fileName);
        document.body.removeChild(element);
      },
      x: 20,
      y: 20,
      width: 170, // target width in the PDF documents
      windowWidth: 800, // window width in CSS pixels
      autoPaging: 'text'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.removeChild(element);
    throw error;
  }
};
