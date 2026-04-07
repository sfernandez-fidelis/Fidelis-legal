import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { PermissionNotice } from '../../../shared/components/PermissionNotice';
import { ContactEditorForm } from '../components/ContactEditorForm';
import { useContactQuery } from '../hooks/useContactQuery';
import { useContactsQuery } from '../hooks/useContactsQuery';
import { useSaveContact } from '../hooks/useSaveContact';

export function ContactEditPage() {
  const { id } = useParams();
  const permissions = usePermissions();
  const contactQuery = useContactQuery(id);
  const contactsQuery = useContactsQuery({ pageSize: 100, sort: 'recent' }, 1);
  const saveContact = useSaveContact();

  if (contactQuery.isError) {
    return (
      <PageErrorState
        message="Este contacto no se pudo cargar."
        onRetry={() => contactQuery.refetch()}
        title="No se puede abrir el contacto"
      />
    );
  }

  if (!contactQuery.data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Mantenimiento de biblioteca</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Editar contacto</h1>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to="/contacts">
          Volver a contactos
        </Link>
      </div>

      {!permissions.canEditContent ? <PermissionNotice message="El acceso de visor puede inspeccionar los detalles del contacto, pero las ediciones están deshabilitadas." /> : null}

      <ContactEditorForm
        contact={contactQuery.data}
        existingContacts={contactsQuery.data?.items ?? []}
        onSubmit={async ({ party, metadata, contactTypes }) => {
          await saveContact.mutateAsync({ id, party, metadata, contactTypes });
          toast.success('Contacto actualizado');
          await contactQuery.refetch();
        }}
        submitLabel="Actualizar contacto"
      />
    </div>
  );
}
