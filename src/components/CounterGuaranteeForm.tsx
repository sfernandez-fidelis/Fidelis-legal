import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ContactData, CounterGuaranteeData, ContractType, PartyDetails } from '../types';
import PartyForm from './forms/PartyForm';
import PolicyForm from './forms/PolicyForm';
import LivePreview from './LivePreview';
import { DateInput } from '../shared/components/DateInput';

interface Props {
  onSave: (data: CounterGuaranteeData) => Promise<string | void> | void;
  onGeneratePDF: (data: CounterGuaranteeData) => Promise<string | void> | void;
  onGenerateWord?: (data: CounterGuaranteeData) => Promise<string | void> | void;
  initialType?: ContractType;
  initialData?: CounterGuaranteeData;
  contacts: ContactData[];
  templateContent?: string;
  templateLoading?: boolean;
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
  role: 'ADMINISTRADOR UNICO Y REPRESENTANTE LEGAL',
  entityName: '',
  notaryName: '',
  actDate: '',
  regNumber: '',
  regFolio: '',
  regBook: '',
});

function buildInitialData(initialType: ContractType, initialData?: CounterGuaranteeData): CounterGuaranteeData {
  if (initialData) {
    return initialData;
  }

  return {
    type: initialType,
    contractDate: format(new Date(), 'yyyy-MM-dd'),
    principal: emptyParty(),
    guarantors: [],
    policies: [{ number: '', type: '', amount: 0, amountInWords: '' }],
    notificationAddress: '',
    beneficiaryName: '',
    signatureNames: [''],
    createdAt: new Date().toISOString(),
  };
}

