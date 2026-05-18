import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Copy, FileText, FolderArchive, Loader2, Plus, RotateCw, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import PartyForm from '../../../components/forms/PartyForm';
import PolicyForm from '../../../components/forms/PolicyForm';
import { PropertyForm, createEmptyPropertyData } from '../../../components/forms/PropertyForm';
import { DepositForm, createEmptyDepositData } from '../../../components/forms/DepositForm';
import { ClaimForm, createEmptyClaimData } from '../../../components/forms/ClaimForm';
import { DebtPlanForm, createEmptyDebtPlanData } from '../../../components/forms/DebtPlanForm';
import { MovableAssetsForm, createEmptyMovableAssetsData } from '../../../components/forms/MovableAssetsForm';
import { OriginDocumentForm, createEmptyOriginDocumentData } from '../../../components/forms/OriginDocumentForm';
import LivePreview from '../../../components/LivePreview';
import { DateInput } from '../../../shared/components/DateInput';
import type { ContactData, CounterGuaranteeData, ContractType, PartyDetails } from '../../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { createEmptyParty } from '../../contacts/contactUtils';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { getDocumentTypeConfig, type FormSection } from '../documentTypeConfig';

export type SaveIndicatorState = 'saving' | 'saved' | 'unsaved';

interface DocumentEditorProps {
  contacts: ContactData[];
  initialData?: CounterGuaranteeData;
  initialType: ContractType;
  mode: 'create' | 'edit';
  templateContent?: string;
  templateLoading?: boolean;
  saveIndicator: SaveIndicatorState;
  onChange: (document: CounterGuaranteeData) => void;
  onSaveNow?: (document: CounterGuaranteeData) => Promise<void> | void;
  onMarkReady?: (document: CounterGuaranteeData) => Promise<void> | void;
  onDuplicate?: (document: CounterGuaranteeData) => Promise<void> | void;
  onArchive?: (document: CounterGuaranteeData) => Promise<void> | void;
  onRestore?: (document: CounterGuaranteeData) => Promise<void> | void;
  onRegenerate?: (format: 'pdf' | 'word', document: CounterGuaranteeData) => Promise<void> | void;
  onSaveContact?: (party: PartyDetails, role: 'principal' | 'guarantor') => Promise<void> | void;
}



function buildInitialData(initialType: ContractType, initialData?: CounterGuaranteeData): CounterGuaranteeData {
  if (initialData) {
    return initialData;
  }

  return {
    type: initialType,
    status: 'draft',
    contractDate: format(new Date(), 'yyyy-MM-dd'),
    principal: createEmptyParty(),
    guarantors: [],
    policies: [{ number: '', type: '', amount: 0, amountInWords: '' }],
    notificationAddress: '',
    beneficiaryName: '',
    additionalText: '',
    previewInsertions: [],
    signatureNames: [''],
    createdAt: new Date().toISOString(),
  };
}

interface SectionContext {
  data: CounterGuaranteeData;
  updateData: (next: CounterGuaranteeData) => void;
  contacts: ContactData[];
  permissions: { canEditContent: boolean };
  addGuarantor: () => void;
  addPolicy: () => void;
  addSignature: () => void;
  onSaveContact?: (party: PartyDetails, role: 'principal' | 'guarantor') => Promise<void> | void;
}

