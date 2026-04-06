interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Cargando...' }: PageLoaderProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center text-gray-500">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-600" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
