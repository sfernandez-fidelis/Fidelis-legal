import { describe, expect, it } from 'vitest';
import { buildBaseFileName, renderWordDocument } from './wordGenerator';
import { ContractType } from '../../types';
import { createDocument } from '../../test/fixtures';

describe('buildBaseFileName', () => {
  it('builds a readable file name and strips reserved characters', () => {
    const value = buildBaseFileName(
      createDocument({
        type: ContractType.MORTGAGE_GUARANTEE,
        principal: {
          ...createDocument().principal,
          entityName: 'Empresa:/ Legal*',
        },
        policies: [{ number: 'PZ/001', type: 'Cumplimiento', amount: 1, amountInWords: 'uno' }],
      }),
    );

    expect(value).toContain('Empresa Legal');
    expect(value).toContain('Hipoteca');
    expect(value).not.toMatch(/[\\/:*?"<>|]/);
  });

  it('renders a docx artifact for a generated document', async () => {
    const result = await renderWordDocument(createDocument(), '<p><strong>Documento</strong> de prueba</p>');

    expect(result.fileName).toContain('.docx');
    expect(result.contentType).toContain('officedocument.wordprocessingml.document');
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
