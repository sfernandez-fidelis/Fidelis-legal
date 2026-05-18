import { useCallback, useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileText,
  HelpCircle,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReviewsQuery, useSubmitRejection } from '../hooks/useReviewsQuery';
import { useInsuranceAgentsQuery } from '../hooks/useInsuranceAgents';
import { useDocumentsQuery } from '../../documents/hooks/useDocumentsQuery';
import { REJECTION_OPTIONS, type RejectionOptionValue } from '../api/reviewService';
import { PageLoader } from '../../../shared/components/PageLoader';
import { PageErrorState } from '../../../shared/components/PageErrorState';

interface RejectionFormState {
  documentDate: string;
  fidelisEntryDate: string;
  agentId: string;
  agentName: string;
  clientName: string;
  policyNumber: string;
  documentId: string;
  reason: string;
  signaturePrincipalDetail: string;
  signatureGuarantorDetail: string;
  rejectionOptions: RejectionOptionValue[];
}

const EMPTY_FORM: RejectionFormState = {
  documentDate: '',
  fidelisEntryDate: '',
  agentId: '',
  agentName: '',
  clientName: '',
  policyNumber: '',
  documentId: '',
  reason: '',
  signaturePrincipalDetail: '',
  signatureGuarantorDetail: '',
  rejectionOptions: [],
};

