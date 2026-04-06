import { usePermissions } from '../features/auth/hooks/usePermissions';
import { useAppSession, useCurrentUser } from '../features/auth/hooks/useSessionQuery';

export function SettingsPage() {
  const session = useAppSession();
  const user = useCurrentUser();
  const permissions = usePermissions();

  if (!permissions.canManageOrganization) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-stone-50 p-8 text-sm text-stone-600">
        Settings are visible only to organization admins.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-serif italic text-gray-900">Configuracion</h1>
        <p className="text-gray-500">Organization-level controls and a summary of the active session.</p>
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Nombre</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'No disponible'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Correo</dt>
            <dd className="mt-1 text-sm text-gray-700">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Organizacion</dt>
            <dd className="mt-1 text-sm text-gray-700">{session?.activeOrganization.name || 'No disponible'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Rol</dt>
            <dd className="mt-1 text-sm text-gray-700">{session?.membership.role || 'No disponible'}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
