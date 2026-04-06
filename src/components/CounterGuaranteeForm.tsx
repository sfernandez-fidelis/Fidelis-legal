import React, { useState } from 'react';
import { Plus, Trash2, FileText, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { CounterGuaranteeData, ContractType, PartyDetails } from '../types';
import { format } from 'date-fns';
import PartyForm from './forms/PartyForm';
import PolicyForm from './forms/PolicyForm';
import LivePreview from './LivePreview';

interface Props {
  onSave: (data: CounterGuaranteeData) => Promise<string | void> | void;
  onGeneratePDF: (data: CounterGuaranteeData) => Promise<string | void> | void;
  onGenerateWord?: (data: CounterGuaranteeData) => Promise<string | void> | void;
  initialType?: ContractType;
  key?: React.Key;
}

const emptyParty = (): PartyDetails => ({
  name: '',
  age: '',
  maritalStatus: 'casado',
  profession: 'Ejecutivo',
  domicile: 'departamento de Guatemala',
  idNumber: '',
  cui: '',
  isRepresenting: true,
  role: 'ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL',
  entityName: '',
  notaryName: '',
  actDate: '',
  regNumber: '',
  regFolio: '',
  regBook: '',
});

export default function CounterGuaranteeForm({ onSave, onGeneratePDF, onGenerateWord, initialType = ContractType.COUNTER_GUARANTEE_PRIVATE }: Props) {
  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [data, setData] = useState<CounterGuaranteeData>({
    type: initialType,
    contractDate: format(new Date(), 'yyyy-MM-dd'),
    principal: emptyParty(),
    guarantors: [],
    policies: [{ number: '', type: '', amount: 0, amountInWords: '' }],
    notificationAddress: '',
    beneficiaryName: '',
    signatureNames: [''],
    createdAt: new Date().toISOString(),
  });

  const addGuarantor = () => {
    setData({
      ...data,
      guarantors: [...data.guarantors, emptyParty()]
    });
  };

  const removeGuarantor = (index: number) => {
    const newGuarantors = [...data.guarantors];
    newGuarantors.splice(index, 1);
    setData({ ...data, guarantors: newGuarantors });
  };

  const addPolicy = () => {
    setData({
      ...data,
      policies: [...data.policies, { number: '', type: '', amount: 0, amountInWords: '' }]
    });
  };

  const removePolicy = (index: number) => {
    const newPolicies = [...data.policies];
    newPolicies.splice(index, 1);
    setData({ ...data, policies: newPolicies });
  };

  const addSignature = () => {
    setData({ ...data, signatureNames: [...data.signatureNames, ''] });
  };

  const removeSignature = (index: number) => {
    const newSignatures = [...data.signatureNames];
    newSignatures.splice(index, 1);
    setData({ ...data, signatureNames: newSignatures });
  };

  const getTitle = () => {
    switch (data.type) {
      case ContractType.COUNTER_GUARANTEE_PRIVATE:
        return 'Contragarantía (Doc. Privado)';
      case ContractType.COUNTER_GUARANTEE_PUBLIC:
        return 'Contragarantía (Escritura Pública)';
      case ContractType.MORTGAGE_GUARANTEE:
        return 'Garantía Hipotecaria (Escritura)';
      default:
        return 'Nuevo Documento Legal';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-serif italic text-gray-800">
            {getTitle()}
          </h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full ${step === s ? 'bg-brand-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Datos Generales y Fiado</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Contrato</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              value={data.contractDate}
              onChange={(e) => setData({ ...data, contractDate: e.target.value })}
            />
          </div>
          <PartyForm 
            party={data.principal} 
            onChange={(p) => setData({ ...data, principal: p })} 
            title="Datos del Fiado Principal" 
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-medium">Fiadores Solidarios</h3>
            <button
              onClick={addGuarantor}
              className="flex items-center gap-1 text-sm bg-brand-50 text-brand-700 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors"
            >
              <Plus size={16} /> Agregar Fiador
            </button>
          </div>

          {data.guarantors.length === 0 && (
            <p className="text-gray-500 italic text-center py-8">No hay fiadores adicionales agregados.</p>
          )}

          {data.guarantors.map((g, idx) => (
            <div key={idx} className="relative group">
              <PartyForm 
                party={g} 
                onChange={(p) => {
                  const newG = [...data.guarantors];
                  newG[idx] = p;
                  setData({ ...data, guarantors: newG });
                }} 
                title={`Fiador #${idx + 1}`} 
                onRemove={() => removeGuarantor(idx)}
              />
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-medium">Pólizas Afianzadas</h3>
            <button
              onClick={addPolicy}
              className="flex items-center gap-1 text-sm bg-brand-50 text-brand-700 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors"
            >
              <Plus size={16} /> Agregar Póliza
            </button>
          </div>

          <div className="space-y-4">
            {data.policies.map((p, idx) => (
              <div key={idx}>
                <PolicyForm
                  policy={p}
                  onChange={(updated) => {
                    const newP = [...data.policies];
                    newP[idx] = updated;
                    setData({ ...data, policies: newP });
                  }}
                  onRemove={() => removePolicy(idx)}
                  canRemove={data.policies.length > 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Detalles Finales</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Beneficiario</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Ej. CRÉDITO HIPOTECARIO NACIONAL..."
                value={data.beneficiaryName}
                onChange={(e) => setData({ ...data, beneficiaryName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección para Notificaciones</label>
              <textarea
                className="w-full p-2 border rounded-md h-20"
                placeholder="Diagonal seis, doce guion cuarenta y dos..."
                value={data.notificationAddress}
                onChange={(e) => setData({ ...data, notificationAddress: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Nombres para Firmas</label>
                <button
                  onClick={addSignature}
                  className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  + Agregar Firma
                </button>
              </div>
              {data.signatureNames.map((name, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-md text-sm"
                    placeholder="Nombre del Firmante"
                    value={name}
                    onChange={(e) => {
                      const newS = [...data.signatureNames];
                      newS[idx] = e.target.value;
                      setData({ ...data, signatureNames: newS });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSignature(idx)}
                    className="text-gray-400 hover:text-red-600"
                    disabled={data.signatureNames.length === 1}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={18} /> Anterior
          </button>

          <div className="flex gap-3">
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                Siguiente <ChevronRight size={18} />
              </button>
            ) : (
              <>
                {!isSaved ? (
                  <button
                    onClick={async () => {
                      const id = await onSave(data);
                      if (id) {
                        setData({ ...data, id });
                        setIsSaved(true);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow-sm font-medium"
                  >
                    <Save size={18} /> Guardar
                  </button>
                ) : (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                    <button
                      onClick={() => onGeneratePDF(data)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors text-sm font-medium"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button
                      onClick={() => onGenerateWord && onGenerateWord(data)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors text-sm font-medium"
                    >
                      <FileText size={16} /> Word
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="hidden lg:block lg:w-1/2 h-full">
        <LivePreview data={data} type={data.type} />
      </div>
    </div>
  );
}
