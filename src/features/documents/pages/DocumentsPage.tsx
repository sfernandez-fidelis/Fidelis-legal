import { format } from 'date-fns';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContractType, type DocumentFilters, type DocumentSort, type SavedDocumentView } from '../../../types';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { EmptyState } from '../../../shared/components/EmptyState';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { useDocumentsQuery } from '../hooks/useDocumentsQuery';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { getDocumentTypeLabel } from '../components/documentLabels';

const DEFAULT_PAGE_SIZE = 12;
const SAVED_VIEWS_KEY = 'legal.documents.savedViews';

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Ready', value: 'ready' },
  { label: 'Generated', value: 'generated' },
  { label: 'Archived', value: 'archived' },
] as const;

const contractTypeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Private counter-guarantee', value: ContractType.COUNTER_GUARANTEE_PRIVATE },
  { label: 'Public counter-guarantee', value: ContractType.COUNTER_GUARANTEE_PUBLIC },
  { label: 'Mortgage guarantee', value: ContractType.MORTGAGE_GUARANTEE },
] as const;

const sortOptions: Array<{ label: string; value: DocumentSort }> = [
  { label: 'Recently updated', value: 'updated_at:desc' },
  { label: 'Recently created', value: 'created_at:desc' },
  { label: 'Oldest first', value: 'created_at:asc' },
  { label: 'Title A-Z', value: 'title:asc' },
  { label: 'Title Z-A', value: 'title:desc' },
];

const defaultViews: SavedDocumentView[] = [
  {
    id: 'active-drafts',
    name: 'Draft queue',
    filters: { status: 'draft', sort: 'updated_at:desc' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ready-to-generate',
    name: 'Ready to generate',
    filters: { status: 'ready', sort: 'updated_at:desc' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'generated-library',
    name: 'Generated library',
    filters: { status: 'generated', sort: 'updated_at:desc' },
    createdAt: new Date().toISOString(),
  },
];

function readSavedViews() {
  try {
    const raw = window.localStorage.getItem(SAVED_VIEWS_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedDocumentView[]) : [];
    return [...defaultViews, ...parsed];
  } catch {
    return defaultViews;
  }
}

export function DocumentsPage() {
  const permissions = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedViews, setSavedViews] = useState<SavedDocumentView[]>(() => readSavedViews());
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const filters = useMemo<DocumentFilters>(
    () => ({
      search: debouncedSearch,
      status: (searchParams.get('status') as DocumentFilters['status']) ?? 'all',
      contractType: (searchParams.get('type') as DocumentFilters['contractType']) ?? 'all',
      sort: (searchParams.get('sort') as DocumentSort | null) ?? 'updated_at:desc',
      savedViewId: searchParams.get('view') ?? undefined,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [debouncedSearch, searchParams],
  );
  const documentsQuery = useDocumentsQuery(filters, page);

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if ((searchParams.get('q') ?? '') === debouncedSearch) {
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
  }, [debouncedSearch, searchParams, setSearchParams]);

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'view') {
      next.delete('view');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const saveCurrentView = () => {
    const name = window.prompt('Name this view');
    if (!name) {
      return;
    }

    const nextView: SavedDocumentView = {
      id: crypto.randomUUID(),
      name,
      filters: {
        status: filters.status,
        contractType: filters.contractType,
        sort: filters.sort,
        search: filters.search,
      },
      createdAt: new Date().toISOString(),
    };
    const customViews = [...savedViews.filter((view) => !defaultViews.some((defaultView) => defaultView.id === view.id)), nextView];
    window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(customViews));
    setSavedViews([...defaultViews, ...customViews]);
    setParam('view', nextView.id);
  };

  const applyView = (view: SavedDocumentView) => {
    const next = new URLSearchParams();
    if (view.filters.search) {
      next.set('q', view.filters.search);
    }
    if (view.filters.status && view.filters.status !== 'all') {
      next.set('status', view.filters.status);
    }
    if (view.filters.contractType && view.filters.contractType !== 'all') {
      next.set('type', view.filters.contractType);
    }
    if (view.filters.sort) {
      next.set('sort', view.filters.sort);
    }
    next.set('view', view.id);
    next.set('page', '1');
    setSearchParams(next);
  };

  if (documentsQuery.isError) {
    return (
      <PageErrorState
        message="The documents module could not load the current matter list."
        onRetry={() => documentsQuery.refetch()}
        title="Unable to load documents"
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil((documentsQuery.data?.total ?? 0) / (documentsQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE)));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Documents module</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Document workflow</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Search, filter, revisit, and manage the full legal drafting lifecycle from one dependable table.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            onClick={saveCurrentView}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <Star size={16} />
              Save current view
            </span>
          </button>
          {permissions.canEditContent ? (
            <Link className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black" to="/documents/new">
              New document
            </Link>
          ) : null}
        </div>
      </header>

      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, principal, beneficiary, or policy"
              value={searchInput}
            />
          </label>
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(event) => setParam('status', event.target.value)}
            value={filters.status ?? 'all'}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(event) => setParam('type', event.target.value)}
            value={filters.contractType ?? 'all'}
          >
            {contractTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <SlidersHorizontal size={16} />
            <select className="w-full bg-transparent outline-none" onChange={(event) => setParam('sort', event.target.value)} value={filters.sort}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {savedViews.map((view) => (
            <button
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                filters.savedViewId === view.id
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
              key={view.id}
              onClick={() => applyView(view)}
              type="button"
            >
              {view.name}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <p className="text-sm text-stone-500">{documentsQuery.data?.total ?? 0} documents</p>
          {documentsQuery.isFetching ? <p className="text-xs text-stone-400">Refreshing results...</p> : null}
        </div>

        {!documentsQuery.isLoading && !(documentsQuery.data?.items.length ?? 0) ? (
          <div className="p-6">
            <EmptyState
              action={permissions.canEditContent ? <Link className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white" to="/documents/new">Create document</Link> : undefined}
              description="Adjust filters or start a new document to build your workflow pipeline."
              title="No documents match this view"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-stone-500">
                  <th className="px-5 py-4">Document</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Updated</th>
                  <th className="px-5 py-4">Version</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(documentsQuery.data?.items ?? []).map((document) => (
                  <tr className="align-top" key={document.id}>
                    <td className="px-5 py-4">
                      <div>
                        <Link className="text-sm font-semibold text-stone-900 transition hover:text-brand-700" to={`/documents/${document.id}`}>
                          {document.title || document.principal.entityName || document.principal.name || 'Untitled document'}
                        </Link>
                        <p className="mt-1 text-sm text-stone-500">{document.principal.entityName || document.principal.name}</p>
                        <p className="mt-2 text-xs text-stone-400">{document.beneficiaryName || 'No beneficiary captured yet'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <DocumentStatusBadge status={document.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">{getDocumentTypeLabel(document.type)}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      {document.updatedAt ? format(new Date(document.updatedAt), 'MMM d, yyyy HH:mm') : 'Just created'}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">
                      v{document.metadata?.lifecycle?.currentVersion ?? document.metadata?.lifecycle?.versionCount ?? 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50" to={`/documents/${document.id}`}>
                          View
                        </Link>
                        {permissions.canEditContent ? (
                          <Link className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50" to={`/documents/${document.id}/edit`}>
                            Edit
                          </Link>
                        ) : null}
                        <Link className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50" to={`/documents/${document.id}/history`}>
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:bg-white disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          type="button"
        >
          Previous
        </button>
        <p className="text-sm text-stone-500">
          Page {page} of {totalPages}
        </p>
        <button
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:bg-white disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