export default function CounterGuaranteeForm({
  onSave,
  onGeneratePDF,
  onGenerateWord,
  initialType = ContractType.COUNTER_GUARANTEE_PRIVATE,
  initialData,
  contacts,
  templateContent,
  templateLoading = false,
}: Props) {
  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(Boolean(initialData?.id));
  const [data, setData] = useState<CounterGuaranteeData>(() => buildInitialData(initialType, initialData));

  useEffect(() => {
    setData(buildInitialData(initialType, initialData));
    setIsSaved(Boolean(initialData?.id));
    setStep(1);
  }, [initialData, initialType]);

  const addGuarantor = () => {
    setData((current) => ({
      ...current,
      guarantors: [...current.guarantors, emptyParty()],
    }));
  };

  const removeGuarantor = (index: number) => {
    setData((current) => ({
      ...current,
      guarantors: current.guarantors.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addPolicy = () => {
    setData((current) => ({
      ...current,
      policies: [...current.policies, { number: '', type: '', amount: 0, amountInWords: '' }],
    }));
  };

  const removePolicy = (index: number) => {
    setData((current) => ({
      ...current,
      policies: current.policies.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addSignature = () => {
    setData((current) => ({
      ...current,
      signatureNames: [...current.signatureNames, ''],
    }));
  };

  const removeSignature = (index: number) => {
    setData((current) => ({
      ...current,
      signatureNames: current.signatureNames.filter((_, itemIndex) => itemIndex !== index),
    }));
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
        return 'Nuevo documento legal';
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-8 lg:flex-row">
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-1/2">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-6">
          <h2 className="text-xl font-serif italic text-gray-800">{getTitle()}</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                className={`h-2.5 w-2.5 rounded-full ${step === item ? 'bg-brand-600' : 'bg-gray-200'}`}
                key={item}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="border-b pb-2 text-lg font-medium">Datos generales y fiado</h3>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de contrato</label>
                <DateInput
                  className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={(isoDate) => setData({ ...data, contractDate: isoDate })}
                  value={data.contractDate}
                />
              </div>
              <PartyForm
                contacts={contacts}
                onChange={(principal) => setData({ ...data, principal })}
                party={data.principal}
                title="Datos del fiado principal"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-medium">Fiadores solidarios</h3>
                <button
                  className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 transition-colors hover:bg-brand-100"
                  onClick={addGuarantor}
                  type="button"
                >
                  <Plus size={16} />
                  Agregar fiador
                </button>
              </div>

              {data.guarantors.length === 0 ? (
                <p className="py-8 text-center italic text-gray-500">No hay fiadores adicionales agregados.</p>
              ) : null}

              {data.guarantors.map((guarantor, index) => (
                <PartyForm
                  contacts={contacts}
                  key={`guarantor-${index}`}
                  onChange={(updatedParty) => {
                    const nextGuarantors = [...data.guarantors];
                    nextGuarantors[index] = updatedParty;
                    setData({ ...data, guarantors: nextGuarantors });
                  }}
                  onRemove={() => removeGuarantor(index)}
                  party={guarantor}
                  title={`Fiador #${index + 1}`}
                />
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-medium">Pólizas afianzadas</h3>
                <button
                  className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 transition-colors hover:bg-brand-100"
                  onClick={addPolicy}
                  type="button"
                >
                  <Plus size={16} />
                  Agregar póliza
                </button>
              </div>

              <div className="space-y-4">
                {data.policies.map((policy, index) => (
                  <PolicyForm
                    canRemove={data.policies.length > 1}
                    key={`policy-${index}`}
                    onChange={(updatedPolicy) => {
                      const nextPolicies = [...data.policies];
                      nextPolicies[index] = updatedPolicy;
                      setData({ ...data, policies: nextPolicies });
                    }}
                    onRemove={() => removePolicy(index)}
                    policy={policy}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-6">
              <h3 className="border-b pb-2 text-lg font-medium">Detalles finales</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del beneficiario</label>
                  <input
                    className="w-full rounded-md border p-2"
                    onChange={(event) => setData({ ...data, beneficiaryName: event.target.value })}
                    placeholder="Ej. CRÉDITO HIPOTECARIO NACIONAL..."
                    type="text"
                    value={data.beneficiaryName}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Dirección para notificaciones</label>
                  <textarea
                    className="h-20 w-full rounded-md border p-2"
                    onChange={(event) => setData({ ...data, notificationAddress: event.target.value })}
                    placeholder="Diagonal seis, doce guion cuarenta y dos..."
                    value={data.notificationAddress}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Nombres para firmas</label>
                    <button
                      className="rounded bg-gray-100 px-2 py-1 text-xs transition hover:bg-gray-200"
                      onClick={addSignature}
                      type="button"
                    >
                      + Agregar firma
                    </button>
                  </div>
                  {data.signatureNames.map((name, index) => (
                    <div className="flex gap-2" key={`signature-${index}`}>
                      <input
                        className="flex-1 rounded-md border p-2 text-sm"
                        onChange={(event) => {
                          const nextSignatureNames = [...data.signatureNames];
                          nextSignatureNames[index] = event.target.value;
                          setData({ ...data, signatureNames: nextSignatureNames });
                        }}
                        placeholder="Nombre del firmante"
                        type="text"
                        value={name}
                      />
                      <button
                        className="text-gray-400 transition hover:text-red-600"
                        disabled={data.signatureNames.length === 1}
                        onClick={() => removeSignature(index)}
                        title="Eliminar"
                        type="button"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-6">
          <button
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            disabled={step === 1}
            onClick={() => setStep(Math.max(1, step - 1))}
            type="button"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>

          <div className="flex gap-3">
            {step < 4 ? (
              <button
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2 text-white shadow-sm transition-colors hover:bg-brand-700"
                onClick={() => setStep(step + 1)}
                type="button"
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            ) : !isSaved ? (
              <button
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2 font-medium text-white shadow-sm transition-all hover:bg-brand-700"
                onClick={async () => {
                  const id = await onSave(data);
                  if (id) {
                    setData({ ...data, id });
                    setIsSaved(true);
                  }
                }}
                type="button"
              >
                <Save size={18} />
                Guardar
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 flex gap-2">
                <button
                  className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  onClick={() => onGeneratePDF(data)}
                  type="button"
                >
                  <FileText size={16} />
                  PDF
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  onClick={() => onGenerateWord?.(data)}
                  type="button"
                >
                  <FileText size={16} />
                  Word
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden h-full lg:block lg:w-1/2">
        <LivePreview data={data} loading={templateLoading} templateContent={templateContent} type={data.type} />
      </div>
    </div>
  );
}
