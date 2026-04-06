import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { CounterGuaranteeData, ContractType } from '../../types';
import { compileTemplate } from '../templateEngine';

const parseHtmlNodeToTextRuns = (node: Node): TextRun[] => {
  const runs: TextRun[] = [];
  
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      runs.push(new TextRun({
        text: text + ' ', // Add space to separate words
        font: 'Times New Roman',
        size: 22, // 11pt
      }));
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const isBold = el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold';
    const isItalic = el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic';
    const isUnderline = el.tagName === 'U' || el.style.textDecoration === 'underline';
    
    // Process children
    Array.from(el.childNodes).forEach(child => {
      const childRuns = parseHtmlNodeToTextRuns(child);
      // Apply parent styles to children
      childRuns.forEach(run => {
        if (isBold) run.options.bold = true;
        if (isItalic) run.options.italics = true;
        if (isUnderline) run.options.underline = {};
        runs.push(run);
      });
    });
  }
  
  return runs;
};

export const generateWordDocument = async (data: CounterGuaranteeData, customTemplateStr?: string) => {
  let html = '';
  
  if (customTemplateStr) {
    html = compileTemplate(customTemplateStr, data);
  } else {
    html = compileTemplate('', data); // This will use the default HTML templates
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get all paragraphs or block elements
  const blockElements = Array.from(tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li'));
  
  // If no block elements found, just split by br
  let paragraphsToProcess: HTMLElement[] = [];
  if (blockElements.length > 0) {
    paragraphsToProcess = blockElements as HTMLElement[];
  } else {
    // Fallback: wrap everything in a single paragraph
    paragraphsToProcess = [tempDiv];
  }

  const docParagraphs = paragraphsToProcess.map(el => {
    const runs = parseHtmlNodeToTextRuns(el);
    
    // Determine alignment
    let alignment = AlignmentType.JUSTIFIED;
    if (el.style.textAlign === 'center' || el.tagName.match(/^H[1-6]$/)) {
      alignment = AlignmentType.CENTER;
    } else if (el.style.textAlign === 'right') {
      alignment = AlignmentType.RIGHT;
    }

    return new Paragraph({
      alignment,
      spacing: { after: 200 },
      children: runs,
    });
  }).filter(p => p.options.children && p.options.children.length > 0);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const typeLabel = data.type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Documento Privado' : 'Escritura Pública';
  const policiesLabel = data.policies.map(p => p.number).join(' y ');
  const entityLabel = data.principal.entityName || data.principal.name;
  const fileName = `${entityLabel} -${typeLabel}- ${policiesLabel}.docx`;
  
  saveAs(blob, fileName);
};
