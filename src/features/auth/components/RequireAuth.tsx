import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionQuery } from '../hooks/useSessionQuery';
import { PageLoader } from '../../../shared/components/PageLoader';

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading, isError, error, isFetching } = useSessionQuery();

  useEffect(() => {
    if (isError) {
      console.error('Authentication Error:', error);
    }
  }, [isError, error]);

  // Show loader on initial load (no data yet)
  if (isLoading && !user) {
    return <PageLoader message="Cargando sesión..." />;
  }

  // A timeout or transient error while we already have stale session data
  // means the token is being refreshed in the background — stay put.
  if (isError && user) {
    return <Outlet />;
  }

  // Still fetching a refresh but we have stale data — keep the user in place
  if (isFetching && user) {
    return <Outlet />;
  }

  // No session at all (and not loading) → redirect to login
  if (!isLoading && !isFetching && !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (isError && !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
