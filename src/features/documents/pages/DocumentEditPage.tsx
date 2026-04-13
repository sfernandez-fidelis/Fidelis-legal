import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { useContactsQuery } from '../../contacts/hooks/useContactsQuery';
import { useSaveContact } from '../../contacts/hooks/useSaveContact';
import { useTemplateContent } from '../../templates/hooks/useTemplatesQuery';
import { ContractType, type CounterGuaranteeData } from '../../../types';
import { DocumentEditor } from '../components/DocumentEditor';
import { useAutosaveDocument } from '../hooks/useAutosaveDocument';
import { useDocumentQuery } from '../hooks/useDocumentQuery';
import { documentGeneratorService } from '../api/documentGeneratorService';
import { useDuplicateDocument, useUpdateDocumentLifecycle } from '../hooks/useSaveDocument';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { queryKeys } from '../../../lib/queryKeys';
import { contactService } from '../../contacts/api/contactService';

export function DocumentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAppSession();
  const documentQuery = useDocumentQuery(id);
  const contactsQuery = useContactsQuery({ pageSize: 50 }, 1);
  const saveContact = useSaveContact();
  const [draft, setDraft] = useState<CounterGuaranteeData | undefined>(undefined);
  const autosave = useAutosaveDocument(Boolean(documentQuery.data && draft), draft);
  const lifecycleMutation = useUpdateDocumentLifecycle();
  const duplicateMutation = useDuplicateDocument();
  const templateQuery = useTemplateContent(documentQuery.data?.type ?? ContractType.COUNTER_GUARANTEE_PRIVATE);

  const withPublishedTemplate = (document: CounterGuaranteeData): CounterGuaranteeData => ({
    ...document,
    templateId: templateQuery.template?.id ?? null,
  });

  useEffect(() => {
    if (!session?.activeOrganization.id) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: queryKeys.contactSuggestions(session.activeOrganization.id, '', { limit: 8, sort: 'frequent' }),
      queryFn: () => contactService.searchContacts(session.activeOrganization.id, '', { limit: 8, sort: 'frequent' }),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, session?.activeOrganization.id]);

  if (documentQuery.isError) {
    return (
      <PageErrorState
        message="El flujo de edición no pudo cargar este documento."
        onRetry={() => documentQuery.refetch()}
        title="No se puede abrir el editor"
      />
    );
  }

  if (contactsQuery.isError) {
    return (
      <PageErrorState
        message="Se requieren contactos para continuar editando."
        onRetry={() => contactsQuery.refetch()}
        title="No se pudieron cargar los contactos"
      />
    );
  }

  const document = draft ?? documentQuery.data;
  if (!document) {
    return null;
  }

  const handleSaveNow = async (nextDocument: CounterGuaranteeData) => {
    await autosave.flush(withPublishedTemplate(nextDocument));
    toast.success('Cambios guardados');
  };

  const handleGenerate = async (formatType: 'pdf' | 'word', nextDocument: CounterGuaranteeData) => {
    const preparedDocument = withPublishedTemplate(nextDocument);
    await autosave.flush(preparedDocument);
    try {
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
    } catch {
      toast.error(`No se pudo generar el ${formatType.toUpperCase()}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Edición estructurada</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Editar y autoguardar</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            El editor muestra el estado de guardado y registra actualizaciones de versión.
          </p>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to={`/documents/${document.id}`}>
          Volver a detalles
        </Link>
      </div>

      <DocumentEditor
        contacts={contactsQuery.data?.items ?? []}
        initialData={documentQuery.data}
        initialType={document.type}
        mode="edit"
        onArchive={async (currentDocument) => {
          await lifecycleMutation.mutateAsync({
            document: currentDocument,
            status: 'archived',
            archived: true,
            snapshotReason: 'archived',
          });
          toast.success('Documento archivado');
          navigate(`/documents/${currentDocument.id}`);
        }}
        onChange={(nextDocument) => setDraft(withPublishedTemplate(nextDocument))}
        onSaveContact={async (party, role) => {
          await saveContact.mutateAsync({
            party,
            contactTypes: party.isRepresenting ? [role, 'representative'] : [role],
            metadata: {
              recordType: party.entityName ? 'entity' : 'person',
              tags: ['saved-from-document'],
            },
          });
          toast.success('Contacto guardado en la biblioteca');
          await contactsQuery.refetch();
        }}
        onDuplicate={async (currentDocument) => {
          const duplicatedId = await duplicateMutation.mutateAsync(currentDocument);
          toast.success('Duplicado creado');
          navigate(`/documents/${duplicatedId}`);
        }}
        onMarkReady={async (currentDocument) => {
          await autosave.flush(withPublishedTemplate({ ...currentDocument, status: 'ready' }));
          await lifecycleMutation.mutateAsync({
            document: withPublishedTemplate({ ...currentDocument, status: 'ready' }),
            status: 'ready',
            snapshotReason: 'ready',
          });
          toast.success('Documento marcado como preparado');
        }}
        onRegenerate={handleGenerate}
        onRestore={async (currentDocument) => {
          await lifecycleMutation.mutateAsync({
            document: currentDocument,
            status: 'draft',
            archived: false,
            snapshotReason: 'restored',
          });
          toast.success('Documento restaurado');
        }}
        onSaveNow={handleSaveNow}
        saveIndicator={autosave.autosaveState}
        templateContent={templateQuery.content}
        templateLoading={templateQuery.isLoading && !templateQuery.data}
      />
    </div>
  );
}
