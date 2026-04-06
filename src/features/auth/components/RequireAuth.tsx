import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionQuery } from '../hooks/useSessionQuery';
import { PageLoader } from '../../../shared/components/PageLoader';

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading } = useSessionQuery();

  if (isLoading) {
    return <PageLoader message="Cargando sesión..." />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
