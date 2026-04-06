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
});
