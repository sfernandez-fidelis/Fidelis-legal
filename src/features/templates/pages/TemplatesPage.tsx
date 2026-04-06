import { useMemo, useState } from 'react';
import { FilePlus2, GitBranch, Layers3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ContractType } from '../../../types';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { SkeletonBlock } from '../../../shared/components/LoadingSkeleton';
import { PermissionNotice } from '../../../shared/components/PermissionNotice';
import { useCreateTemplate } from '../hooks/useTemplateMutations';
import { useTemplatesQuery } from '../hooks/useTemplatesQuery';
import { getTemplateStateLabel, getTemplateTypeLabel } from '../templateLabels';

const stateFilters = ['all', 'draft', 'published', 'archived'] as const;

export function TemplatesPage() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const templatesQuery = useTemplatesQuery();
  const createTemplate = useCreateTemplate();
  const [selectedType, setSelectedType] = useState<ContractType | 'all'>('all');
  const [selectedState, setSelectedState] = useState<(typeof stateFilters)[number]>('all');

  const filteredTemplates = useMemo(() => {
    return (templatesQuery.data ?? []).filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      if (selectedState !== 'all' && item.status !== selectedState) {
        return false;
      }

      return true;
    });
  }, [selectedState, selectedType, templatesQuery.data]);

  const missingTypes = useMemo(
    () => Object.values(ContractType).filter((type) => !(templatesQuery.data ?? []).some((item) => item.type === type)),
    [templatesQuery.data],
  );

  if (templatesQuery.isError) {
    return (
      <PageErrorState
        message="No fue posible cargar el catalogo de plantillas."
        onRetry={() => templatesQuery.refetch()}
        title="No se pudo abrir la gestion de plantillas"
      />
    );
  }

  if (templatesQuery.isLoading && !templatesQuery.data) {
    return <TemplatesSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Template management</p>
          <h1 className="text-4xl font-serif italic text-stone-900">Deliberate template releases</h1>
          <p className="max-w-3xl text-sm text-stone-500">
            Draft safely, review live output, publish with notes, and keep a reliable history for rollback.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            label="Contract type"
            onChange={(value) => setSelectedType((value as ContractType | 'all') ?? 'all')}
            options={[
              { label: 'All contract types', value: 'all' },
              ...Object.values(ContractType).map((type) => ({ label: getTemplateTypeLabel(type), value: type })),
            ]}
            value={selectedType}
          />
          <FilterSelect
            label="State"
            onChange={(value) => setSelectedState((value as (typeof stateFilters)[number]) ?? 'all')}
            options={stateFilters.map((state) => ({
              label: state === 'all' ? 'All states' : getTemplateStateLabel(state),
              value: state,
            }))}
            value={selectedState}
          />
        </div>
      </header>

      {!permissions.canEditContent ? (
        <PermissionNotice message="Viewer access is read-only. Template drafting and publishing are hidden for this role." />
      ) : null}

      {missingTypes.length && permissions.canEditContent ? (
        <section className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-medium text-stone-900">Create a managed template</h2>
              <p className="mt-1 text-sm text-stone-500">
                Start from the default contract language and move it into the versioned workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingTypes.map((type) => (
                <button
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
                  disabled={createTemplate.isPending}
                  key={type}
                  onClick={async () => {
                    const templateId = await createTemplate.mutateAsync(type);
                    toast.success('Template draft created');
                    navigate(`/templates/${templateId}`);
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FilePlus2 size={16} />
                    {getTemplateTypeLabel(type)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredTemplates.map((template) => (
          <article className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm" key={template.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                    {getTemplateTypeLabel(template.type)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
                      template.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : template.status === 'archived'
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {getTemplateStateLabel(template.status)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-stone-900">{template.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {template.description || 'Version-controlled legal language with publish protection.'}
                  </p>
                </div>
              </div>

              <Link className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50" to={`/templates/${template.id}`}>
                {permissions.canEditContent ? 'Open' : 'View'}
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="Latest version" value={`v${template.latestVersionNumber}`} />
              <StatCard
                label="Published"
                value={
                  template.publishedVersionId
                    ? template.draftVersionId === template.publishedVersionId
                      ? `v${template.latestVersionNumber}`
                      : 'Active'
                    : 'None'
                }
              />
              <StatCard label="Used by docs" value={String(template.usedByDocuments)} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
              <span className="inline-flex items-center gap-2">
                <GitBranch size={16} />
                {template.hasUnpublishedChanges ? 'Unpublished draft waiting review' : 'Published state is current'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers3 size={16} />
                Updated {new Date(template.updatedAt).toLocaleString()}
              </span>
            </div>
          </article>
        ))}
      </section>

      {!filteredTemplates.length ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No templates match the current filters.
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 text-base font-medium text-stone-900">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <select
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SkeletonBlock className="h-40 w-full rounded-[32px]" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-64 w-full rounded-[28px]" key={index} />
        ))}
      </div>
    </div>
  );
}
