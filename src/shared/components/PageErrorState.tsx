interface PageErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PageErrorState({
  title = 'No se pudo cargar esta vista',
  message = 'Intente nuevamente en unos segundos.',
  onRetry,
}: PageErrorStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{message}</p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
