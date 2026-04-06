import { format } from 'date-fns';
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, FileText, FolderArchive, Plus, RotateCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import PartyForm from '../../../components/forms/PartyForm';
import PolicyForm from '../../../components/forms/PolicyForm';
import LivePreview from '../../../components/LivePreview';
import type { ContactData, CounterGuaranteeData, ContractType, PartyDetails } from '../../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { createEmptyParty } from '../../contacts/contactUtils';
import { usePermissions } from '../../auth/hooks/usePermissions';

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

const steps = ['Overview', 'Parties', 'Policies', 'Final Review'] as const;

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
    signatureNames: [''],
    createdAt: new Date().toISOString(),
  };
}

function getSaveLabel(saveIndicator: SaveIndicatorState) {
  switch (saveIndicator) {
    case 'saving':
      return 'Saving...';
    case 'saved':
      return 'Saved';
    case 'unsaved':
    default:
      return 'Unsaved changes';
  }
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

  useEffect(() => {
    setData(buildInitialData(initialType, initialData));
  }, [initialData, initialType]);

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const updateData = (nextData: CounterGuaranteeData) => {
    if (!permissions.canEditContent) {
      return;
    }
    setData(nextData);
  };

  const addGuarantor = () => updateData({ ...data, guarantors: [...data.guarantors, createEmptyParty()] });
  const addPolicy = () =>
    updateData({ ...data, policies: [...data.policies, { number: '', type: '', amount: 0, amountInWords: '' }] });
  const addSignature = () => updateData({ ...data, signatureNames: [...data.signatureNames, ''] });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif italic text-stone-900">
                  {mode === 'create' ? 'Create document' : 'Edit document'}
                </h1>
                <DocumentStatusBadge status={data.status} />
              </div>
              <p className="mt-1 text-sm text-stone-500">
                Structured drafting with version-safe updates and a live preview.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500">
                <CheckCircle2 size={14} />
                {getSaveLabel(saveIndicator)}
              </span>
              {permissions.canEditContent && data.id ? (
                <button
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                  onClick={() => onDuplicate?.(data)}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy size={15} />
                    Duplicate
                  </span>
                </button>
              ) : null}
              {permissions.canEditContent && data.archivedAt ? (
                <button
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                  onClick={() => onRestore?.(data)}
                  type="button"
                >
                  Restore
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
                      Archive
                    </span>
                  </button>
                ) : null
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-4">
            {steps.map((item, index) => (
              <button
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  step === index
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                }`}
                key={item}
                  disabled={!permissions.canEditContent}
                  onClick={() => setStep(index)}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.2em]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-sm font-medium">{item}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Document title">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => updateData({ ...data, title: event.target.value })}
                  placeholder="Use a client-facing title"
                  value={data.title ?? ''}
                />
              </Field>
              <Field label="Contract date">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => updateData({ ...data, contractDate: event.target.value })}
                  type="date"
                  value={data.contractDate}
                />
              </Field>
              <Field label="Beneficiary">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => updateData({ ...data, beneficiaryName: event.target.value })}
                  placeholder="Beneficiary name"
                  value={data.beneficiaryName}
                />
              </Field>
              <Field label="Notifications">
                <textarea
                  className="min-h-28 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => updateData({ ...data, notificationAddress: event.target.value })}
                  placeholder="Notification address"
                  value={data.notificationAddress}
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <PartyForm
                contacts={contacts}
                onChange={(principal) => updateData({ ...data, principal })}
                onSaveContact={(party) => onSaveContact?.(party, 'principal')}
                party={data.principal}
                suggestionTypes={['principal', 'representative', 'entity', 'notary']}
                title="Principal party"
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-stone-900">Additional guarantors</h3>
                  <p className="text-sm text-stone-500">Keep secondary parties structured for future revisions.</p>
                </div>
                <button
                  className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                  disabled={!permissions.canEditContent}
                  onClick={addGuarantor}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={15} />
                    Add guarantor
                  </span>
                </button>
              </div>
              {data.guarantors.map((guarantor, index) => (
                <PartyForm
                  contacts={contacts}
                  key={`${guarantor.name}-${index}`}
                  onChange={(nextParty) => {
                    const guarantors = [...data.guarantors];
                    guarantors[index] = nextParty;
                    updateData({ ...data, guarantors });
                  }}
                  onSaveContact={(party) => onSaveContact?.(party, 'guarantor')}
                  onRemove={() => updateData({ ...data, guarantors: data.guarantors.filter((_, itemIndex) => itemIndex !== index) })}
                  party={guarantor}
                  suggestionTypes={['guarantor', 'representative', 'entity', 'notary']}
                  title={`Guarantor ${index + 1}`}
                />
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-stone-900">Policies</h3>
                  <p className="text-sm text-stone-500">Each policy remains queryable for search and reporting.</p>
                </div>
                <button
                  className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                  disabled={!permissions.canEditContent}
                  onClick={addPolicy}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={15} />
                    Add policy
                  </span>
                </button>
              </div>
              {data.policies.map((policy, index) => (
                <PolicyForm
                  canRemove={data.policies.length > 1}
                  key={`${policy.number}-${index}`}
                  onChange={(nextPolicy) => {
                    const policies = [...data.policies];
                    policies[index] = nextPolicy;
                    updateData({ ...data, policies });
                  }}
                  onRemove={() => updateData({ ...data, policies: data.policies.filter((_, itemIndex) => itemIndex !== index) })}
                  policy={policy}
                />
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <h3 className="text-lg font-medium text-stone-900">Signature block</h3>
                <p className="mt-1 text-sm text-stone-500">Finalize signers and move the document to its next milestone.</p>
                <div className="mt-4 space-y-3">
                  {data.signatureNames.map((name, index) => (
                    <div className="flex gap-3" key={`${name}-${index}`}>
                      <input
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                        onChange={(event) => {
                          const signatureNames = [...data.signatureNames];
                          signatureNames[index] = event.target.value;
                          updateData({ ...data, signatureNames });
                        }}
                        placeholder="Signer name"
                        value={name}
                      />
                      <button
                        className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 transition hover:bg-stone-100"
                        disabled={data.signatureNames.length === 1}
                        onClick={() =>
                          updateData({
                            ...data,
                            signatureNames: data.signatureNames.filter((_, itemIndex) => itemIndex !== index),
                          })
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600 transition hover:bg-white"
                    disabled={!permissions.canEditContent}
                    onClick={addSignature}
                    type="button"
                  >
                    Add signer
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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
              Previous
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
                Save now
              </span>
            </button>
            <button
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              disabled={!permissions.canEditContent}
              onClick={() => onMarkReady?.(data)}
              type="button"
            >
              Mark ready
            </button>
            <button
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              disabled={!permissions.canEditContent}
              onClick={() => onRegenerate?.('pdf', data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCw size={16} />
                Regenerate PDF
              </span>
            </button>
            <button
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              disabled={step === steps.length - 1}
              onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                Next
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">Workflow actions</h2>
          <div className="mt-4 grid gap-3">
            <button
              className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
              disabled={!permissions.canEditContent}
              onClick={() => onRegenerate?.('pdf', data)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <FileText size={16} />
                Generate PDF
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
                Generate Word
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-[620px]">
          <LivePreview data={data} loading={templateLoading} templateContent={templateContent} type={data.type} />
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
