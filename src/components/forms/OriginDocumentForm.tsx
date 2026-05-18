import type { OriginDocumentData } from '../../types';

interface OriginDocumentFormProps {
  data: OriginDocumentData;
  onChange: (data: OriginDocumentData) => void;
  title?: string;
}

export function createEmptyOriginDocumentData(): OriginDocumentData {
  return {
    escrituraNumber: '',
    escrituraNotary: '',
    escrituraDate: '',
    escrituraCity: 'la ciudad de Guatemala',
  };
}

export function OriginDocumentForm({ data, onChange, title = 'Escritura de origen' }: OriginDocumentFormProps) {
  const update = (partial: Partial<OriginDocumentData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Datos de la escritura pública de origen (hipoteca original a liberar).</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">No. de escritura</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ escrituraNumber: e.target.value })}
            placeholder="Ej. 123"
            value={data.escrituraNumber}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Notario</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ escrituraNotary: e.target.value })}
            placeholder="Nombre del Notario"
            value={data.escrituraNotary}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Fecha de la escritura</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ escrituraDate: e.target.value })}
            type="date"
            value={data.escrituraDate}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Ciudad</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ escrituraCity: e.target.value })}
            placeholder="la ciudad de Guatemala"
            value={data.escrituraCity}
          />
        </label>
      </div>
    </div>
  );
}
