import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import type { ContactMetadata, ContactType, PartyDetails } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

interface SaveContactVariables {
  id?: string;
  party: PartyDetails;
  metadata: Partial<ContactMetadata>;
  contactTypes: ContactType[];
}

export function useSaveContact() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const organizationId = session?.activeOrganization.id;
  const actorId = session?.user.id;

  return useMutation({
    mutationFn: async ({ id, party, metadata, contactTypes }: SaveContactVariables) => {
      if (id) {
        return contactService.updateContact(
          organizationId!,
          id,
          party,
          {
            ...metadata,
            contactTypes,
          },
          actorId,
        );
      }

      return contactService.upsertContact(organizationId!, party, {
        actorId,
        recordType: metadata.recordType,
        contactTypes,
        tags: metadata.tags,
        notes: metadata.notes,
        source: 'manual',
      });
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts', organizationId] }),
        queryClient.invalidateQueries({ queryKey: ['contactSuggestions', organizationId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.contact(organizationId, id) }),
      ]);
    },
  });
}