export function ArchivoReviewPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [form, setForm] = useState<RejectionFormState>(EMPTY_FORM);
  const [historySearch, setHistorySearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reviewsQuery = useReviewsQuery('all');
  const submitMutation = useSubmitRejection();
  const agentsQuery = useInsuranceAgentsQuery();
  const recentDocumentsQuery = useDocumentsQuery({ status: 'draft' }, 1);

  const setField = <K extends keyof RejectionFormState>(key: K, value: RejectionFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleOption = (value: RejectionOptionValue) => {
    setForm((prev) => ({
      ...prev,
      rejectionOptions: prev.rejectionOptions.includes(value)
        ? prev.rejectionOptions.filter((v) => v !== value)
        : [...prev.rejectionOptions, value],
    }));
  };

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

  const handleAgentChange = (agentId: string) => {
    const agent = agentsQuery.data?.find((a) => a.id === agentId);
    setForm((prev) => ({
      ...prev,
      agentId,
      agentName: agent?.fullName ?? '',
    }));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Seleccione al menos un archivo PDF');
      return;
    }
    if (!form.agentId) {
      toast.error('Seleccione un agente de seguros');
      return;
    }
    if (!form.clientName.trim()) {
      toast.error('El nombre del cliente o fiado es obligatorio');
      return;
    }
    if (form.rejectionOptions.length === 0) {
      toast.error('Seleccione al menos un motivo de rechazo');
      return;
    }
    if (!form.reason.trim()) {
      toast.error('El motivo detallado es obligatorio');
      return;
    }

    let successCount = 0;
    for (const file of selectedFiles) {
      try {
        await submitMutation.mutateAsync({
          file,
          reason: form.reason || undefined,
          documentDate: form.documentDate || undefined,
          fidelisEntryDate: form.fidelisEntryDate || undefined,
          agentId: form.agentId || undefined,
          agentName: form.agentName || undefined,
          clientName: form.clientName || undefined,
          policyNumber: form.policyNumber || undefined,
          documentId: form.documentId || undefined,
          signaturePrincipalDetail: form.signaturePrincipalDetail || undefined,
          signatureGuarantorDetail: form.signatureGuarantorDetail || undefined,
          rejectionOptions: form.rejectionOptions,
        });
        successCount++;
      } catch (err: any) {
        const msg = err?.message ?? 'Error desconocido';
        toast.error(`Error al enviar "${file.name}": ${msg}`);
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} documento${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} a revisión`,
      );
      setSelectedFiles([]);
      setForm(EMPTY_FORM);
    }
  };

  const mySubmissions = (reviewsQuery.data ?? []).filter((review) => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    return (
      review.originalFileName.toLowerCase().includes(term) ||
      (review.clientName && review.clientName.toLowerCase().includes(term)) ||
      (review.agentName && review.agentName.toLowerCase().includes(term)) ||
      (review.policyNumber && review.policyNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-serif italic text-gray-900">
          Rechazar Contragarantías
        </h1>
        <p className="text-gray-500">
          Suba los documentos con firmas que necesitan ser rechazados. Complete
          todos los campos para un registro completo.
        </p>
      </header>

      {/* Upload Zone */}
      <section className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
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
            {dragOver ? 'Suelte los archivos aquí' : 'Arrastre archivos PDF aquí'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            o haga clic para seleccionar desde su computadora
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <p className="px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Archivos seleccionados ({selectedFiles.length})
            </p>
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
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
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
        )}

        {/* Rejection Form — always visible so user fills it before or after selecting files */}
        <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800">
            Datos del rechazo
          </h2>

          {/* Dates row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Fecha del documento">
              <input
                className="form-input"
                onChange={(e) => setField('documentDate', e.target.value)}
                type="date"
                value={form.documentDate}
              />
            </FormField>
            <FormField label="Fecha de ingreso en Fidelis">
              <input
                className="form-input"
                onChange={(e) => setField('fidelisEntryDate', e.target.value)}
                type="date"
                value={form.fidelisEntryDate}
              />
            </FormField>
            <FormField label="Fecha de rechazo">
              <input
                className="form-input bg-gray-50 text-gray-500 cursor-not-allowed"
                disabled
                readOnly
                type="date"
                value={new Date().toISOString().slice(0, 10)}
              />
              <p className="mt-1 text-[11px] text-gray-400">Automática</p>
            </FormField>
          </div>

          {/* Agent & Client row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={<>Agente de seguros <span className="font-normal text-red-500">*</span></>}>
              {agentsQuery.isLoading ? (
                <div className="form-input flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={14} />
                  Cargando agentes...
                </div>
              ) : (
                <select
                  className="form-input"
                  onChange={(e) => handleAgentChange(e.target.value)}
                  value={form.agentId}
                >
                  <option value="">— Seleccionar agente —</option>
                  {(agentsQuery.data ?? []).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName}
                      {agent.code ? ` (${agent.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label={<>Cliente / Fiado <span className="font-normal text-red-500">*</span></>}>
              <input
                className="form-input"
                onChange={(e) => setField('clientName', e.target.value)}
                placeholder="Nombre del cliente o fiado"
                type="text"
                value={form.clientName}
              />
            </FormField>
          </div>

          {/* Rejection options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Número de póliza / fianza">
              <input
                className="form-input"
                onChange={(e) => setField('policyNumber', e.target.value)}
                placeholder="Ej: F123456"
                type="text"
                value={form.policyNumber}
              />
            </FormField>
            <FormField label="Documento relacionado (opcional)">
              {recentDocumentsQuery.isLoading ? (
                <div className="form-input flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={14} />
                  Cargando...
                </div>
              ) : (
                <select
                  className="form-input"
                  onChange={(e) => setField('documentId', e.target.value)}
                  value={form.documentId}
                >
                  <option value="">— Ninguno —</option>
                  {(recentDocumentsQuery.data?.items ?? []).map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({format(new Date(doc.createdAt), 'dd/MM/yyyy')})
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
          
          <FormField label={<>Motivos de rechazo <span className="font-normal text-red-500">*</span></>}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {REJECTION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-xs transition-all ${
                    form.rejectionOptions.includes(opt.value)
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    checked={form.rejectionOptions.includes(opt.value)}
                    className="mt-0.5 shrink-0 accent-red-600"
                    onChange={() => toggleOption(opt.value)}
                    type="checkbox"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </FormField>

          {/* Detailed reason */}
          <FormField label={<>Motivo detallado <span className="font-normal text-red-500">*</span></>}>
            <textarea
              className="form-input min-h-[96px] resize-y"
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Ej: Firma del fiador no coincide con DPI presentado, hay diferencia en el trazo del apellido..."
              rows={3}
              value={form.reason}
            />
          </FormField>

          {/* Signature details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Detalle firma fiado (principal)">
              <input
                className="form-input"
                onChange={(e) => setField('signaturePrincipalDetail', e.target.value)}
                placeholder="Ej: Firma ilegible, raspaduras..."
                type="text"
                value={form.signaturePrincipalDetail}
              />
            </FormField>
            <FormField label="Detalle firma fiador (garante)">
              <input
                className="form-input"
                onChange={(e) => setField('signatureGuarantorDetail', e.target.value)}
                placeholder="Ej: No coincide con escritura pública..."
                type="text"
                value={form.signatureGuarantorDetail}
              />
            </FormField>
          </div>

          {/* Submit */}
          <button
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:shadow-xl hover:shadow-red-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitMutation.isPending || selectedFiles.length === 0}
            onClick={handleSubmit}
            type="button"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Comprimiendo y enviando...
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                Rechazar {selectedFiles.length > 0 ? `(${selectedFiles.length} archivo${selectedFiles.length > 1 ? 's' : ''})` : '— seleccione archivos'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* History */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-900">Historial de rechazos</h2>
          <input
            type="text"
            placeholder="Buscar por documento, cliente, agente o póliza..."
            className="form-input sm:max-w-xs"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        </div>

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
                    Agente / Cliente
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    Fecha rechazo
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
                        <p className="mt-1 max-w-xs truncate text-xs text-gray-400 italic">
                          {review.rejectionReason}
                        </p>
                      )}
                      {review.status === 'needs_info' && review.reviewNotes && (
                        <div className="mt-2 rounded-xl bg-blue-50 p-2 text-xs text-blue-800 border border-blue-100 flex gap-2">
                           <HelpCircle size={14} className="shrink-0 mt-0.5" />
                           <p><strong>De Legal:</strong> {review.reviewNotes}</p>
                        </div>
                      )}
                      {review.rejectionOptions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
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
                    </td>
                    <td className="px-6 py-4">
                      {review.agentName && (
                        <p className="text-sm text-gray-700">{review.agentName}</p>
                      )}
                      {review.clientName && (
                        <p className="text-xs text-gray-400">{review.clientName}</p>
                      )}
                      {review.policyNumber && (
                        <p className="text-[10px] font-medium text-brand-600 mt-0.5">Póliza/Fianza: {review.policyNumber}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(
                        new Date(review.rejectedAt),
                        'dd MMM yyyy, HH:mm',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
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
