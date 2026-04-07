import { format } from 'date-fns';
import { Copy, Download, Eye, FileText, FolderArchive, History, PencilLine, RotateCw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { useDocumentQuery, useDocumentVersionsQuery } from '../hooks/useDocumentQuery';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { PermissionNotice } from '../../../shared/components/PermissionNotice';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { getDocumentTypeLabel } from '../components/documentLabels';
import { useDuplicateDocument, useSaveDocument, useUpdateDocumentLifecycle } from '../hooks/useSaveDocument';
import { documentGeneratorService } from '../api/documentGeneratorService';
import { useTemplateContent } from '../../templates/hooks/useTemplatesQuery';
import { ContractType } from '../../../types';

export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const documentQuery = useDocumentQuery(id);
  const versionsQuery = useDocumentVersionsQuery(id);
  const duplicateMutation = useDuplicateDocument();
  const saveDocumentMutation = useSaveDocument();
  const lifecycleMutation = useUpdateDocumentLifecycle();
  const templateQuery = useTemplateContent(documentQuery.data?.type ?? ContractType.COUNTER_GUARANTEE_PRIVATE);

  if (documentQuery.isError) {
    return (
      <PageErrorState
        message="No se pudo cargar el detalle del documento."
        onRetry={() => documentQuery.refetch()}
        title="No se puede cargar el documento"
      />
    );
  }

  const document = documentQuery.data;
  if (!document) {
    return null;
  }

  const handleGenerate = async (formatType: 'pdf' | 'word') => {
    const preparedDocument = {
      ...document,
      templateId: templateQuery.template?.id ?? null,
    };

    try {
      await saveDocumentMutation.mutateAsync({
        document: preparedDocument,
        snapshotReason: 'template-bound',
      });

      await documentGeneratorService.generateAndDownload({
        document: preparedDocument,
        templateContent: templateQuery.content,
        kind: formatType === 'pdf' ? 'pdf' : 'docx',
      });

      await lifecycleMutation.mutateAsync({
        document: preparedDocument,
        status: 'generated',
        snapshotReason: `generated:${formatType}`,
        generationRecord: {
          generatedAt: new Date().toISOString(),
          format: formatType,
          label: formatType.toUpperCase(),
        },
      });
      toast.success(`${formatType.toUpperCase()} descargado exitosamente`);
    } catch (err) {
      console.error(err);
      toast.error(`No se pudo generar el ${formatType.toUpperCase()}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-serif italic text-stone-900">{document.title || 'Documento sin título'}</h1>
            <DocumentStatusBadge status={document.status} />
          </div>
          <p className="max-w-2xl text-stone-500">
            Resumen, metadatos, historial de generación y flujo de trabajo para un único documento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canEditContent ? (
            <>
              <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50" to={`/documents/${document.id}/edit`}>
                <span className="inline-flex items-center gap-2">
                  <PencilLine size={16} />
                  Editar
                </span>
              </Link>
              <button
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
                onClick={async () => {
                  const duplicatedId = await duplicateMutation.mutateAsync(document);
                  toast.success('Duplicado creado');
                  navigate(`/documents/${duplicatedId}`);
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy size={16} />
                  Duplicar
                </span>
              </button>
              {document.archivedAt ? (
                <button
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
                  onClick={async () => {
                    await lifecycleMutation.mutateAsync({
                      document,
                      status: 'draft',
                      archived: false,
                      snapshotReason: 'restored',
                    });
                    toast.success('Documento restaurado');
                  }}
                  type="button"
                >
                  Restaurar
                </button>
              ) : (
                <button
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
                  onClick={async () => {
                    await lifecycleMutation.mutateAsync({
                      document,
                      status: 'archived',
                      archived: true,
                      snapshotReason: 'archived',
                    });
                    toast.success('Documento archivado');
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FolderArchive size={16} />
                    Archivar
                  </span>
                </button>
              )}
            </>
          ) : null}
        </div>
      </header>

      {!permissions.canEditContent ? <PermissionNotice message="El acceso de visor es solo lectura. Las acciones de generación, impresión, edición y archivado están ocultas." /> : null}

      <div className="space-y-4">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card label="Fiado" value={document.principal.entityName || document.principal.name || 'No capturado'} />
                  <Card label="Tipo de documento" value={getDocumentTypeLabel(document.type)} />
                  <Card label="Versión actual" value={`v${document.metadata?.lifecycle?.currentVersion ?? versionsQuery.data?.[0]?.versionNumber ?? 1}`} />
                </div>

                <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-medium text-stone-900">Metadatos</h2>
                  <dl className="mt-4 grid gap-4 md:grid-cols-2">
                    <MetaRow label="Beneficiario" value={document.beneficiaryName || 'No capturado'} />
                    <MetaRow label="Fecha del contrato" value={document.contractDate || 'No capturado'} />
                    <MetaRow label="Pólizas" value={String(document.metadata?.summary?.policyCount ?? document.policies.length)} />
                    <MetaRow label="Garantías" value={String(document.metadata?.summary?.guarantorCount ?? document.guarantors.length)} />
                    <MetaRow label="Actualizado" value={document.updatedAt ? format(new Date(document.updatedAt), 'MMM d, yyyy HH:mm') : 'Recién creado'} />
                    <MetaRow label="Año de búsqueda/reporte" value={String(document.metadata?.reporting?.contractYear ?? '-')} />
                  </dl>
                </div>

                <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-medium text-stone-900">Vista de versiones</h2>
                      <p className="text-sm text-stone-500">El historial se carga remotamente para mantener rápida esta vista.</p>
                    </div>
                    <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/documents/${document.id}/history`}>
                      Abrir historial completo
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(versionsQuery.data ?? []).slice(0, 3).map((version) => (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={version.id}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-stone-900">Versión {version.versionNumber}</p>
                          <p className="text-xs text-stone-500">{format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">{version.snapshotReason || 'Guardado automático'}</p>
                      </div>
                    ))}
                  </div>
                </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-stone-900">Acciones</h2>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  disabled={!permissions.canEditContent}
                  onClick={() => handleGenerate('pdf')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    Descargar en PDF
                  </span>
                </button>
                <button
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  disabled={!permissions.canEditContent}
                  onClick={() => handleGenerate('word')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    Descargar en Word
                  </span>
                </button>
                <button
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  disabled={!permissions.canEditContent}
                  onClick={async () => {
                    await lifecycleMutation.mutateAsync({
                      document: { ...document, status: 'ready' },
                      status: 'ready',
                      snapshotReason: 'ready',
                    });
                    toast.success('Documento marcado como preparado');
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <History size={16} />
                    Marcar como preparado
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-stone-900">Resumen de historial</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-500">
                <p>{document.metadata?.generationHistory?.length ?? 0} eventos de generación en ciclo de vida</p>
                <p>Las descargas se generan velozmente bajo demanda.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-medium text-stone-900">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</dt>
      <dd className="mt-2 text-sm text-stone-700">{value}</dd>
    </div>
  );
}
