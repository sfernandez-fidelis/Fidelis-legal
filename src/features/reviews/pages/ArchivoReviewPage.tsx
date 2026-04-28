import { useCallback, useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReviewsQuery, useSubmitRejection } from '../hooks/useReviewsQuery';
import { PageLoader } from '../../../shared/components/PageLoader';
import { PageErrorState } from '../../../shared/components/PageErrorState';

export function ArchivoReviewPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [reason, setReason] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reviewsQuery = useReviewsQuery('all');
  const submitMutation = useSubmitRejection();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf',
    );
    if (files.length === 0) {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter(
        (f) => f.type === 'application/pdf',
      );
      if (files.length === 0) {
        toast.error('Solo se aceptan archivos PDF');
        return;
      }
      setSelectedFiles((prev) => [...prev, ...files]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Seleccione al menos un archivo PDF');
      return;
    }

    let successCount = 0;
    for (const file of selectedFiles) {
      try {
        await submitMutation.mutateAsync({ file, reason: reason || undefined });
        successCount++;
      } catch {
        toast.error(`Error al enviar: ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} documento${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} a revisión`,
      );
      setSelectedFiles([]);
      setReason('');
    }
  };

  const mySubmissions = reviewsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-serif italic text-gray-900">
          Rechazar Contragarantías
        </h1>
        <p className="text-gray-500">
          Suba los documentos con firmas que necesitan ser rechazados. El equipo
          de Jurídico recibirá una alerta para revisarlos.
        </p>
      </header>

      {/* Upload Zone */}
      <section className="space-y-6">
        <div
          className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
            dragOver
              ? 'border-brand-400 bg-brand-50/60 shadow-lg shadow-brand-100'
              : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            accept=".pdf,application/pdf"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />

          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
              dragOver
                ? 'bg-brand-200 text-brand-700 scale-110'
                : 'bg-brand-100 text-brand-600'
            }`}
          >
            <CloudUpload size={32} />
          </div>

          <p className="text-lg font-semibold text-gray-700">
            {dragOver
              ? 'Suelte los archivos aquí'
              : 'Arrastre archivos PDF aquí'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            o haga clic para seleccionar desde su computadora
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
              Archivos seleccionados ({selectedFiles.length})
            </h3>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {selectedFiles.map((file, index) => (
                <div
                  className="flex items-center justify-between px-5 py-4"
                  key={`${file.name}-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-gray-700"
                htmlFor="rejection-reason"
              >
                Motivo del rechazo{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                id="rejection-reason"
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Firma no coincide con el DPI, documento incompleto..."
                rows={3}
                value={reason}
              />
            </div>

            {/* Submit */}
            <button
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:shadow-xl hover:shadow-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitMutation.isPending}
              onClick={handleSubmit}
              type="button"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Enviando...
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  Rechazar y enviar a Jurídico
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Historial de rechazos
        </h2>

        {reviewsQuery.isLoading && <PageLoader message="Cargando historial..." />}
        {reviewsQuery.isError && (
          <PageErrorState
            message="No fue posible cargar el historial."
            onRetry={() => reviewsQuery.refetch()}
            title="Error"
          />
        )}

        {reviewsQuery.data && reviewsQuery.data.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <FileText size={28} />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              No hay documentos rechazados todavía
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Los documentos que rechace aparecerán aquí
            </p>
          </div>
        )}

        {reviewsQuery.data && reviewsQuery.data.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mySubmissions.map((review) => (
                  <tr
                    className="transition-colors hover:bg-gray-50"
                    key={review.id}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {review.originalFileName}
                      </p>
                      {review.rejectionReason && (
                        <p className="mt-1 text-xs text-gray-400">
                          {review.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(
                        new Date(review.rejectedAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: es },
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ReviewStatusBadge status={review.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending_review':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Pendiente
        </span>
      );
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
          <X size={12} />
          Confirmado
        </span>
      );
    case 'restored':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
          <CheckCircle2 size={12} />
          Restaurado
        </span>
      );
    default:
      return null;
  }
}
