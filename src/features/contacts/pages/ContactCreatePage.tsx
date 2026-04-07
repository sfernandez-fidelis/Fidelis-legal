import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { PermissionNotice } from '../../../shared/components/PermissionNotice';
import { ContactEditorForm } from '../components/ContactEditorForm';
import { useContactsQuery } from '../hooks/useContactsQuery';
import { useSaveContact } from '../hooks/useSaveContact';

export function ContactCreatePage() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const contactsQuery = useContactsQuery({ pageSize: 100, sort: 'recent' }, 1);
  const saveContact = useSaveContact();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Registro manual</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Crear contacto</h1>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to="/contacts">
          Volver a contactos
        </Link>
      </div>

      {!permissions.canEditContent ? <PermissionNotice message="El acceso de visor no puede crear contactos." /> : null}

      <ContactEditorForm
        existingContacts={contactsQuery.data?.items ?? []}
        onSubmit={async ({ party, metadata, contactTypes }) => {
          const id = await saveContact.mutateAsync({ party, metadata, contactTypes });
          toast.success('Contacto guardado');
          navigate(`/contacts/${id}/edit`);
        }}
        submitLabel="Guardar contacto"
      />
    </div>
  );
}
