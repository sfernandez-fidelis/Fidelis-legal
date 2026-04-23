import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IRunOptions,
} from 'docx';
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
      parseHtmlNodeToTextRuns(child, nextStyles).forEach((run) => runs.push(run));
    });
  }

  return runs;
};

const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);

function getAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] {
  if (el.style.textAlign === 'center' || /^H[1-6]$/.test(el.tagName)) return AlignmentType.CENTER;
  if (el.style.textAlign === 'right') return AlignmentType.END;
  return AlignmentType.BOTH;
}

function elementToParagraph(el: HTMLElement, spacingAfter = 200): Paragraph | null {
  const runs = parseHtmlNodeToTextRuns(el);
  if (runs.length === 0) return null;
  return new Paragraph({ alignment: getAlignment(el), spacing: { after: spacingAfter }, children: runs });
}

function processElement(el: HTMLElement): Array<Paragraph | Table> {
  const tag = el.tagName.toUpperCase();

  if (tag === 'TABLE') return [htmlTableToDocxTable(el)];

  if (BLOCK_TAGS.has(tag)) {
    const p = elementToParagraph(el);
    return p ? [p] : [];
  }

  // div and other containers — recurse into direct children
  const result: Array<Paragraph | Table> = [];
  for (const child of Array.from(el.children)) {
    result.push(...processElement(child as HTMLElement));
  }
  return result;
}

function htmlTableToDocxTable(tableEl: HTMLElement): Table {
  const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  const rows = Array.from(tableEl.querySelectorAll('tr')).map((trEl) => {
    const cells = Array.from((trEl as HTMLElement).querySelectorAll('td, th')).map((tdEl) => {
      const cell = tdEl as HTMLElement;

      // Collect paragraphs from cell contents
      const paragraphs: Paragraph[] = [];
      for (const child of Array.from(cell.children)) {
        const childEl = child as HTMLElement;
        if (BLOCK_TAGS.has(childEl.tagName.toUpperCase())) {
          const p = elementToParagraph(childEl, 100);
          if (p) paragraphs.push(p);
        } else {
          // nested div / span — extract text directly
          const runs = parseHtmlNodeToTextRuns(childEl);
          if (runs.length > 0) {
            paragraphs.push(new Paragraph({ alignment: getAlignment(cell), spacing: { after: 100 }, children: runs }));
          }
        }
      }

      // Fallback: direct text in cell
      if (paragraphs.length === 0) {
        const runs = parseHtmlNodeToTextRuns(cell);
        if (runs.length > 0) {
          paragraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: runs }));
        }
      }

      if (paragraphs.length === 0) paragraphs.push(new Paragraph({}));

      // Apply top border when the cell carries one (used for signature lines)
      const styleAttr = cell.getAttribute('style') ?? '';
      const hasTopBorder = styleAttr.includes('border-top');
      const topBorder = hasTopBorder
        ? { style: BorderStyle.SINGLE, size: 6, color: '000000' }
        : NO_BORDER;

      return new TableCell({
        children: paragraphs,
        borders: { top: topBorder, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      });
    });

    return new TableRow({ children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
    },
  });
}

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

  const docChildren: Array<Paragraph | Table> = [];
  for (const child of Array.from(tempDiv.children)) {
    docChildren.push(...processElement(child as HTMLElement));
  }

  // Ensure there is at least one paragraph (docx requires it)
  if (docChildren.length === 0) {
    docChildren.push(new Paragraph({}));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: docChildren,
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
