import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLogin } from '../hooks/useLogin';
import { useSessionQuery } from '../hooks/useSessionQuery';
import { PageLoader } from '../../../shared/components/PageLoader';

export function LoginPage() {
  const { data: user, isLoading } = useSessionQuery();
  const login = useLogin();

  if (isLoading) {
    return <PageLoader message="Validando sesión..." />;
  }

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB] p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif italic tracking-tight text-gray-900">Fidelis Legal</h1>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-gray-500">
            Generador de documentos legales
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <p className="mb-8 text-gray-600">
            Inicie sesión con su cuenta institucional para acceder a la plataforma.
          </p>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-black disabled:opacity-60"
            disabled={login.isPending}
            onClick={() =>
              login.mutate(undefined, {
                onError: () => {
                  toast.error('No fue posible iniciar sesión');
                },
              })
            }
          >
            <img alt="Google" className="h-5 w-5" src="https://www.google.com/favicon.ico" />
            {login.isPending ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
