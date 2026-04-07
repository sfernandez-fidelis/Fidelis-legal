import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionQuery } from '../hooks/useSessionQuery';
import { PageLoader } from '../../../shared/components/PageLoader';

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading, isError, error } = useSessionQuery();

  useEffect(() => {
    if (isError) {
      console.error('Authentication Error:', error);
    }
  }, [isError, error]);

  if (isLoading) {
    return <PageLoader message="Cargando sesión..." />;
  }

  if (isError || !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