function renderSection(section: FormSection, ctx: SectionContext): ReactNode {
  const { data, updateData, contacts, permissions, addGuarantor, addPolicy, addSignature, onSaveContact } = ctx;

  switch (section) {
    case 'general':
      return (
        <div key="general" className="grid gap-4 md:grid-cols-2">
          <Field label="Título del documento">
            <input className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(e) => updateData({ ...data, title: e.target.value })} placeholder="Use un título orientado al cliente" value={data.title ?? ''} />
          </Field>
          <Field label="Fecha del contrato">
            <DateInput className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(isoDate) => updateData({ ...data, contractDate: isoDate })} value={data.contractDate} />
          </Field>
          <Field label="Beneficiario">
            <input className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(e) => updateData({ ...data, beneficiaryName: e.target.value })} placeholder="Nombre del beneficiario" value={data.beneficiaryName} />
          </Field>
          <Field label="Notificaciones">
            <textarea className="min-h-28 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(e) => updateData({ ...data, notificationAddress: e.target.value })} placeholder="Dirección de notificación" value={data.notificationAddress} />
          </Field>
        </div>
      );

    case 'principal':
      return (
        <PartyForm key="principal" contacts={contacts} onChange={(principal) => updateData({ ...data, principal })} onSaveContact={(party) => onSaveContact?.(party, 'principal')} party={data.principal} suggestionTypes={['principal', 'representative', 'entity', 'notary']} title="Parte principal" />
      );

    case 'guarantors':
      return (
        <div key="guarantors" className="space-y-5">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-medium text-stone-900">Fiadores adicionales</h3><p className="text-sm text-stone-500">Mantenga las partes secundarias estructuradas.</p></div>
            <button className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100" disabled={!permissions.canEditContent} onClick={addGuarantor} type="button"><span className="inline-flex items-center gap-2"><Plus size={15} /> Agregar fiador</span></button>
          </div>
          {data.guarantors.map((guarantor, index) => (
            <PartyForm contacts={contacts} key={`guarantor-${index}`} onChange={(p) => { const g = [...data.guarantors]; g[index] = p; updateData({ ...data, guarantors: g }); }} onSaveContact={(p) => onSaveContact?.(p, 'guarantor')} onRemove={() => updateData({ ...data, guarantors: data.guarantors.filter((_, i) => i !== index) })} party={guarantor} suggestionTypes={['guarantor', 'representative', 'entity', 'notary']} title={`Fiador ${index + 1}`} />
          ))}
        </div>
      );

    case 'policies':
      return (
        <div key="policies" className="space-y-5">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-medium text-stone-900">Pólizas</h3><p className="text-sm text-stone-500">Cada póliza permanece consultable.</p></div>
            <button className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100" disabled={!permissions.canEditContent} onClick={addPolicy} type="button"><span className="inline-flex items-center gap-2"><Plus size={15} /> Agregar póliza</span></button>
          </div>
          {data.policies.map((policy, index) => (
            <PolicyForm canRemove={data.policies.length > 1} key={`policy-${index}`} onChange={(p) => { const ps = [...data.policies]; ps[index] = p; updateData({ ...data, policies: ps }); }} onRemove={() => updateData({ ...data, policies: data.policies.filter((_, i) => i !== index) })} policy={policy} />
          ))}
        </div>
      );

    case 'property':
      return <PropertyForm key="property" data={data.propertyData ?? createEmptyPropertyData()} onChange={(propertyData) => updateData({ ...data, propertyData })} />;

    case 'movableAssets':
      return <MovableAssetsForm key="movableAssets" data={data.movableAssetsData ?? createEmptyMovableAssetsData()} onChange={(movableAssetsData) => updateData({ ...data, movableAssetsData })} />;

    case 'deposit':
      return <DepositForm key="deposit" data={data.depositData ?? createEmptyDepositData()} onChange={(depositData) => updateData({ ...data, depositData })} />;

    case 'claim':
      return <ClaimForm key="claim" data={data.claimData ?? createEmptyClaimData()} onChange={(claimData) => updateData({ ...data, claimData })} />;

    case 'debtPlan':
      return <DebtPlanForm key="debtPlan" data={data.debtPlanData ?? createEmptyDebtPlanData()} onChange={(debtPlanData) => updateData({ ...data, debtPlanData })} />;

    case 'originDocument':
      return <OriginDocumentForm key="originDocument" data={data.originDocumentData ?? createEmptyOriginDocumentData()} onChange={(originDocumentData) => updateData({ ...data, originDocumentData })} />;

    case 'maxAmount':
      return (
        <div key="maxAmount" className="rounded-3xl border border-stone-200 bg-stone-50 p-5 space-y-4">
          <h3 className="text-lg font-medium text-stone-900">Monto máximo acumulado</h3>
          <p className="text-sm text-stone-500">Techo de emisión de pólizas al amparo de este accesorio.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Monto (Q.)"><input className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" type="number" onChange={(e) => updateData({ ...data, maxGuaranteeAmount: parseFloat(e.target.value) || 0 })} value={data.maxGuaranteeAmount || ''} placeholder="500000" /></Field>
            <Field label="Monto en letras"><input className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(e) => updateData({ ...data, maxGuaranteeAmountInWords: e.target.value })} value={data.maxGuaranteeAmountInWords || ''} placeholder="Quinientos mil quetzales" /></Field>
          </div>
        </div>
      );

    case 'signatures':
      return (
        <div key="signatures" className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <h3 className="text-lg font-medium text-stone-900">Bloque de firmas</h3>
          <p className="mt-1 text-sm text-stone-500">Finalice los firmantes y mueva el documento a su siguiente hito.</p>
          <div className="mt-4 space-y-3">
            {data.signatureNames.map((name, index) => (
              <div className="flex gap-3" key={`signature-${index}`}>
                <input className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500" onChange={(e) => { const s = [...data.signatureNames]; s[index] = e.target.value; updateData({ ...data, signatureNames: s }); }} placeholder="Nombre del firmante" value={name} />
                <button className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 transition hover:bg-stone-100" disabled={data.signatureNames.length === 1} onClick={() => updateData({ ...data, signatureNames: data.signatureNames.filter((_, i) => i !== index) })} type="button">Eliminar</button>
              </div>
            ))}
            <button className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600 transition hover:bg-white" disabled={!permissions.canEditContent} onClick={addSignature} type="button">Agregar firmante</button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function renderSectionsForStep(sections: FormSection[], ctx: SectionContext): ReactNode {
  return <div className="space-y-5">{sections.map((s) => renderSection(s, ctx))}</div>;
}

function SaveIndicator({ state }: { state: SaveIndicatorState }) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500">
        <Loader2 size={14} className="animate-spin" />
        Guardando...
      </span>
    );
  }
  if (state === 'unsaved') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        <AlertCircle size={14} />
        Sin guardar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
      <CheckCircle2 size={14} />
      Guardado
    </span>
  );
}

