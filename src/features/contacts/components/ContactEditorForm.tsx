import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { ContactData, ContactMetadata, ContactRecordType, ContactType, PartyDetails } from '../../../types';
import {
  contactRecordTypeLabels,
  contactTypeLabels,
  createEmptyParty,
  mergeUnique,
} from '../contactUtils';
import { usePermissions } from '../../auth/hooks/usePermissions';

interface ContactEditorFormProps {
  contact?: ContactData;
  existingContacts?: ContactData[];
  onSubmit: (payload: { party: PartyDetails; metadata: Partial<ContactMetadata>; contactTypes: ContactType[] }) => Promise<void> | void;
  submitLabel: string;
}

const allContactTypes = Object.keys(contactTypeLabels) as ContactType[];
const allRecordTypes = Object.keys(contactRecordTypeLabels) as ContactRecordType[];

export function ContactEditorForm({
  contact,
  existingContacts = [],
  onSubmit,
  submitLabel,
}: ContactEditorFormProps) {
  const permissions = usePermissions();
  const [party, setParty] = useState<PartyDetails>(contact?.party ?? createEmptyParty());
  const [recordType, setRecordType] = useState<ContactRecordType>(contact?.recordType ?? 'person');
  const [contactTypes, setContactTypes] = useState<ContactType[]>(contact?.contactTypes ?? ['principal']);
  const [tagsInput, setTagsInput] = useState((contact?.tags ?? []).join(', '));
  const [notes, setNotes] = useState(contact?.metadata.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const duplicateMatches = useMemo(() => {
    const normalizedName = party.name.trim().toLowerCase();
    const normalizedEntity = (party.entityName ?? '').trim().toLowerCase();
    return existingContacts.filter((item) => {
      if (contact?.id === item.id) {
        return false;
      }

      return (
        (party.idNumber && item.party.idNumber === party.idNumber) ||
        (normalizedEntity && item.party.entityName?.trim().toLowerCase() === normalizedEntity) ||
        (normalizedName && item.party.name.trim().toLowerCase() === normalizedName)
      );
    });
  }, [contact?.id, existingContacts, party.entityName, party.idNumber, party.name]);

  const toggleContactType = (type: ContactType) => {
    setContactTypes((current) => {
      if (current.includes(type)) {
        const nextTypes = current.filter((item) => item !== type);
        return nextTypes.length ? nextTypes : [type];
      }

      return [...current, type];
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!permissions.canEditContent) {
      return;
    }
    setIsSaving(true);

    try {
      await onSubmit({
        party,
        contactTypes,
        metadata: {
          recordType,
          tags: mergeUnique(tagsInput.split(',')),
          notes,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif italic text-stone-900">Identity</h2>
            <p className="mt-1 text-sm text-stone-500">Define what kind of reusable contact this is and how the team will find it.</p>
          </div>
          {duplicateMatches.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {duplicateMatches.length} possible duplicate{duplicateMatches.length > 1 ? 's' : ''} found in the library.
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Record type">
            <div className="flex flex-wrap gap-2">
              {allRecordTypes.map((type) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    recordType === type ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                  key={type}
                  disabled={!permissions.canEditContent}
                  onClick={() => setRecordType(type)}
                  type="button"
                >
                  {contactRecordTypeLabels[type]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Contact tags">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="client, banking, repeat"
              value={tagsInput}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Contact roles">
              <div className="flex flex-wrap gap-2">
                {allContactTypes.map((type) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      contactTypes.includes(type)
                        ? 'bg-brand-600 text-white'
                        : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                    key={type}
                    disabled={!permissions.canEditContent}
                    onClick={() => toggleContactType(type)}
                    type="button"
                  >
                    {contactTypeLabels[type]}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-serif italic text-stone-900">Profile</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, name: event.target.value })}
              value={party.name}
            />
          </Field>
          <Field label="Entity name">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, entityName: event.target.value })}
              value={party.entityName ?? ''}
            />
          </Field>
          <Field label="DPI">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              maxLength={13}
              onChange={(event) => setParty({ ...party, idNumber: event.target.value.replace(/\D/g, '') })}
              value={party.idNumber}
            />
          </Field>
          <Field label="CUI">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, cui: event.target.value.replace(/\D/g, '') })}
              value={party.cui}
            />
          </Field>
          <Field label="Profession">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, profession: event.target.value })}
              value={party.profession}
            />
          </Field>
          <Field label="Domicile">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, domicile: event.target.value })}
              value={party.domicile}
            />
          </Field>
          <Field label="Representative role">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, role: event.target.value })}
              value={party.role ?? ''}
            />
          </Field>
          <Field label="Notary">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, notaryName: event.target.value })}
              value={party.notaryName ?? ''}
            />
          </Field>
          <Field label="Act date">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, actDate: event.target.value })}
              type="date"
              value={party.actDate ?? ''}
            />
          </Field>
          <Field label="Registry">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, regNumber: event.target.value })}
              value={party.regNumber ?? ''}
            />
          </Field>
          <Field label="Folio">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, regFolio: event.target.value })}
              value={party.regFolio ?? ''}
            />
          </Field>
          <Field label="Book">
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setParty({ ...party, regBook: event.target.value })}
              value={party.regBook ?? ''}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                className="min-h-28 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything the team should remember about this contact"
                value={notes}
              />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {!permissions.canEditContent ? 'Read only' : isSaving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
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
