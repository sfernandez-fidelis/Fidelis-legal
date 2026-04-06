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
import {
  useDownloadGeneratedFile,
  useGenerateFileArtifact,
  useGeneratedFilesQuery,
  usePreviewGeneratedFile,
  useReplaceGeneratedFile,
} from '../hooks/useGeneratedFiles';
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
  const generatedFilesQuery = useGeneratedFilesQuery(id);
  const generateFileMutation = useGenerateFileArtifact();
  const replaceFileMutation = useReplaceGeneratedFile();
  const downloadFileMutation = useDownloadGeneratedFile();
  const previewFileMutation = usePreviewGeneratedFile();
  const templateQuery = useTemplateContent(documentQuery.data?.type ?? ContractType.COUNTER_GUARANTEE_PRIVATE);
  const [activeTab, setActiveTab] = useState<'overview' | 'files'>('overview');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  if (documentQuery.isError) {
    return (
      <PageErrorState
        message="The document detail could not be loaded."
        onRetry={() => documentQuery.refetch()}
        title="Unable to load document"
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

      await generateFileMutation.mutateAsync({
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
      toast.success(`${formatType.toUpperCase()} generated`);
    } catch {
      toast.error(`Could not generate ${formatType.toUpperCase()}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-serif italic text-stone-900">{document.title || 'Untitled document'}</h1>
            <DocumentStatusBadge status={document.status} />
          </div>
          <p className="max-w-2xl text-stone-500">
            Overview, metadata, generation history, and workflow actions for a single legal document.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canEditContent ? (
            <>
              <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50" to={`/documents/${document.id}/edit`}>
                <span className="inline-flex items-center gap-2">
                  <PencilLine size={16} />
                  Edit
                </span>
              </Link>
              <button
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
                onClick={async () => {
                  const duplicatedId = await duplicateMutation.mutateAsync(document);
                  toast.success('Duplicate created');
                  navigate(`/documents/${duplicatedId}`);
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy size={16} />
                  Duplicate
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
                    toast.success('Document restored');
                  }}
                  type="button"
                >
                  Restore
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
                    toast.success('Document archived');
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FolderArchive size={16} />
                    Archive
                  </span>
                </button>
              )}
            </>
          ) : null}
        </div>
      </header>

      {!permissions.canEditContent ? <PermissionNotice message="Viewer access is read-only. Generation, replacement, editing, and archival actions are hidden." /> : null}

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              activeTab === 'overview' ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >
            Overview
          </button>
          <button
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              activeTab === 'files' ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            onClick={() => setActiveTab('files')}
            type="button"
          >
            Files
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="space-y-6">
            {activeTab === 'overview' ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card label="Principal" value={document.principal.entityName || document.principal.name || 'Not captured'} />
                  <Card label="Document type" value={getDocumentTypeLabel(document.type)} />
                  <Card label="Current version" value={`v${document.metadata?.lifecycle?.currentVersion ?? versionsQuery.data?.[0]?.versionNumber ?? 1}`} />
                </div>

                <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-medium text-stone-900">Metadata</h2>
                  <dl className="mt-4 grid gap-4 md:grid-cols-2">
                    <MetaRow label="Beneficiary" value={document.beneficiaryName || 'Not captured'} />
                    <MetaRow label="Contract date" value={document.contractDate || 'Not captured'} />
                    <MetaRow label="Policies" value={String(document.metadata?.summary?.policyCount ?? document.policies.length)} />
                    <MetaRow label="Guarantors" value={String(document.metadata?.summary?.guarantorCount ?? document.guarantors.length)} />
                    <MetaRow label="Updated" value={document.updatedAt ? format(new Date(document.updatedAt), 'MMM d, yyyy HH:mm') : 'Just created'} />
                    <MetaRow label="Search/reporting year" value={String(document.metadata?.reporting?.contractYear ?? '-')} />
                  </dl>
                </div>

                <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-medium text-stone-900">Version preview</h2>
                      <p className="text-sm text-stone-500">Version history is fetched separately to keep the detail view responsive.</p>
                    </div>
                    <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/documents/${document.id}/history`}>
                      Open full history
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(versionsQuery.data ?? []).slice(0, 3).map((version) => (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={version.id}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-stone-900">Version {version.versionNumber}</p>
                          <p className="text-xs text-stone-500">{format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">{version.snapshotReason || 'Autosaved milestone'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-stone-900">Generated files</h2>
                    <p className="text-sm text-stone-500">Stored artifacts can be downloaded again without regenerating.</p>
                  </div>
                  <button
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                    disabled={!permissions.canEditContent}
                    onClick={() => replaceInputRef.current?.click()}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload size={16} />
                      Replace / upload
                    </span>
                  </button>
                  <input
                    className="hidden"
                    onChange={async (event) => {
                      if (!permissions.canEditContent) {
                        return;
                      }
                      const file = event.target.files?.[0];
                      if (!file || !document.id) {
                        return;
                      }

                      try {
                        await replaceFileMutation.mutateAsync({
                          documentId: document.id,
                          file,
                          previousFileId: generatedFilesQuery.data?.[0]?.id ?? null,
                        });
                        toast.success('Replacement file stored');
                      } catch {
                        toast.error('Could not store replacement file');
                      } finally {
                        event.target.value = '';
                      }
                    }}
                    ref={replaceInputRef}
                    type="file"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {generatedFilesQuery.isLoading ? (
                    <p className="text-sm text-stone-500">Loading archived files...</p>
                  ) : generatedFilesQuery.data?.length ? (
                    generatedFilesQuery.data.map((file) => (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={file.id}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-medium text-stone-900">{file.metadata?.fileName || `Generated ${file.fileKind.toUpperCase()}`}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-400">{file.fileKind}</p>
                            <p className="mt-2 text-sm text-stone-500">
                              Created {format(new Date(file.createdAt), 'MMM d, yyyy HH:mm')}
                              {file.createdByName ? ` by ${file.createdByName}` : ''}
                            </p>
                            <p className="mt-1 text-sm text-stone-500">
                              Version source: {file.versionLabel || 'Current document'}
                              {file.metadata?.source === 'manual-replacement' ? ' • manual replacement' : ' • generated'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                              onClick={async () => {
                                try {
                                  await downloadFileMutation.mutateAsync(file);
                                } catch {
                                  toast.error('Could not download file');
                                }
                              }}
                              type="button"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <Download size={14} />
                                  Download
                                </span>
                              </button>
                            {file.fileKind === 'pdf' ? (
                              <button
                                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                                onClick={async () => {
                                  try {
                                    const signedUrl = await previewFileMutation.mutateAsync({
                                      bucket: file.storageBucket,
                                      path: file.storagePath,
                                    });
                                    setPreviewUrl(signedUrl);
                                    setPreviewTitle(file.metadata?.fileName || 'PDF preview');
                                  } catch {
                                    toast.error('Could not open preview');
                                  }
                                }}
                                type="button"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <Eye size={14} />
                                  Preview
                                </span>
                              </button>
                            ) : null}
                            {permissions.canEditContent ? (
                              <button
                                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                                onClick={() => handleGenerate(file.fileKind === 'pdf' ? 'pdf' : 'word')}
                                type="button"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <RotateCw size={14} />
                                  Regenerate
                                </span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">No files stored yet. Generate one to start the archive.</p>
                  )}
                </div>

                {previewUrl ? (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
                      <p className="text-sm font-medium text-stone-900">{previewTitle}</p>
                      <button className="text-sm font-medium text-brand-700 hover:underline" onClick={() => setPreviewUrl(null)} type="button">
                        Close preview
                      </button>
                    </div>
                    <iframe className="h-[720px] w-full bg-stone-100" src={previewUrl} title={previewTitle || 'Generated file preview'} />
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-stone-900">Actions</h2>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  disabled={!permissions.canEditContent}
                  onClick={() => handleGenerate('pdf')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    Generate PDF
                  </span>
                </button>
                <button
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  disabled={!permissions.canEditContent}
                  onClick={() => handleGenerate('word')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCw size={16} />
                    Generate Word
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
                    toast.success('Document marked ready');
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <History size={16} />
                    Mark ready
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-stone-900">Archive summary</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-500">
                <p>{generatedFilesQuery.data?.length ?? 0} stored artifacts</p>
                <p>{document.metadata?.generationHistory?.length ?? 0} lifecycle generation events</p>
                <p>Downloads use short-lived signed URLs on demand.</p>
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
