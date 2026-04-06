import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { PageErrorState } from './PageErrorState';
import { captureAppError } from '../../lib/monitoring';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    captureAppError(error, { area: 'route-response', status: error.status });

    return (
      <PageErrorState
        title={`Error ${error.status}`}
        message={typeof error.data === 'string' ? error.data : 'Ocurrió un error al cargar la ruta.'}
        onRetry={() => navigate(0)}
      />
    );
  }

  captureAppError(error, { area: 'route-render' });

  return (
    <PageErrorState
      title="Ocurrió un error inesperado"
      message="La ruta falló mientras se renderizaba. Puede intentar recargar esta pantalla."
      onRetry={() => navigate(0)}
    />
  );
}
