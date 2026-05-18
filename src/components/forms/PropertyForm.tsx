import type { PropertyData } from '../../types';

interface PropertyFormProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
  title?: string;
}

export function createEmptyPropertyData(): PropertyData {
  return {
    fincaNumber: '',
    fincaFolio: '',
    fincaBook: '',
    fincaDepartment: 'Guatemala',
    registryName: 'Registro General de la Propiedad',
    propertyDescription: '',
    propertyValue: '',
    propertyValueInWords: '',
    mortgageInscription: '',
  };
}

export function PropertyForm({ data, onChange, title = 'Datos del inmueble' }: PropertyFormProps) {
  const update = (partial: Partial<PropertyData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Datos de la finca y registro de la propiedad.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">No. de finca</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ fincaNumber: e.target.value })}
            placeholder="Ej. 12345"
            value={data.fincaNumber}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Folio</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ fincaFolio: e.target.value })}
            placeholder="Ej. 201"
            value={data.fincaFolio}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Libro</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ fincaBook: e.target.value })}
            placeholder="Ej. 455"
            value={data.fincaBook}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Departamento</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ fincaDepartment: e.target.value })}
            placeholder="Ej. Guatemala"
            value={data.fincaDepartment}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Registro</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ registryName: e.target.value })}
            placeholder="Ej. Registro General de la Propiedad"
            value={data.registryName}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Descripción del inmueble</span>
        <textarea
          className="min-h-20 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          onChange={(e) => update({ propertyDescription: e.target.value })}
          placeholder="Descripción completa de la propiedad..."
          value={data.propertyDescription}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Valor del inmueble</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ propertyValue: e.target.value })}
            placeholder="Ej. Q. 500,000.00"
            value={data.propertyValue}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Valor en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ propertyValueInWords: e.target.value })}
            placeholder="Quinientos mil quetzales exactos"
            value={data.propertyValueInWords}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Inscripción hipotecaria</span>
        <input
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          onChange={(e) => update({ mortgageInscription: e.target.value })}
          placeholder="Datos de la inscripción hipotecaria..."
          value={data.mortgageInscription}
        />
      </label>
    </div>
  );
}
