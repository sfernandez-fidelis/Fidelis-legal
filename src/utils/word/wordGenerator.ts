import { AlignmentType, Document, Packer, Paragraph, TextRun, type IRunOptions } from 'docx';
import { CounterGuaranteeData, ContractType } from '../../types';
import { compileTemplate } from '../templateEngine';

const parseHtmlNodeToTextRuns = (node: Node, inheritedStyles: Partial<IRunOptions> = {}): TextRun[] => {
  const runs: TextRun[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      runs.push(
        new TextRun({
          text: `${text} `,
          font: 'Times New Roman',
          size: 22,
          ...inheritedStyles,
        }),
      );
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const isBold = el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold';
    const isItalic = el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic';
    const isUnderline = el.tagName === 'U' || el.style.textDecoration === 'underline';

    const nextStyles: Partial<IRunOptions> = {
      ...inheritedStyles,
      ...(isBold ? { bold: true } : {}),
      ...(isItalic ? { italics: true } : {}),
      ...(isUnderline ? { underline: {} } : {}),
    };

    Array.from(el.childNodes).forEach((child) => {
      const childRuns = parseHtmlNodeToTextRuns(child, nextStyles);
      childRuns.forEach((run) => {
        runs.push(run);
      });
    });
  }

  return runs;
};

export function buildBaseFileName(data: CounterGuaranteeData) {
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

export async function renderWordDocument(data: CounterGuaranteeData, customTemplateStr?: string) {
  const html = customTemplateStr ? compileTemplate(customTemplateStr, data) : compileTemplate('', data);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const blockElements = Array.from(tempDiv.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li'));
  const paragraphsToProcess = blockElements.length > 0 ? (blockElements as HTMLElement[]) : [tempDiv];

  const docParagraphs = paragraphsToProcess
    .map((el) => {
      const runs = parseHtmlNodeToTextRuns(el);

      let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.BOTH;
      if (el.style.textAlign === 'center' || el.tagName.match(/^H[1-6]$/)) {
        alignment = AlignmentType.CENTER;
      } else if (el.style.textAlign === 'right') {
        alignment = AlignmentType.END;
      }

      return new Paragraph({
        alignment,
        spacing: { after: 200 },
        children: runs,
      });
    })
    .filter((_paragraph, index) => parseHtmlNodeToTextRuns(paragraphsToProcess[index]).length > 0);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
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
  return {
    blob,
    fileName: `${buildBaseFileName(data)}.docx`,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}
