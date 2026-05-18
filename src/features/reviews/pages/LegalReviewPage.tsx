import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReviewsQuery, useResolveReview } from '../hooks/useReviewsQuery';
import { reviewService, REJECTION_OPTIONS, type DocumentReview, type ReviewStatus } from '../api/reviewService';
import { PageLoader } from '../../../shared/components/PageLoader';
import { PageErrorState } from '../../../shared/components/PageErrorState';

type TabFilter = ReviewStatus | 'all';

export function LegalReviewPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('pending_review');
  const [selectedReview, setSelectedReview] = useState<DocumentReview | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const reviewsQuery = useReviewsQuery(activeTab);
  const resolveMutation = useResolveReview();

  const tabs: { key: TabFilter; label: string; icon: typeof FileText }[] = [
    { key: 'pending_review', label: 'Pendientes', icon: AlertTriangle },
    { key: 'confirmed', label: 'Confirmados', icon: X },
    { key: 'restored', label: 'Restaurados', icon: CheckCircle2 },
    { key: 'needs_info', label: 'Devueltos', icon: MessageSquareWarning as any },
    { key: 'all', label: 'Todos', icon: FileText },
  ];

  const filteredReviews = (reviewsQuery.data ?? []).filter((review) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      review.originalFileName.toLowerCase().includes(term) ||
      (review.clientName && review.clientName.toLowerCase().includes(term)) ||
      (review.agentName && review.agentName.toLowerCase().includes(term)) ||
      (review.policyNumber && review.policyNumber.toLowerCase().includes(term))
    );
  });

  const pendingItems = filteredReviews.filter(
    (r) => r.status === 'pending_review',
  );
  const pendingCount =
    activeTab === 'pending_review'
      ? filteredReviews.length
      : pendingItems.length;

  const handlePreview = async (review: DocumentReview) => {
    setLoadingPreview(true);
    try {
      const url = await reviewService.getFileUrl(review.originalStoragePath);
      setPreviewUrl(url);
      setSelectedReview(review);
    } catch {
      toast.error('No se pudo cargar la vista previa');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async (review: DocumentReview) => {
    try {
      await reviewService.downloadFile(
        review.originalStoragePath,
        review.originalFileName,
      );
    } catch {
      toast.error('Error al descargar el archivo');
    }
  };

  const handleResolve = async (decision: 'confirmed' | 'restored' | 'needs_info') => {
    if (!selectedReview) return;
    
    if (decision === 'needs_info' && !reviewNotes.trim()) {
      toast.error('Debe ingresar una nota explicando qué información falta');
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        reviewId: selectedReview.id,
        decision,
        notes: reviewNotes || undefined,
        originalStoragePath: selectedReview.originalStoragePath,
      });

      const messages = {
        confirmed: 'Rechazo confirmado — el documento queda marcado',
        restored: 'Documento restaurado — rechazo removido',
        needs_info: 'Documento devuelto a Archivo para más información'
      };
      toast.success(messages[decision]);

      setSelectedReview(null);
      setPreviewUrl(null);
      setReviewNotes('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al procesar la decisión');
    }
  };

  const closeModal = () => {
    setSelectedReview(null);
    setPreviewUrl(null);
    setReviewNotes('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif italic text-gray-900">
            Contragarantías Rechazadas
          </h1>
          <p className="text-gray-500">
            Revise los documentos rechazados por Archivo y decida si confirmar o
            restaurar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por documento, cliente, agente o póliza..."
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:min-w-[280px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {pendingCount > 0 && (
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
              <AlertTriangle size={16} />
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <Icon size={15} />
              {tab.label}
              {tab.key === 'pending_review' && pendingCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      {reviewsQuery.isLoading && (
        <PageLoader message="Cargando revisiones..." />
      )}
      {reviewsQuery.isError && (
        <PageErrorState
          message="No fue posible cargar las revisiones."
          onRetry={() => reviewsQuery.refetch()}
          title="Error"
        />
      )}

      {reviewsQuery.data && filteredReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck size={32} />
          </div>
          <p className="text-lg font-semibold text-gray-700">Todo en orden</p>
          <p className="mt-1 text-sm text-gray-400">
            {activeTab === 'pending_review'
              ? 'No hay documentos pendientes de revisión'
              : 'No se encontraron documentos con ese filtro'}
          </p>
        </div>
      )}

      {filteredReviews.length > 0 && (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              loadingPreview={loadingPreview}
              onDownload={() => handleDownload(review)}
              onPreview={() => handlePreview(review)}
              review={review}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Revisar documento
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedReview.originalFileName}
                </p>
              </div>
              <button
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={closeModal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 space-y-5">
              {/* Core rejection info */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-3">
                <InfoCell label="Rechazado por" value={selectedReview.rejectedByName || 'Archivo'} />
                <InfoCell
                  label="Fecha de rechazo"
                  value={format(new Date(selectedReview.rejectedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                />
                {selectedReview.documentDate && (
                  <InfoCell
                    label="Fecha del documento"
                    value={format(new Date(selectedReview.documentDate), 'dd MMM yyyy', { locale: es })}
                  />
                )}
                {selectedReview.fidelisEntryDate && (
                  <InfoCell
                    label="Ingreso en Fidelis"
                    value={format(new Date(selectedReview.fidelisEntryDate), 'dd MMM yyyy', { locale: es })}
                  />
                )}
                {selectedReview.agentName && (
                  <InfoCell label="Agente" value={selectedReview.agentName} />
                )}
                {selectedReview.clientName && (
                  <InfoCell label="Cliente / Fiado" value={selectedReview.clientName} />
                )}
                {selectedReview.policyNumber && (
                  <InfoCell label="Número de Póliza/Fianza" value={selectedReview.policyNumber} />
                )}
              </div>

              {/* Rejection options chips */}
              {selectedReview.rejectionOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Motivos seleccionados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.rejectionOptions.map((opt) => (
                      <span
                        key={opt}
                        className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                      >
                        {REJECTION_OPTIONS.find((o) => o.value === opt)?.label ?? opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed reason */}
              {selectedReview.rejectionReason && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Motivo detallado
                  </p>
                  <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900">
                    {selectedReview.rejectionReason}
                  </p>
                </div>
              )}

              {/* Signature details */}
              {(selectedReview.signaturePrincipalDetail || selectedReview.signatureGuarantorDetail) && (
                <div className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
                  {selectedReview.signaturePrincipalDetail && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Firma fiado (principal)
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {selectedReview.signaturePrincipalDetail}
                      </p>
                    </div>
                  )}
                  {selectedReview.signatureGuarantorDetail && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Firma fiador (garante)
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {selectedReview.signatureGuarantorDetail}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PDF Preview */}
              {previewUrl && (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200">
                  <iframe
                    className="h-[70vh] min-h-[500px] w-full"
                    src={previewUrl}
                    title="Vista previa del PDF"
                  />
                  {selectedReview.status === 'pending_review' && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                      <div className="flex -rotate-45 flex-col items-center justify-center p-6 text-red-600/50 mix-blend-multiply">
                        <span className="text-5xl font-black tracking-widest">FIRMA RECHAZADA</span>
                        <span className="mt-2 text-xl font-bold tracking-widest">DOCUMENTO SIN VALIDEZ LEGAL</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review notes — only for pending items */}
              {selectedReview.status === 'pending_review' && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-gray-700"
                    htmlFor="review-notes"
                  >
                    Notas de la revisión{' '}
                    <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <textarea
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    id="review-notes"
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Observaciones sobre la decisión..."
                    rows={3}
                    value={reviewNotes}
                  />
                </div>
              )}

              {/* Already resolved banner */}
              {selectedReview.status !== 'pending_review' && (
                <div
                  className={`rounded-2xl p-5 ${
                    selectedReview.status === 'confirmed'
                      ? 'bg-red-50 text-red-800'
                      : selectedReview.status === 'needs_info'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-green-50 text-green-800'
                  }`}
                >
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {selectedReview.status === 'confirmed'
                      ? <><X size={16}/> Rechazo confirmado</>
                      : selectedReview.status === 'needs_info'
                        ? <><MessageSquareWarning size={16}/> Devuelto a archivo</>
                        : <><CheckCircle2 size={16}/> Documento restaurado</>}
                  </p>
                  {selectedReview.reviewedByName && (
                    <p className="mt-1 text-xs opacity-80">
                      Por {selectedReview.reviewedByName} el{' '}
                      {selectedReview.reviewedAt
                        ? format(
                            new Date(selectedReview.reviewedAt),
                            'dd MMM yyyy, HH:mm',
                            { locale: es },
                          )
                        : ''}
                    </p>
                  )}
                  {selectedReview.reviewNotes && (
                    <p className="mt-2 text-sm">{selectedReview.reviewNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer — only for pending */}
            {selectedReview.status === 'pending_review' && (
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolve('restored')}
                  type="button"
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  Quitar rechazo
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolve('needs_info')}
                  type="button"
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <MessageSquareWarning size={16} />
                  )}
                  Devolver a Archivo
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolve('confirmed')}
                  type="button"
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  Confirmar rechazo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ReviewCard({
  review,
  onPreview,
  onDownload,
  loadingPreview,
}: {
  review: DocumentReview;
  onPreview: () => void;
  onDownload: () => void;
  loadingPreview: boolean;
}) {
  const isPending = review.status === 'pending_review';

  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md ${
        isPending
          ? 'border-amber-200 shadow-sm shadow-amber-50'
          : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isPending
                ? 'bg-amber-50 text-amber-600'
                : review.status === 'confirmed'
                  ? 'bg-red-50 text-red-500'
                  : review.status === 'needs_info'
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-green-50 text-green-500'
            }`}
          >
            <FileText size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {review.originalFileName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
              <span>
                {format(new Date(review.rejectedAt), 'dd MMM yyyy, HH:mm', {
                  locale: es,
                })}
              </span>
              {review.agentName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {review.agentName}
                  </span>
                </>
              )}
              {review.clientName && (
                <>
                  <span>•</span>
                  <span>{review.clientName}</span>
                </>
              )}
              {review.policyNumber && (
                <>
                  <span>•</span>
                  <span className="font-medium text-brand-600">Póliza: {review.policyNumber}</span>
                </>
              )}
              {review.rejectedByName && (
                <>
                  <span>•</span>
                  <span>Subido por {review.rejectedByName}</span>
                </>
              )}
            </div>
            {review.rejectionOptions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {review.rejectionOptions.slice(0, 3).map((opt) => (
                  <span
                    key={opt}
                    className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600"
                  >
                    {REJECTION_OPTIONS.find((o) => o.value === opt)?.label ?? opt}
                  </span>
                ))}
                {review.rejectionOptions.length > 3 && (
                  <span className="text-[10px] text-gray-400">
                    +{review.rejectionOptions.length - 3} más
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-4">
          <ReviewStatusBadge status={review.status} />
          <button
            className="rounded-xl p-2.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={onDownload}
            title="Descargar"
            type="button"
          >
            <Download size={16} />
          </button>
          <button
            className="rounded-xl bg-brand-50 p-2.5 text-brand-600 transition hover:bg-brand-100 hover:text-brand-700"
            disabled={loadingPreview}
            onClick={onPreview}
            title="Revisar"
            type="button"
          >
            {loadingPreview ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>
        </div>
      </div>
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
    case 'needs_info':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <HelpCircle size={12} />
          Requiere Info
        </span>
      );
    default:
      return null;
  }
}
