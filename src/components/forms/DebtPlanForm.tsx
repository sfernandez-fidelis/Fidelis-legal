import type { DebtPlanData } from '../../types';

interface DebtPlanFormProps {
  data: DebtPlanData;
  onChange: (data: DebtPlanData) => void;
  title?: string;
}

export function createEmptyDebtPlanData(): DebtPlanData {
  return {
    debtAmount: 0,
    debtAmountInWords: '',
    termMonths: 0,
    startDate: '',
    endDate: '',
    numberOfPayments: 0,
    paymentAmount: 0,
    paymentAmountInWords: '',
    interestRate: '',
    paymentDay: '',
  };
}

export function DebtPlanForm({ data, onChange, title = 'Plan de pagos' }: DebtPlanFormProps) {
  const update = (partial: Partial<DebtPlanData>) => onChange({ ...data, ...partial });

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
      <h3 className="text-lg font-medium text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500">Detalles de la obligación reconocida y el plan de cuotas.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto de la deuda (Q.)</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ debtAmount: parseFloat(e.target.value) || 0 })}
            placeholder="500000"
            type="number"
            value={data.debtAmount || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ debtAmountInWords: e.target.value })}
            placeholder="Quinientos mil quetzales"
            value={data.debtAmountInWords}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Plazo (meses)</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ termMonths: parseInt(e.target.value) || 0 })}
            placeholder="12"
            type="number"
            value={data.termMonths || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Fecha inicio</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ startDate: e.target.value })}
            type="date"
            value={data.startDate}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Fecha vencimiento</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ endDate: e.target.value })}
            type="date"
            value={data.endDate}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">No. de cuotas</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ numberOfPayments: parseInt(e.target.value) || 0 })}
            placeholder="12"
            type="number"
            value={data.numberOfPayments || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Monto cuota (Q.)</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ paymentAmount: parseFloat(e.target.value) || 0 })}
            placeholder="45000"
            type="number"
            value={data.paymentAmount || ''}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Cuota en letras</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ paymentAmountInWords: e.target.value })}
            placeholder="Cuarenta y cinco mil quetzales"
            value={data.paymentAmountInWords}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Tasa de interés</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ interestRate: e.target.value })}
            placeholder="Ej. 18% anual"
            value={data.interestRate}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Día de pago</span>
          <input
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => update({ paymentDay: e.target.value })}
            placeholder="Últimos 5 días de cada mes"
            value={data.paymentDay}
          />
        </label>
      </div>
    </div>
  );
}
