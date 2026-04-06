import { Suspense, lazy, type ComponentType } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { RouteErrorBoundary } from '../shared/components/RouteErrorBoundary';
import { AppShell } from '../shared/components/AppShell';
import { PageLoader } from '../shared/components/PageLoader';

function lazyPage<TModule extends Record<string, any>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) {
  const Component = lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as ComponentType };
  });

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const loginPage = lazyPage(() => import('../features/auth/components/LoginPage'), 'LoginPage');
const dashboardPage = lazyPage(() => import('../features/documents/pages/DashboardPage'), 'DashboardPage');
const documentsPage = lazyPage(() => import('../features/documents/pages/DocumentsPage'), 'DocumentsPage');
const documentCreatePage = lazyPage(() => import('../features/documents/pages/DocumentCreatePage'), 'DocumentCreatePage');
const documentDetailPage = lazyPage(() => import('../features/documents/pages/DocumentDetailPage'), 'DocumentDetailPage');
const documentEditPage = lazyPage(() => import('../features/documents/pages/DocumentEditPage'), 'DocumentEditPage');
const documentHistoryPage = lazyPage(() => import('../features/documents/pages/DocumentHistoryPage'), 'DocumentHistoryPage');
const templatesPage = lazyPage(() => import('../features/templates/pages/TemplatesPage'), 'TemplatesPage');
const templateDetailPage = lazyPage(() => import('../features/templates/pages/TemplateDetailPage'), 'TemplateDetailPage');
const contactsPage = lazyPage(() => import('../features/contacts/pages/ContactsPage'), 'ContactsPage');
const contactCreatePage = lazyPage(() => import('../features/contacts/pages/ContactCreatePage'), 'ContactCreatePage');
const contactEditPage = lazyPage(() => import('../features/contacts/pages/ContactEditPage'), 'ContactEditPage');
const teamPage = lazyPage(() => import('../features/team/pages/TeamPage'), 'TeamPage');
const auditLogPage = lazyPage(() => import('../features/team/pages/AuditLogPage'), 'AuditLogPage');
const settingsPage = lazyPage(() => import('./SettingsPage'), 'SettingsPage');

export const router = createBrowserRouter([
  {
    path: '/login',
    element: loginPage,
    errorElement: <RouteErrorBoundary />,
    handle: { breadcrumb: 'Login' },
  },
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate replace to="/dashboard" /> },
          {
            path: 'dashboard',
            element: dashboardPage,
            handle: { breadcrumb: 'Dashboard' },
          },
          {
            path: 'documents',
            handle: { breadcrumb: 'Documentos' },
            children: [
              { index: true, element: documentsPage },
              { path: 'new', element: documentCreatePage, handle: { breadcrumb: 'Create' } },
              { path: ':id', element: documentDetailPage, handle: { breadcrumb: 'Detail' } },
              { path: ':id/edit', element: documentEditPage, handle: { breadcrumb: 'Edit' } },
              { path: ':id/history', element: documentHistoryPage, handle: { breadcrumb: 'History' } },
            ],
          },
          {
            path: 'templates',
            handle: { breadcrumb: 'Plantillas' },
            children: [
              { index: true, element: templatesPage },
              { path: ':id', element: templateDetailPage, handle: { breadcrumb: 'Detalle' } },
            ],
          },
          {
            path: 'contacts',
            handle: { breadcrumb: 'Contactos' },
            children: [
              { index: true, element: contactsPage },
              { path: 'new', element: contactCreatePage, handle: { breadcrumb: 'Nuevo' } },
              { path: ':id/edit', element: contactEditPage, handle: { breadcrumb: 'Editar' } },
            ],
          },
          {
            path: 'team',
            element: teamPage,
            handle: { breadcrumb: 'Equipo' },
          },
          {
            path: 'audit-log',
            element: auditLogPage,
            handle: { breadcrumb: 'Auditoria' },
          },
          {
            path: 'settings',
            element: settingsPage,
            handle: { breadcrumb: 'Configuracion' },
          },
        ],
      },
    ],
  },
]);
