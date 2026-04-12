import { describe, expect, it } from 'vitest';
import { compileTemplate } from './templateEngine';
import { ContractType } from '../types';
import { createDocument } from '../test/fixtures';

describe('compileTemplate', () => {
  it('falls back to the default template when no custom content is provided', () => {
    const html = compileTemplate('', createDocument());

    expect(html).toContain('CONTRAFIANZA');
    expect(html).toContain('Ana Principal');
  });

  it('replaces rich text placeholders with document data', () => {
    const document = createDocument({
      type: ContractType.COUNTER_GUARANTEE_PUBLIC,
    });

    const html = compileTemplate(
      `
        <p><mark>{{FECHA_CONTRATO}}</mark></p>
        <p><mark>{{DATOS_FIADO}}</mark></p>
        <p><mark>{{DATOS_FIADORES}}</mark></p>
        <p><mark>{{DATOS_POLIZAS}}</mark></p>
        <p><mark>{{BENEFICIARIO}}</mark></p>
        <p><mark>{{DIRECCION_NOTIFICACIONES}}</mark></p>
      `,
      document,
    );

    expect(html).toContain('Ana Principal');
    expect(html).toContain('Luis Fiador');
    expect(html).toContain('PZ-001');
    expect(html).toContain('Municipalidad de Guatemala');
    expect(html).toContain('Zona 10, Ciudad de Guatemala');
    expect(html).not.toContain('<mark>{{FECHA_CONTRATO}}</mark>');
  });

  it('formats CUI and act dates in the legal style for template placeholders', () => {
    const html = compileTemplate(
      `
        <p>{{DATOS_FIADO}}</p>
      `,
      createDocument({
        principal: createDocument().principal,
      }),
    );

    expect(html).toContain('un mil doscientos treinta y cuatro, cincuenta y seis mil setecientos ochenta y nueve');
    expect(html).toContain('(1234 56789 0101)');
    expect(html).toContain('del año dos mil veintiseis');
  });

  it('renders placeholders when data is missing', () => {
    const html = compileTemplate(
      '<p>{{BENEFICIARIO}} {{DIRECCION_NOTIFICACIONES}}</p>',
      createDocument({
        beneficiaryName: '',
        notificationAddress: '',
      }),
    );

    expect(html).toContain('[BENEFICIARIO]');
    expect(html).toContain('[DIRECCI');
  });

  it('injects additional text before signatures when no placeholder is provided', () => {
    const html = compileTemplate(
      '<p>Texto base</p>{{FIRMAS}}',
      createDocument({
        additionalText: 'Cláusula libre\ncon detalle.',
      }),
    );

    expect(html).toContain('Texto adicional');
    expect(html).toContain('Cláusula libre<br />con detalle.');
    expect(html.indexOf('Texto adicional')).toBeLessThan(html.indexOf('BRASIL HAROLDO ARENAS MORALES'));
  });

  it('replaces the explicit additional text placeholder and escapes html', () => {
    const html = compileTemplate(
      '<p>{{TEXTO_ADICIONAL}}</p>',
      createDocument({
        additionalText: 'Se agrega <script>alert(1)</script>',
      }),
    );

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('adds preview highlights and editable insertion slots in preview mode', () => {
    const html = compileTemplate(
      '<p>PRIMERA: {{BENEFICIARIO}}</p>',
      createDocument(),
      { mode: 'preview' },
    );

    expect(html).toContain('preview-variable-highlight');
    expect(html).toContain('data-insertion-anchor="slot-1"');
  });

  it('exports manual insertions without preview styling', () => {
    const html = compileTemplate(
      '<p>PRIMERA: Documento base</p>',
      createDocument({
        previewInsertions: [{ anchorId: 'slot-1', text: 'Texto manual especial' }],
      }),
    );

    expect(html).toContain('Texto manual especial');
    expect(html).not.toContain('preview-inline-slot');
    expect(html).not.toContain('preview-variable-highlight');
  });
});
