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
        message="This contact could not be loaded."
        onRetry={() => contactQuery.refetch()}
        title="Unable to open contact"
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Library maintenance</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Edit contact</h1>
        </div>
        <Link className="text-sm font-medium text-brand-700 hover:underline" to="/contacts">
          Back to contacts
        </Link>
      </div>

      {!permissions.canEditContent ? <PermissionNotice message="Viewer access can inspect contact details, but edits are disabled." /> : null}

      <ContactEditorForm
        contact={contactQuery.data}
        existingContacts={contactsQuery.data?.items ?? []}
        onSubmit={async ({ party, metadata, contactTypes }) => {
          await saveContact.mutateAsync({ id, party, metadata, contactTypes });
          toast.success('Contact updated');
          await contactQuery.refetch();
        }}
        submitLabel="Update contact"
      />
    </div>
  );
}
