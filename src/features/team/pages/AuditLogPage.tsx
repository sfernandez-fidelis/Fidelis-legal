import { PageErrorState } from '../../../shared/components/PageErrorState';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { useAuditLogQuery } from '../hooks/useTeam';

function formatAction(action: string) {
  return action.replaceAll('.', ' / ');
}

export function AuditLogPage() {
  const permissions = usePermissions();
  const auditLogQuery = useAuditLogQuery();

  if (!permissions.canViewAuditLog) {
    return (
      <div className="mx-auto max-w-5xl rounded-[28px] border border-stone-200 bg-stone-50 p-8 text-sm text-stone-600">
        Audit access is limited to organization admins.
      </div>
    );
  }

  if (auditLogQuery.isError) {
    return (
      <PageErrorState
        message="Recent organization activity could not be loaded."
        onRetry={() => auditLogQuery.refetch()}
        title="Unable to load audit log"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Attribution</p>
        <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Audit log</h1>
        <p className="mt-2 max-w-3xl text-stone-500">
          Sensitive changes across documents, templates, files, contacts, and access controls are recorded here.
        </p>
      </header>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {(auditLogQuery.data ?? []).map((entry) => (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{formatAction(entry.action)}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {entry.entityType} • {entry.actorName || 'System'} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                  {entry.entityType}
                </span>
              </div>
            </div>
          ))}
          {!auditLogQuery.data?.length ? <p className="text-sm text-stone-500">No audit events recorded yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
