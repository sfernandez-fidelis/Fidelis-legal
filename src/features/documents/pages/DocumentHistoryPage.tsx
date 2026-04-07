import { format } from 'date-fns';
import { Link, useParams } from 'react-router-dom';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { useDocumentQuery, useDocumentVersionsQuery } from '../hooks/useDocumentQuery';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';

export function DocumentHistoryPage() {
  const { id } = useParams();
  const documentQuery = useDocumentQuery(id);
  const versionsQuery = useDocumentVersionsQuery(id);

  if (documentQuery.isError || versionsQuery.isError) {
    return (
      <PageErrorState
        message="El historial de versiones no se pudo cargar para este documento."
        onRetry={() => {
          void documentQuery.refetch();
          void versionsQuery.refetch();
        }}
        title="No se pudo cargar el historial de versiones"
      />
    );
  }

  if (!documentQuery.data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Historial de versiones</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">{documentQuery.data.title || 'Historial del documento'}</h1>
          <p className="mt-2 text-stone-500">Línea de tiempo independiente de instantáneas de versión e hitos del flujo de trabajo.</p>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/documents/${documentQuery.data.id}`}>
          Volver al detalle
        </Link>
      </div>

      <div className="space-y-4">
        {(versionsQuery.data ?? []).map((version) => (
          <article className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm" key={version.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Versión {version.versionNumber}</p>
                <h2 className="mt-2 text-xl font-medium text-stone-900">
                  {version.snapshotReason || 'Instantánea del documento'}
                </h2>
              </div>
              <div className="space-y-2 text-right">
                <DocumentStatusBadge status={version.status} />
                <p className="text-xs text-stone-500">{format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <HistoryMeta label="Principal" value={String(version.payloadSnapshot?.principal?.entityName || version.payloadSnapshot?.principal?.name || '-')} />
              <HistoryMeta label="Beneficiario" value={String(version.payloadSnapshot?.beneficiaryName || '-')} />
              <HistoryMeta label="Pólizas" value={String(version.payloadSnapshot?.policies?.length ?? 0)} />
              <HistoryMeta label="Hash" value={version.immutableHash || '-'} />
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</dt>
      <dd className="mt-2 break-all text-sm text-stone-700">{value}</dd>
    </div>
  );
}
