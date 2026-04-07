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
        El acceso a auditoría está limitado a administradores de la organización.
      </div>
    );
  }

  if (auditLogQuery.isError) {
    return (
      <PageErrorState
        message="La actividad reciente de la organización no se pudo cargar."
        onRetry={() => auditLogQuery.refetch()}
        title="No se pudo cargar el registro de auditoría"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Atribución</p>
        <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Registro de auditoría</h1>
        <p className="mt-2 max-w-3xl text-stone-500">
          Los cambios sensibles en documentos, plantillas, archivos, contactos y controles de acceso se registran aquí.
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
                    {entry.entityType} • {entry.actorName || 'Sistema'} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                  {entry.entityType}
                </span>
              </div>
            </div>
          ))}
          {!auditLogQuery.data?.length ? <p className="text-sm text-stone-500">Aún no se han registrado eventos de auditoría.</p> : null}
        </div>
      </section>
    </div>
  );
}
