import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, History, Maximize2, Minimize2, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { toast } from 'sonner';
import { ContractType } from '../../../types';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { PermissionNotice } from '../../../shared/components/PermissionNotice';
import { useArchiveTemplate, usePublishTemplate, useRollbackTemplate, useSaveTemplateDraft } from '../hooks/useTemplateMutations';
import { useTemplatePreviewData, useTemplateQuery } from '../hooks/useTemplatesQuery';
import { getTemplateStateLabel, getTemplateTypeLabel } from '../templateLabels';

const availableVariables = [
  ['FECHA_CONTRATO', 'Fecha del contrato'],
  ['DATOS_FIADO', 'Datos del fiado'],
  ['DATOS_FIADORES', 'Datos de fiadores'],
  ['DATOS_POLIZAS', 'Datos de polizas'],
  ['BENEFICIARIO', 'Beneficiario'],
  ['DIRECCION_NOTIFICACIONES', 'Direccion de notificaciones'],
  ['FIRMAS', 'Firmas'],
  ['AUTENTICA', 'Acta de autentica'],
] as const;

const LivePreview = lazy(() => import('../../../components/LivePreview'));

export function TemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const templateQuery = useTemplateQuery(id);
  const saveDraft = useSaveTemplateDraft();
  const publishTemplate = usePublishTemplate();
  const rollbackTemplate = useRollbackTemplate();
  const archiveTemplate = useArchiveTemplate();
  const [draftNote, setDraftNote] = useState('');
  const [publishNote, setPublishNote] = useState('');
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [baselineContent, setBaselineContent] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);

  const template = templateQuery.data;
  const previewDataQuery = useTemplatePreviewData(
    template?.type ?? ContractType.COUNTER_GUARANTEE_PRIVATE,
    previewEnabled && Boolean(template),
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm mx-auto min-h-[560px] max-w-none focus:outline-none p-5',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setEditorHtml(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !template) {
      return;
    }

    const nextContent = template.draftVersion?.content ?? template.publishedVersion?.content ?? template.content;
    editor.commands.setContent(nextContent);
    setBaselineContent(nextContent);
    setEditorHtml(nextContent);
    setDraftNote(template.draftVersion?.changeNote ?? '');
    setPublishNote('');
  }, [editor, template?.id, template?.updatedAt]);

  const currentContent = editorHtml;
  const isDirty = Boolean(template && currentContent && currentContent !== baselineContent);
  const renderedPreviewHtml = useMemo(
    () => currentContent || template?.draftVersion?.content || template?.publishedVersion?.content || template?.content || '',
    [currentContent, template],
  );

  if (templateQuery.isError) {
    return (
      <PageErrorState
        message="No fue posible cargar esta plantilla."
        onRetry={() => templateQuery.refetch()}
        title="No se pudo abrir la plantilla"
      />
    );
  }

  if (!template || !editor) {
    return <div className="p-8 text-sm text-stone-500">Cargando entorno de la plantilla...</div>;
  }

  const publishDisabled =
    publishTemplate.isPending ||
    !publishNote.trim() ||
    (!template.hasUnpublishedChanges && renderedPreviewHtml === (template.publishedVersion?.content ?? template.content));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/templates">
            <ArrowLeft size={16} />
            Volver a plantillas
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
              {getTemplateTypeLabel(template.type)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
                template.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700'
                  : template.status === 'archived'
                    ? 'bg-stone-200 text-stone-600'
                    : 'bg-amber-50 text-amber-700'
              }`}
            >
              {getTemplateStateLabel(template.status)}
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-serif italic text-stone-900">{template.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-stone-500">
              La versión publicada permanece estable hasta publicar explícitamente el borrador. Cada guardado crea una versión a la que se puede revertir.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric title="Usada en docs" value={String(template.usedByDocuments)} />
          <Metric title="Versión publicada" value={template.publishedVersion ? `v${template.publishedVersion.versionNumber}` : 'Ninguna'} />
          <Metric title="Borrador actual" value={template.draftVersion ? `v${template.draftVersion.versionNumber}` : 'Ninguno'} />
        </div>
      </header>

      {!permissions.canEditContent ? (
        <PermissionNotice message="El acceso como visor permite inspeccionar el historial y la vista previa, pero la edición y publicación están deshabilitadas." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_420px]">
        <section className="space-y-6">
          <div className="grid gap-6 2xl:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
              {permissions.canEditContent ? <EditorToolbar editor={editor} /> : null}
              <div className="border-b border-stone-200 px-5 py-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Nota del borrador</span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
                    disabled={!permissions.canEditContent}
                    onChange={(event) => setDraftNote(event.target.value)}
                    placeholder="Describe los cambios en este borrador"
                    value={draftNote}
                  />
                </label>
              </div>
              <EditorContent editor={editor} />
              {permissions.canEditContent ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-5 py-4">
                  <p className="text-sm text-stone-500">
                    {isDirty ? 'Los cambios están listos para guardarse como un nuevo borrador.' : 'El editor coincide con el último borrador guardado.'}
                  </p>
                  <button
                    className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
                    disabled={saveDraft.isPending || !isDirty}
                    onClick={async () => {
                      await saveDraft.mutateAsync({
                        templateId: template.id,
                        content: editor.getHTML(),
                        changeNote: draftNote,
                      });
                      setBaselineContent(editor.getHTML());
                      toast.success('Borrador de versión guardado');
                    }}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save size={16} />
                      Guardar borrador
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            <div 
              className={`overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm transition-all ${
                isPreviewMaximized 
                  ? 'fixed inset-6 z-[60] flex flex-col shadow-2xl ring-1 ring-black/5' 
                  : ''
              }`}
            >
              {isPreviewMaximized && (
                <div 
                  className="fixed inset-0 z-[-1] bg-stone-900/40 backdrop-blur-sm"
                  onClick={() => setIsPreviewMaximized(false)}
                />
              )}
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-medium text-stone-900">Vista previa</h2>
                  <p className="text-sm text-stone-500">Los datos de prueba se cargan al solicitarlo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                    onClick={() => setPreviewEnabled(true)}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Eye size={16} />
                      {previewEnabled ? 'Actualizar vista' : 'Cargar prueba'}
                    </span>
                  </button>
                  <button
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 text-stone-700 transition hover:bg-stone-50"
                    onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                    title={isPreviewMaximized ? "Contraer" : "Expandir vista"}
                    type="button"
                  >
                    {isPreviewMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
              </div>

              <div className={isPreviewMaximized ? 'flex-1 overflow-hidden' : 'h-[760px]'}>
                {previewEnabled && previewDataQuery.data ? (
                  <Suspense fallback={<div className="p-8 text-sm text-stone-500">Cargando vista previa...</div>}>
                    <LivePreview
                      data={previewDataQuery.data}
                      loading={previewDataQuery.isLoading}
                      templateContent={renderedPreviewHtml}
                      type={template.type}
                    />
                  </Suspense>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-stone-500">
                    <Eye className="h-8 w-8 text-stone-300" />
                    <p>La vista previa se carga de forma diferida para que el editor inicie rápido.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {permissions.canEditContent ? (
          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-stone-700" />
            <h2 className="text-lg font-medium text-stone-900">Flujo de publicación</h2>
            </div>
            <p className="mt-2 text-sm text-stone-500">
              La publicación convierte este borrador en la versión estable usada para generar documentos.
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Nota de cambios</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
                onChange={(event) => setPublishNote(event.target.value)}
                placeholder="Resume lo relevante para los revisores de esta versión"
                value={publishNote}
              />
            </label>
            <button
              className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
              disabled={publishDisabled}
              onClick={async () => {
                const confirmed = window.confirm(
                  `¿Publicar ${template.name}? Esto convertirá el borrador actual en la versión estable usada para la generación.`,
                );
                if (!confirmed) {
                  return;
                }

                if (isDirty) {
                  await saveDraft.mutateAsync({
                    templateId: template.id,
                    content: editor.getHTML(),
                    changeNote: draftNote || publishNote,
                  });
                  setBaselineContent(editor.getHTML());
                }

                await publishTemplate.mutateAsync({
                  templateId: template.id,
                  changeNote: publishNote,
                });
                toast.success('Plantilla publicada');
              }}
              type="button"
            >
              Publicar borrador actual
            </button>
          </section>
          ) : null}

          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-stone-700" />
              <h2 className="text-lg font-medium text-stone-900">Historial de versiones</h2>
            </div>
            <div className="mt-4 space-y-3">
              {template.versions.map((version) => (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={version.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        v{version.versionNumber}
                        {version.isPublished ? ' - publicada' : version.isDraft ? ' - borrador' : ''}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">{new Date(version.createdAt).toLocaleString()}</p>
                    </div>
                    {permissions.canEditContent ? (
                      <button
                        className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                        onClick={async () => {
                          await rollbackTemplate.mutateAsync({
                            templateId: template.id,
                            versionId: version.id,
                            changeNote: `Revertido preparado desde v${version.versionNumber}`,
                          });
                          toast.success(`Borrador de reversión creado desde v${version.versionNumber}`);
                        }}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Undo2 size={14} />
                          Revertir
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{version.changeNote || 'Sin notas de cambios.'}</p>
                </div>
              ))}
            </div>
          </section>

          {permissions.canManageOrganization ? (
          <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-stone-900">Acciones administrativas</h2>
            <p className="mt-2 text-sm text-stone-500">
              Archivar conserva el historial pero retira la plantilla de los flujos activos.
            </p>
            <button
              className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              disabled={archiveTemplate.isPending || template.usedByDocuments > 0}
              onClick={async () => {
                const confirmed = window.confirm(`¿Archivar ${template.name}? El historial existente se conserva, pero la plantilla sale del uso activo.`);
                if (!confirmed) {
                  return;
                }

                await archiveTemplate.mutateAsync({ templateId: template.id });
                toast.success('Plantilla archivada');
                navigate('/templates');
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 size={16} />
                Archivar plantilla
              </span>
            </button>
            {template.usedByDocuments > 0 ? (
              <p className="mt-2 text-xs text-stone-500">El archivado está deshabilitado si está vinculada a documentos.</p>
            ) : null}
          </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{title}</p>
      <p className="mt-2 text-base font-medium text-stone-900">{value}</p>
    </div>
  );
}

function EditorToolbar({ editor }: { editor: any }) {
  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`<mark>{{${variable}}}</mark>`).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
      <select
        className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 focus:border-stone-900 focus:outline-none"
        onChange={(event) => {
          if (event.target.value) {
            insertVariable(event.target.value);
            event.target.value = '';
          }
        }}
      >
        <option value="">Insertar variable</option>
        {availableVariables.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="text-xs uppercase tracking-[0.25em] text-stone-400">
        La versión publicada permanece bloqueada hasta publicar este borrador.
      </div>
    </div>
  );
}
