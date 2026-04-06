import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1');

export function initializeMonitoring() {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: true,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    sendDefaultPii: false,
  });
}

export function captureAppError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
    console.error(error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('app', context);
    }

    Sentry.captureException(error);
  });
}
