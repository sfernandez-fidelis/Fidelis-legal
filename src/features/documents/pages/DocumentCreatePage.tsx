import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentEditor, type SaveIndicatorState } from '../components/DocumentEditor';
import { useContactsQuery } from '../../contacts/hooks/useContactsQuery';
import { useSaveContact } from '../../contacts/hooks/useSaveContact';
import { useTemplateContent } from '../../templates/hooks/useTemplatesQuery';
import { documentGeneratorService } from '../api/documentGeneratorService';
import { ContractType, type CounterGuaranteeData } from '../../../types';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { useAutosaveDocument } from '../hooks/useAutosaveDocument';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { queryKeys } from '../../../lib/queryKeys';
import { contactService } from '../../contacts/api/contactService';

function isContractType(value: string | null): value is ContractType {
  return value !== null && Object.values(ContractType).includes(value as ContractType);
}

export function DocumentCreatePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<CounterGuaranteeData | undefined>(undefined);
  const [createdId, setCreatedId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const session = useAppSession();
  const requestedType = searchParams.get('type');
  const selectedType = useMemo(
    () => (isContractType(requestedType) ? requestedType : ContractType.COUNTER_GUARANTEE_PRIVATE),
    [requestedType],
  );
  const contactsQuery = useContactsQuery({ pageSize: 50 }, 1);
  const saveContact = useSaveContact();
  const templateQuery = useTemplateContent(selectedType);
  const autosave = useAutosaveDocument(Boolean(draft), draft);

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

  const withId = (document: CounterGuaranteeData) => ({
    ...document,
    id: createdId ?? document.id,
    templateId: templateQuery.template?.id ?? null,
  });

  const handleSaveNow = async (document: CounterGuaranteeData) => {
    const id = await autosave.flush(withId(document));
    if (id) {
      setCreatedId(id);
      setDraft((current) => (current ? { ...current, id } : current));
      toast.success('Borrador guardado');
    }
  };

  const handleGenerate = async (format: 'pdf' | 'word', document: CounterGuaranteeData) => {
    const currentDocument = withId(document);
    const id = await autosave.flush(currentDocument);
    if (id && !createdId) {
      setCreatedId(id);
    }

    const savedDocument = { ...currentDocument, id };
    try {
      await documentGeneratorService.generateAndDownload({
        document: savedDocument,
        templateContent: templateQuery.content,
        kind: format === 'pdf' ? 'pdf' : 'docx',
      });
      toast.success(`${format.toUpperCase()} descargado exitosamente`);
      if (id) {
        navigate(`/documents/${id}`);
      }
    } catch {
      toast.error(`No se pudo generar el ${format.toUpperCase()}`);
    }
  };

  if (contactsQuery.isError) {
    return (
      <PageErrorState
        message="Se requieren contactos registrados antes de poder redactar un documento."
        onRetry={() => contactsQuery.refetch()}
        title="No se puede iniciar el flujo de creación"
      />
    );
  }

  const saveState: SaveIndicatorState = autosave.autosaveState;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Creación guiada</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Iniciar nuevo documento</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Escoge el tipo de contrato, redacta con autoguardado y genera el archivo cuando estés listo.
          </p>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to="/documents">
          Volver a documentos
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Object.values(ContractType).map((type) => (
          <button
            className={`rounded-[24px] border p-5 text-left transition ${
              selectedType === type ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            key={type}
            onClick={() => setSearchParams({ type })}
            type="button"
          >
            <p className="text-xs uppercase tracking-[0.25em]">{type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Contragarantía privada' : type === ContractType.COUNTER_GUARANTEE_PUBLIC ? 'Contragarantía pública' : 'Garantía hipotecaria'}</p>
            <p className="mt-3 text-lg font-medium">
              {type === ContractType.COUNTER_GUARANTEE_PRIVATE
                ? 'Documento Privado'
                : type === ContractType.COUNTER_GUARANTEE_PUBLIC
                  ? 'Escritura Pública'
                  : 'Constitución Hipotecaria'}
            </p>
          </button>
        ))}
      </div>

      <DocumentEditor
        contacts={contactsQuery.data?.items ?? []}
        initialType={selectedType}
        mode="create"
        onChange={(document) => setDraft((current) => ({ ...document, id: createdId ?? current?.id ?? document.id }))}
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
        onMarkReady={async (document) => {
          await handleSaveNow({ ...document, status: 'ready' });
          toast.success('Documento marcado como preparado');
        }}
        onRegenerate={handleGenerate}
        onSaveNow={handleSaveNow}
        saveIndicator={saveState}
        templateContent={templateQuery.content}
        templateLoading={templateQuery.isLoading && !templateQuery.data}
      />
    </div>
  );
}
