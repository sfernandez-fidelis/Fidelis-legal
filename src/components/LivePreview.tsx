import React from 'react';
import { CounterGuaranteeData, ContractType } from '../types';
import { compileTemplate } from '../utils/templateEngine';

interface LivePreviewProps {
  data: CounterGuaranteeData;
  type: ContractType;
  templateContent?: string;
  loading?: boolean;
}

export default function LivePreview({
  data,
  type,
  templateContent,
  loading = false,
}: LivePreviewProps) {
  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">Cargando vista previa...</div>;
  }

  if (!templateContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center text-gray-400">
        <p>No hay una plantilla definida para este tipo de contrato.</p>
        <p className="text-sm">Vaya a la sección de Plantillas para crear una.</p>
      </div>
    );
  }

  const compiledHtml = compileTemplate(templateContent, data);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Vista previa en vivo
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div
          className="mx-auto min-h-[1056px] max-w-[800px] bg-white p-12 text-sm leading-relaxed text-gray-900 shadow-md"
          style={{ fontFamily: 'Arial, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: compiledHtml }}
        />
      </div>
    </div>
  );
}
