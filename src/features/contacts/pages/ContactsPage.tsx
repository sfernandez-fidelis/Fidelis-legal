import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { SkeletonBlock } from '../../../shared/components/LoadingSkeleton';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import type { ContactType } from '../../../types';
import { contactTypeLabels, findDuplicateGroups } from '../contactUtils';
import { useDeleteContact } from '../hooks/useDeleteContact';
import { useMergeContacts } from '../hooks/useMergeContacts';
import { useContactsQuery } from '../hooks/useContactsQuery';
import { useContactSuggestions } from '../hooks/useContactSuggestions';

const DEFAULT_PAGE_SIZE = 12;
const typeOptions = Object.keys(contactTypeLabels) as ContactType[];

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const rawSearch = searchParams.get('q') ?? '';
  const selectedType = (searchParams.get('type') ?? '') as ContactType | '';
  const sort = (searchParams.get('sort') ?? 'recent') as 'recent' | 'frequent' | 'name';
  const duplicatesOnly = searchParams.get('dupes') === '1';
  const [searchInput, setSearchInput] = useState(rawSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      pageSize: DEFAULT_PAGE_SIZE,
      sort,
      types: selectedType ? [selectedType] : undefined,
      duplicatesOnly,
    }),
    [debouncedSearch, duplicatesOnly, selectedType, sort],
  );

  const contactsQuery = useContactsQuery(filters, page);
  const recentContactsQuery = useContactSuggestions('', { limit: 5, sort: 'recent' });
  const frequentContactsQuery = useContactSuggestions('', { limit: 5, sort: 'frequent' });
  const deleteContact = useDeleteContact();
  const mergeContacts = useMergeContacts();
  const totalPages = Math.max(1, Math.ceil((contactsQuery.data?.total ?? 0) / (contactsQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE)));
  const duplicateGroups = useMemo(() => findDuplicateGroups(contactsQuery.data?.items ?? []), [contactsQuery.data?.items]);

  useEffect(() => {
    setSearchInput(rawSearch);
  }, [rawSearch]);

  useEffect(() => {
    if (debouncedSearch === rawSearch) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      next.set('q', debouncedSearch);
    } else {
      next.delete('q');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, rawSearch, searchParams, setSearchParams]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  if (contactsQuery.isError) {
    return (
      <PageErrorState
        message="No fue posible cargar la biblioteca de contactos."
        onRetry={() => contactsQuery.refetch()}
        title="No se pudieron cargar los contactos"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Biblioteca inteligente</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Contactos</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Partes legales, entidades, notarios y representantes reutilizables que agilizan la redacción de documentos.
          </p>
        </div>
        <Link className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black" to="/contacts/new">
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            Nuevo contacto
          </span>
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px_300px]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por nombre, empresa, DPI, etiqueta o rol..."
              type="search"
              value={searchInput}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={!selectedType} label="Todos los tipos" onClick={() => updateParam('type')} />
            {typeOptions.map((type) => (
              <FilterChip
                active={selectedType === type}
                key={type}
                label={contactTypeLabels[type]}
                onClick={() => updateParam('type', selectedType === type ? undefined : type)}
              />
            ))}
            <FilterChip
              active={duplicatesOnly}
              label="Duplicados"
              onClick={() => updateParam('dupes', duplicatesOnly ? undefined : '1')}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={sort === 'recent'} label="Más recientes" onClick={() => updateParam('sort', 'recent')} />
            <FilterChip active={sort === 'frequent'} label="Más usados" onClick={() => updateParam('sort', 'frequent')} />
            <FilterChip active={sort === 'name'} label="A-Z" onClick={() => updateParam('sort', 'name')} />
          </div>
        </div>

        <SuggestionCard
          items={recentContactsQuery.data ?? []}
          subtitle="Contactos recientes"
          title="Listos para usar"
        />
        <SuggestionCard
          items={frequentContactsQuery.data ?? []}
          subtitle="Más usados"
          title="Entidades frecuentes"
        />
      </div>

      {duplicateGroups.length ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-amber-950">Control de duplicados</h2>
              <p className="mt-1 text-sm text-amber-800">
                Combina registros repetidos para mantener limpios los resultados y mejorar el autocompletado.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {duplicateGroups.slice(0, 3).map((group) => {
              const [primary, ...duplicates] = group;
              return (
                <div className="rounded-2xl border border-amber-200 bg-white p-4" key={primary.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{primary.displayName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {group.map((item) => item.displayName).join(' • ')}
                      </p>
                    </div>
                    <button
                      className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                      onClick={() =>
                        mergeContacts.mutate(
                          { primaryId: primary.id, duplicateIds: duplicates.map((item) => item.id) },
                          {
                            onSuccess: () => toast.success('Duplicados combinados'),
                            onError: () => toast.error('No se pudo combinar'),
                          },
                        )
                      }
                      type="button"
                    >
                      Combinar duplicados
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {contactsQuery.isLoading && !contactsQuery.data ? (
        <ContactsTableSkeleton />
      ) : contactsQuery.data?.items.length ? (
        <>
          <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Tipos</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Uso</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {contactsQuery.data.items.map((contact) => (
                  <tr className="transition-colors hover:bg-stone-50" key={contact.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">{contact.displayName}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {[contact.party.entityName, contact.party.idNumber, contact.tags.slice(0, 2).join(', ')].filter(Boolean).join(' • ') || 'Contacto legal reutilizable'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {contact.contactTypes.map((type) => (
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700" key={type}>
                            {contactTypeLabels[type]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      <p>{contact.metadata.useCount ?? 0} usos</p>
                      <p className="mt-1">{contact.metadata.lastUsedAt ? new Date(contact.metadata.lastUsedAt).toLocaleDateString() : 'Aún no se ha usado'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
                          to={`/contacts/${contact.id}/edit`}
                        >
                          Editar
                        </Link>
                        <button
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
                          onClick={() =>
                            deleteContact.mutate(contact.id, {
                              onSuccess: () => toast.success('Contacto archivado'),
                              onError: () => toast.error('No se pudo archivar'),
                            })
                          }
                          type="button"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Trash2 size={14} />
                            Archivar
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
            <button
              className="rounded-lg px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}
              type="button"
            >
              Anterior
            </button>
            <p className="text-sm text-stone-500">
              Página {page} de {totalPages}
            </p>
            <button
              className="rounded-lg px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          description="Los contactos aparecerán aquí a medida que se guarden documentos."
          title="Aún no hay contactos"
        />
      )}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SuggestionCard({
  items,
  subtitle,
  title,
}: {
  items: Array<{ id: string; displayName: string; contactTypes: ContactType[] }>;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{subtitle}</p>
      <h2 className="mt-2 text-lg font-medium text-stone-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <Link
              className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
              key={item.id}
              to={`/contacts/${item.id}/edit`}
            >
              <div>
                <p className="font-medium">{item.displayName}</p>
                <p className="mt-1 text-xs text-stone-500">{item.contactTypes.map((type) => contactTypeLabels[type]).join(' • ')}</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))
        ) : (
          <p className="text-sm text-stone-500">Las sugerencias aparecerán aquí luego de algunos documentos guardados.</p>
        )}
      </div>
    </div>
  );
}

function ContactsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
      <div className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="grid grid-cols-[1.2fr_1fr_1fr_120px] gap-4" key={index}>
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
