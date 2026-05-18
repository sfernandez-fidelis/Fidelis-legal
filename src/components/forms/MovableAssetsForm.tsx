import type { MovableAssetsData } from '../../types';

interface MovableAssetsFormProps {
  data: MovableAssetsData;
  onChange: (data: MovableAssetsData) => void;
  title?: string;
}

export function createEmptyMovableAssetsData(): MovableAssetsData {
  return {
    assetsDescription: '',
    assetsValue: '',
    assetsValueInWords: '',
    assetsLocation: '',
  };
}

export function MovableAssetsForm({ data, onChange, title = 'Bienes muebles en garantía' }: MovableAssetsFormProps) {
  const update = (partial: Partial<MovableAssetsData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Descripción de los bienes muebles otorgados en garantía.</p>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Descripción de bienes</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          onChange={(e) => update({ assetsDescription: e.target.value })}
          placeholder="Descripción detallada de los bienes muebles..."
          value={data.assetsDescription}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Valor estimado</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ assetsValue: e.target.value })}
            placeholder="Ej. Q. 150,000.00"
            value={data.assetsValue}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Valor en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ assetsValueInWords: e.target.value })}
            placeholder="Ciento cincuenta mil quetzales"
            value={data.assetsValueInWords}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Ubicación de los bienes</span>
        <input
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          onChange={(e) => update({ assetsLocation: e.target.value })}
          placeholder="Dirección física donde se ubican los bienes..."
          value={data.assetsLocation}
        />
      </label>
    </div>
  );
}
