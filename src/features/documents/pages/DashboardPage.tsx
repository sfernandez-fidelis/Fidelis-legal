import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSession, useCurrentUser } from '../../auth/hooks/useSessionQuery';
import { useDocumentsQuery } from '../hooks/useDocumentsQuery';
import { ContractType } from '../../../types';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { PageLoader } from '../../../shared/components/PageLoader';
import { getDocumentDisplayName, getDocumentTypeLabel } from '../components/documentLabels';

const documentOptions = [
  {
    type: ContractType.COUNTER_GUARANTEE_PRIVATE,
    title: 'Contragarantía',
    subtitle: 'Documento Privado',
    description: 'Formato estándar para contragarantías con legalización de firmas.',
  },
  {
    type: ContractType.COUNTER_GUARANTEE_PUBLIC,
    title: 'Contragarantía',
    subtitle: 'Escritura Pública',
    description: 'Protocolo para contragarantías elevadas a escritura pública.',
  },
  {
    type: ContractType.MORTGAGE_GUARANTEE,
    title: 'Garantía Hipotecaria',
    subtitle: 'Escritura Pública',
    description: 'Protocolo para constitución de hipotecas como garantía.',
  },
];

export function DashboardPage() {
  const session = useAppSession();
  const user = useCurrentUser();
  const documentsQuery = useDocumentsQuery({}, 1);
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  if (documentsQuery.isLoading) {
    return <PageLoader message="Cargando dashboard..." />;
  }

  if (documentsQuery.isError) {
    return (
      <PageErrorState
        message="No fue posible cargar los documentos recientes."
        onRetry={() => documentsQuery.refetch()}
        title="No se pudo cargar el dashboard"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif italic text-gray-900">Bienvenido, {userName.split(' ')[0]}</h1>
          <p className="text-gray-500">
            ¿Qué documento legal desea generar hoy?
            {session ? ` Está trabajando en ${session.activeOrganization.name}.` : ''}
          </p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documentOptions.map((option) => (
          <Link
            className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-brand-200 hover:shadow-xl"
            key={option.type}
            to={`/documents/new?type=${option.type}`}
          >
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-bl-full bg-brand-50 transition-all group-hover:scale-150" />
            <div className="relative z-10 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{option.title}</h2>
                <p className="text-sm text-gray-500">{option.subtitle}</p>
              </div>
              <p className="text-xs leading-relaxed text-gray-400">{option.description}</p>
              <div className="flex items-center gap-2 pt-4 text-xs font-bold uppercase tracking-[0.3em] text-brand-600 opacity-0 transition-all group-hover:opacity-100">
                Generar ahora
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Documentos recientes</h2>
          <Link className="text-xs font-bold uppercase tracking-[0.3em] text-brand-600 hover:underline" to="/documents">
            Ver todo
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Documento</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Fiado</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documentsQuery.data?.items.slice(0, 5).map((document) => (
                <tr className="transition-colors hover:bg-gray-50" key={document.id}>
                  <td className="px-6 py-4">
                    <Link className="font-semibold text-gray-900 transition hover:text-brand-700" to={`/documents/${document.id}`}>
                      {getDocumentDisplayName(document)}
                    </Link>
                    <p className="mt-1 text-xs text-gray-400">{getDocumentTypeLabel(document.type)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{document.principal.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{format(new Date(document.createdAt), 'dd/MM/yyyy')}</td>
                </tr>
              ))}
              {!documentsQuery.data?.items.length ? (
                <tr>
                  <td className="px-6 py-12 text-center text-sm italic text-gray-400" colSpan={3}>
                    No hay documentos generados aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
