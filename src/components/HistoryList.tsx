import React from 'react';
import { FileText, Calendar, User, Trash2, Download } from 'lucide-react';
import { CounterGuaranteeData, ContractType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  items: CounterGuaranteeData[];
  onDelete: (id: string) => void;
  onDownloadPDF: (data: CounterGuaranteeData) => void;
  onDownloadWord: (data: CounterGuaranteeData) => void;
}

export default function HistoryList({ items, onDelete, onDownloadPDF, onDownloadWord }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <FileText size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No hay documentos generados aún</p>
        <p className="text-sm">Completa el formulario para crear tu primera contragarantía</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif italic text-gray-800 mb-6">Historial de Documentos</h3>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900">
                  {item.principal.entityName || item.principal.name} -{item.type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Documento Privado' : 'Escritura Pública'}- {item.policies.map(p => p.number).join(' y ')}
                </h4>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{format(new Date(item.contractDate), "d 'de' MMM, yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{item.principal.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText size={14} />
                  <span>{item.policies.length} Pólizas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onDownloadPDF(item)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
              >
                <Download size={16} /> PDF
              </button>
              <button
                onClick={() => onDownloadWord(item)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
              >
                <Download size={16} /> Word
              </button>
              <button
                onClick={() => item.id && onDelete(item.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
