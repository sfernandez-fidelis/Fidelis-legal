import { ClipboardList, FileText, LayoutDashboard, LogOut, Settings, Shield, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLogout } from '../../features/auth/hooks/useLogout';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { useAppSession, useCurrentUser } from '../../features/auth/hooks/useSessionQuery';
import { Breadcrumbs } from './Breadcrumbs';

export function AppShell() {
  const session = useAppSession();
  const user = useCurrentUser();
  const permissions = usePermissions();
  const logout = useLogout();
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuario';
  const userAvatar = user?.user_metadata?.avatar_url || '';
  const navigationItems = [
    { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, visible: true },
    { to: '/documents', label: 'Documentos', icon: FileText, visible: true },
    { to: '/templates', label: 'Plantillas', icon: FileText, visible: true },
    { to: '/contacts', label: 'Contactos', icon: Users, visible: true },
    { to: '/team', label: 'Equipo', icon: Shield, visible: permissions.canManageOrganization },
    { to: '/audit-log', label: 'Auditoría', icon: ClipboardList, visible: permissions.canViewAuditLog },
    { to: '/settings', label: 'Configuración', icon: Settings, visible: permissions.canManageOrganization },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FDFCFB] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-30 hidden h-screen w-72 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
          <div className="p-8">
            <p className="text-2xl font-serif italic">Fidelis Legal</p>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">Plataforma Legal</p>
          </div>

          <nav className="flex-1 space-y-2 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      isActive
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-6">
            <div className="mb-5 flex items-center gap-3 px-2">
              {userAvatar ? (
                <img alt="Avatar" className="h-10 w-10 rounded-full border-2 border-brand-100" src={userAvatar} />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
                <p className="truncate text-[11px] uppercase tracking-[0.2em] text-gray-400">{session?.membership.role}</p>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() => logout.mutate()}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-gray-100 bg-[#FDFCFB]/95 px-6 py-5 backdrop-blur lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Fidelis Legal</p>
                <Breadcrumbs />
              </div>
              <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
                {session?.activeOrganization.name || user?.email}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
