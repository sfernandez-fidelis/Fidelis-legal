import React from 'react';
import { CounterGuaranteeData, ContractType } from '../types';
import { useTemplates } from '../contexts/TemplateContext';
import { compileTemplate } from '../utils/templateEngine';

interface LivePreviewProps {
  data: CounterGuaranteeData;
  type: ContractType;
}

export default function LivePreview({ data, type }: LivePreviewProps) {
  const { getTemplate, loading } = useTemplates();
  const template = getTemplate(type);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Cargando vista previa...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center">
        <p>No hay una plantilla definida para este tipo de contrato.</p>
        <p className="text-sm">Vaya a la sección de "Plantillas" para crear una.</p>
      </div>
    );
  }

  const compiledHtml = compileTemplate(template.content, data);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Vista Previa en Vivo
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
        <div 
          className="bg-white p-12 shadow-md mx-auto max-w-[800px] min-h-[1056px] text-sm text-gray-900 leading-relaxed"
          style={{ fontFamily: 'Arial, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: compiledHtml }}
        />
      </div>
    </div>
  );
}
