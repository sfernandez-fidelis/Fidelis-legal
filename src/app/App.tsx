import * as Sentry from '@sentry/react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { router } from '../routes/router';
import { PageErrorState } from '../shared/components/PageErrorState';
import { captureAppError } from '../lib/monitoring';

export default function App() {
  return (
    <AppProviders>
      <Sentry.ErrorBoundary
        fallback={
          <PageErrorState
            title="La aplicación encontró un error inesperado"
            message="Se registró el incidente. Recargue la pantalla para continuar."
          />
        }
        onError={(error) => captureAppError(error, { area: 'app-root' })}
      >
        <RouterProvider router={router} />
      </Sentry.ErrorBoundary>
    </AppProviders>
  );
}
