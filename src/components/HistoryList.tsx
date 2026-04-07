import React from 'react';
import { Calendar, Download, FileText, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { CounterGuaranteeData, ContractType } from '../types';

interface Props {
  items: CounterGuaranteeData[];
  onDelete: (id: string) => void;
  onDownloadPDF: (data: CounterGuaranteeData) => void;
  onDownloadWord: (data: CounterGuaranteeData) => void;
  onHoverDocument?: (id: string) => void;
}

export default function HistoryList({ items, onDelete, onDownloadPDF, onDownloadWord, onHoverDocument }: Props) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-gray-400">
        <FileText className="mb-4 opacity-20" size={48} />
        <p className="text-lg font-medium">No hay documentos generados aún</p>
        <p className="text-sm">Completa el formulario para crear tu primera contragarantía</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-6 text-xl font-serif italic text-gray-800">Historial de documentos</h3>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div
            className="group flex flex-col items-start justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
            key={item.id}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  className="font-bold text-gray-900 transition hover:text-brand-700"
                  onMouseEnter={() => item.id && onHoverDocument?.(item.id)}
                  to={`/documents/${item.id}`}
                >
                  {item.principal.entityName || item.principal.name} -
                  {item.type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Documento Privado' : 'Escritura Pública'}-{' '}
                  {item.policies.map((policy) => policy.number).join(' y ')}
                </Link>
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
                  <span>{item.policies.length} pólizas</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 transition-opacity md:mt-0 md:opacity-0 md:group-hover:opacity-100">
              <button
                className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
                onClick={() => onDownloadPDF(item)}
                type="button"
              >
                <Download size={16} />
                PDF
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
                onClick={() => onDownloadWord(item)}
                type="button"
              >
                <Download size={16} />
                Word
              </button>
              <button
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                onClick={() => item.id && onDelete(item.id)}
                title="Archivar"
                type="button"
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
