import type { DepositData } from '../../types';

interface DepositFormProps {
  data: DepositData;
  onChange: (data: DepositData) => void;
  title?: string;
}

export function createEmptyDepositData(): DepositData {
  return {
    depositAmount: 0,
    depositAmountInWords: '',
    depositDate: '',
    receiptNumber: '',
    interestRate: '',
  };
}

export function DepositForm({ data, onChange, title = 'Datos del depósito' }: DepositFormProps) {
  const update = (partial: Partial<DepositData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Información del depósito de fondos en garantía.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto del depósito (Q.)</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ depositAmount: parseFloat(e.target.value) || 0 })}
            placeholder="250000"
            type="number"
            value={data.depositAmount || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ depositAmountInWords: e.target.value })}
            placeholder="Doscientos cincuenta mil quetzales"
            value={data.depositAmountInWords}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Fecha del depósito</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ depositDate: e.target.value })}
            type="date"
            value={data.depositDate}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">No. recibo de caja</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ receiptNumber: e.target.value })}
            placeholder="Ej. RC-2026-0045"
            value={data.receiptNumber}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Tasa de interés</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ interestRate: e.target.value })}
            placeholder="Ej. 5%"
            value={data.interestRate}
          />
        </label>
      </div>
    </div>
  );
}
