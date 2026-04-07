import { saveAs } from 'file-saver';
import type { CounterGuaranteeData } from '../../../types';

export const documentGeneratorService = {
  async generateAndDownload(options: {
    document: CounterGuaranteeData;
    templateContent?: string;
    kind: 'pdf' | 'docx';
  }) {
    const { document, templateContent, kind } = options;

    if (!document.id) {
      throw new Error('Document id is required');
    }

    const rendered =
      kind === 'pdf'
        ? await import('../../../utils/pdf/pdfGenerator').then((module) => module.renderContractPDF(document, templateContent))
        : await import('../../../utils/word/wordGenerator').then((module) => module.renderWordDocument(document, templateContent));

    saveAs(rendered.blob, rendered.fileName);
  },
};
