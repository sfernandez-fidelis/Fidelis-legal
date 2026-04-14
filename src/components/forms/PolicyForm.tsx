import React from 'react';
import { Trash2 } from 'lucide-react';
import { Policy } from '../../types';

interface Props {
  policy: Policy;
  onChange: (updated: Policy) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function PolicyForm({ policy, onChange, onRemove, canRemove }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 border rounded-lg bg-gray-50">
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Número</label>
        <input
          type="text"
          className="w-full p-2 border rounded-md bg-white"
          value={policy.number}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            onChange({ ...policy, number: value });
          }}
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Clase/Tipo</label>
        <input
          type="text"
          placeholder="Ej. C-3"
          className="w-full p-2 border rounded-md bg-white"
          value={policy.type}
          onChange={(e) => onChange({ ...policy, type: e.target.value })}
        />
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Monto (Q)</label>
        <input
          type="number"
          className="w-full p-2 border rounded-md bg-white"
          value={policy.amount}
          onChange={(e) => onChange({ ...policy, amount: parseFloat(e.target.value) || 0 })}
          onFocus={(e) => {
            if (policy.amount === 0) e.target.value = '';
          }}
          onBlur={(e) => {
            if (!e.target.value) onChange({ ...policy, amount: 0 });
          }}
        />
      </div>
      <div className="flex justify-end md:col-span-1">
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 p-2"
          disabled={!canRemove}
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