export function DocumentEditor({
  contacts,
  initialData,
  initialType,
  mode,
  templateContent,
  templateLoading = false,
  saveIndicator,
  onChange,
  onSaveNow,
  onMarkReady,
  onDuplicate,
  onArchive,
  onRestore,
  onRegenerate,
  onSaveContact,
}: DocumentEditorProps) {
  const permissions = usePermissions();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CounterGuaranteeData>(() => buildInitialData(initialType, initialData));
  const typeConfig = useMemo(() => getDocumentTypeConfig(data.type), [data.type]);
  const wizardSteps = typeConfig.steps;

  useEffect(() => {
    setData(buildInitialData(initialType, initialData));
  }, [initialData, initialType]);

  const updateData = (nextData: CounterGuaranteeData) => {
    if (!permissions.canEditContent) {
      return;
    }
    setData(nextData);
    onChange(nextData);
  };

  const addGuarantor = () => updateData({ ...data, guarantors: [...data.guarantors, createEmptyParty()] });
  const addPolicy = () =>
    updateData({ ...data, policies: [...data.policies, { number: '', type: '', amount: 0, amountInWords: '' }] });
  const addSignature = () => updateData({ ...data, signatureNames: [...data.signatureNames, ''] });

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <section className="min-w-0 overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif italic text-stone-900">
                  {mode === 'create' ? 'Crear documento' : 'Editar documento'}
                </h1>
                <DocumentStatusBadge status={data.status} />
              </div>
              <p className="mt-1 text-sm text-stone-500">
                Redacción estructurada con actualizaciones seguras de versión y vista previa en vivo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SaveIndicator state={saveIndicator} />
              {permissions.canEditContent && data.id ? (
                <button
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                  onClick={() => onDuplicate?.(data)}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy size={15} />
                    Duplicar
                  </span>
                </button>
              ) : null}
              {permissions.canEditContent && data.archivedAt ? (
                <button
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                  onClick={() => onRestore?.(data)}
                  type="button"
                >
                  Restaurar
                </button>
              ) : (
                permissions.canEditContent && data.id ? (
                  <button
                    className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                    onClick={() => onArchive?.(data)}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FolderArchive size={15} />
                      Archivar
                    </span>
                  </button>
                ) : null
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${wizardSteps.length}, minmax(0, 1fr))` }}>
            {wizardSteps.map((item, index) => (
              <button
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  step === index
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                }`}
                key={item.label}
                onClick={() => {
                  setStep(index);
                }}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.2em]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-sm font-medium">{item.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          {renderSectionsForStep(wizardSteps[step]?.sections ?? [], {
            data, updateData, contacts, permissions, addGuarantor, addPolicy, addSignature,
            onSaveContact,
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-6 py-5">
          <button
            className="rounded-xl px-4 py-2 text-sm text-stone-600 transition hover:bg-white disabled:opacity-50"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ChevronLeft size={16} />
              Anterior
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              disabled={!permissions.canEditContent}
              onClick={() => onSaveNow?.(data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <Save size={16} />
                Guardar ahora
              </span>
            </button>
            <button
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              disabled={!permissions.canEditContent}
              onClick={() => onMarkReady?.(data)}
              type="button"
            >
              Marcar listo
            </button>
            <button
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              disabled={!permissions.canEditContent}
              onClick={() => onRegenerate?.('pdf', data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCw size={16} />
                Regenerar PDF
              </span>
            </button>
            <button
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              disabled={step === wizardSteps.length - 1}
              onClick={() => {
                const nextStep = Math.min(wizardSteps.length - 1, step + 1);
                setStep(nextStep);
                const isLastStep = nextStep === wizardSteps.length - 1;
                const lastStepHasSignatures = wizardSteps[nextStep]?.sections.includes('signatures');
                if (isLastStep && lastStepHasSignatures && data.signatureNames.length === 1 && !data.signatureNames[0]) {
                  const defaultSignatures = [
                    data.principal.name,
                    ...data.guarantors.map((g) => g.name),
                  ].filter(Boolean);
                  if (defaultSignatures.length > 0) {
                    updateData({ ...data, signatureNames: defaultSignatures });
                  }
                }
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                Siguiente
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </div>
      </section>

      <aside className="min-w-0 space-y-6">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">Acciones de flujo de trabajo</h2>
          <div className="mt-4 grid gap-3">
            <button
              className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
              disabled={!permissions.canEditContent}
              onClick={() => onRegenerate?.('pdf', data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <FileText size={16} />
                Generar PDF
              </span>
            </button>
            <button
              className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
              disabled={!permissions.canEditContent}
              onClick={() => onRegenerate?.('word', data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <FileText size={16} />
                Generar Word
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-[620px]">
          <LivePreview
            canEditPreviewInsertions={permissions.canEditContent}
            data={data}
            loading={templateLoading}
            onPreviewInsertionsChange={(previewInsertions) => updateData({ ...data, previewInsertions })}
            templateContent={templateContent}
            type={data.type}
          />
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">{label}</span>
      {children}
    </label>
  );
}
