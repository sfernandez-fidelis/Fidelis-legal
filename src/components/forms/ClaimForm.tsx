import type { ClaimData } from '../../types';

interface ClaimFormProps {
  data: ClaimData;
  onChange: (data: ClaimData) => void;
  title?: string;
}

export function createEmptyClaimData(): ClaimData {
  return {
    indemnityAmount: 0,
    indemnityAmountInWords: '',
    checkNumber: '',
    checkDate: '',
    issuingBank: 'Banco de Desarrollo Rural, Sociedad Anónima',
    subrogationTarget: '',
  };
}

export function ClaimForm({ data, onChange, title = 'Datos del reclamo' }: ClaimFormProps) {
  const update = (partial: Partial<ClaimData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Datos de la indemnización y pago del reclamo.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto de indemnización (Q.)</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ indemnityAmount: parseFloat(e.target.value) || 0 })}
            placeholder="100000"
            type="number"
            value={data.indemnityAmount || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ indemnityAmountInWords: e.target.value })}
            placeholder="Cien mil quetzales"
            value={data.indemnityAmountInWords}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">No. de cheque</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ checkNumber: e.target.value })}
            placeholder="Ej. 12345"
            value={data.checkNumber}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Fecha del cheque</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ checkDate: e.target.value })}
            type="date"
            value={data.checkDate}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Banco emisor</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ issuingBank: e.target.value })}
            placeholder="Banco de Desarrollo Rural, S.A."
            value={data.issuingBank}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Subrogación contra</span>
        <input
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          onChange={(e) => update({ subrogationTarget: e.target.value })}
          placeholder="Nombre de la persona o entidad contra la que se subroga"
          value={data.subrogationTarget}
        />
      </label>
    </div>
  );
}
