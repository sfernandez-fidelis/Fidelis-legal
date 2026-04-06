import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, CheckCircle2, Clock3, Save, Search, Sparkles, Trash2, User } from 'lucide-react';
import type { ContactData, ContactType, PartyDetails } from '../../types';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { useContactSuggestions } from '../../features/contacts/hooks/useContactSuggestions';
import { contactTypeLabels, normalizeText } from '../../features/contacts/contactUtils';

interface Props {
  party: PartyDetails;
  onChange: (updated: PartyDetails) => void;
  title: string;
  contacts: ContactData[];
  suggestionTypes?: ContactType[];
  onSaveContact?: (party: PartyDetails) => Promise<void> | void;
  onRemove?: () => void;
}

export default function PartyForm({
  party,
  onChange,
  title,
  contacts,
  suggestionTypes,
  onSaveContact,
  onRemove,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dpiError, setDpiError] = useState('');
  const [actaWarning, setActaWarning] = useState('');
  const [autoFillSuggestion, setAutoFillSuggestion] = useState<ContactData | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const suggestionQuery = useContactSuggestions(debouncedSearch, {
    limit: 6,
    types: suggestionTypes,
    enabled: showSearch || Boolean(debouncedSearch),
  });
  const recentQuery = useContactSuggestions('', {
    limit: 5,
    types: suggestionTypes,
    enabled: showSearch,
    sort: 'recent',
  });

  const localMatches = useMemo(
    () =>
      contacts.filter((contact) =>
        [contact.displayName, contact.party.name, contact.party.entityName]
          .filter(Boolean)
          .some((value) => normalizeText(String(value)).includes(normalizeText(searchTerm))),
      ),
    [contacts, searchTerm],
  );

  const suggestionResults = debouncedSearch.trim() ? suggestionQuery.data ?? localMatches.slice(0, 6) : recentQuery.data ?? contacts.slice(0, 5);

  const handleSelectContact = (contactParty: PartyDetails) => {
    onChange(contactParty);
    setShowSearch(false);
    setSearchTerm('');
    setAutoFillSuggestion(null);
  };

  useEffect(() => {
    const exactMatch = contacts.find((contact) => {
      if (party.idNumber && contact.party.idNumber === party.idNumber && contact.party.name !== party.name) {
        return true;
      }

      if (
        party.entityName &&
        normalizeText(contact.party.entityName) === normalizeText(party.entityName) &&
        normalizeText(contact.party.name) !== normalizeText(party.name)
      ) {
        return true;
      }

      if (
        party.name &&
        party.name.length > 4 &&
        normalizeText(contact.party.name) === normalizeText(party.name) &&
        contact.party.idNumber !== party.idNumber
      ) {
        return true;
      }

      return false;
    });

    setAutoFillSuggestion(exactMatch ?? null);
  }, [contacts, party.entityName, party.idNumber, party.name]);

  useEffect(() => {
    if (party.idNumber && party.idNumber.length > 0 && party.idNumber.length !== 13) {
      setDpiError('El DPI debe tener exactamente 13 digitos.');
      return;
    }

    setDpiError('');
  }, [party.idNumber]);

  useEffect(() => {
    if (party.isRepresenting && party.actDate) {
      const actDate = new Date(party.actDate);
      const today = new Date();
      const diffYears = Math.abs(today.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (diffYears > 3) {
        setActaWarning('El acta notarial tiene mas de 3 anos. Verifique su vigencia.');
        return;
      }
    }

    setActaWarning('');
  }, [party.actDate, party.isRepresenting]);

  const handleSaveContact = async () => {
    if (!onSaveContact) {
      return;
    }

    setIsSavingContact(true);
    try {
      await onSaveContact(party);
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <div className="relative space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
          <User className="text-brand-600" size={18} />
          {title}
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            onClick={() => setShowSearch((current) => !current)}
            type="button"
          >
            <Search size={14} />
            Use saved contact
          </button>
          {onSaveContact ? (
            <button
              className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50"
              disabled={isSavingContact || !party.name}
              onClick={handleSaveContact}
              type="button"
            >
              <Save size={14} />
              {isSavingContact ? 'Saving...' : 'Save as new contact'}
            </button>
          ) : null}
          <label className="group flex cursor-pointer items-center gap-2">
            <div className={`relative h-5 w-10 rounded-full transition-colors ${party.isRepresenting ? 'bg-brand-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-transform ${party.isRepresenting ? 'left-6' : 'left-1'}`} />
            </div>
            <input
              checked={party.isRepresenting}
              className="hidden"
              onChange={(event) => onChange({ ...party, isRepresenting: event.target.checked })}
              type="checkbox"
            />
            <span className="text-xs font-medium text-gray-600 transition-colors group-hover:text-brand-600">
              Represents an entity
            </span>
          </label>
          {onRemove ? (
            <button
              className="ml-2 text-gray-400 transition-colors hover:text-red-600"
              onClick={onRemove}
              title="Eliminar"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {showSearch ? (
        <div className="animate-in slide-in-from-top-2 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, company, or document ID..."
              type="text"
              value={searchTerm}
            />
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gray-400">
            {debouncedSearch ? <Sparkles size={13} /> : <Clock3 size={13} />}
            {debouncedSearch ? 'Matching suggestions' : 'Recent contacts'}
          </div>
          <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {suggestionResults.length ? (
              suggestionResults.map((contact) => (
                <button
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-brand-50"
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.party)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contact.displayName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {[contact.party.entityName, contact.party.idNumber, ...(contact.contactTypes ?? []).slice(0, 2).map((type) => contactTypeLabels[type])]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{contact.metadata.useCount ?? 0} uses</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-center text-xs text-gray-500">No contacts found.</p>
            )}
          </div>
        </div>
      ) : null}

      {autoFillSuggestion ? (
        <div className="animate-in flex items-start justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 fade-in">
          <div className="flex gap-3">
            <div className="mt-0.5 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Autofill available</p>
              <p className="mt-1 text-xs text-blue-700">
                We found saved details for <strong>{autoFillSuggestion.displayName}</strong>. Use them to fill this section instantly.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              onClick={() => setAutoFillSuggestion(null)}
              type="button"
            >
              Ignore
            </button>
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              onClick={() => handleSelectContact(autoFillSuggestion.party)}
              type="button"
            >
              Autofill
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Full name</label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
            onChange={(event) => onChange({ ...party, name: event.target.value })}
            type="text"
            value={party.name}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Age</label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
            onChange={(event) => onChange({ ...party, age: event.target.value })}
            type="number"
            value={party.age}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Marital status</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
            onChange={(event) => onChange({ ...party, maritalStatus: event.target.value })}
            value={party.maritalStatus}
          >
            <option value="soltero">Soltero</option>
            <option value="casado">Casado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Profession</label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
            onChange={(event) => onChange({ ...party, profession: event.target.value })}
            type="text"
            value={party.profession}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Domicile</label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
            onChange={(event) => onChange({ ...party, domicile: event.target.value })}
            type="text"
            value={party.domicile}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">DPI / CUI</label>
          <input
            className={`w-full rounded-lg border bg-gray-50 p-2.5 font-mono outline-none transition-all focus:border-transparent ${dpiError ? 'border-red-300 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-brand-500'}`}
            maxLength={13}
            onChange={(event) => onChange({ ...party, idNumber: event.target.value.replace(/\D/g, '') })}
            placeholder="1965878401501"
            type="text"
            value={party.idNumber}
          />
          {dpiError ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle size={12} />
              {dpiError}
            </p>
          ) : null}
        </div>
      </div>

      {party.isRepresenting ? (
        <div className="animate-in mt-6 space-y-4 rounded-xl border border-brand-100 bg-brand-50/50 p-6 fade-in slide-in-from-top-2">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-800">
            <Briefcase size={16} />
            Entity and representation details
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Entity name</label>
              <input
                className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                onChange={(event) => onChange({ ...party, entityName: event.target.value })}
                type="text"
                value={party.entityName}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Representative role</label>
              <input
                className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                onChange={(event) => onChange({ ...party, role: event.target.value })}
                type="text"
                value={party.role}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Notary</label>
              <input
                className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                onChange={(event) => onChange({ ...party, notaryName: event.target.value })}
                type="text"
                value={party.notaryName}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Act date</label>
              <input
                className={`w-full rounded-lg border bg-white p-2.5 outline-none transition-all focus:border-transparent ${actaWarning ? 'border-amber-300 focus:ring-2 focus:ring-amber-500' : 'border-brand-200 focus:ring-2 focus:ring-brand-500'}`}
                onChange={(event) => onChange({ ...party, actDate: event.target.value })}
                type="date"
                value={party.actDate}
              />
              {actaWarning ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle size={12} />
                  {actaWarning}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Registry</label>
                <input
                  className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => onChange({ ...party, regNumber: event.target.value })}
                  type="text"
                  value={party.regNumber}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Folio</label>
                <input
                  className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => onChange({ ...party, regFolio: event.target.value })}
                  type="text"
                  value={party.regFolio}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-700">Book</label>
                <input
                  className="w-full rounded-lg border border-brand-200 bg-white p-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500"
                  onChange={(event) => onChange({ ...party, regBook: event.target.value })}
                  type="text"
                  value={party.regBook}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
