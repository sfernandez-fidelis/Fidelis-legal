import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

export function useContactQuery(id?: string) {
  const session = useAppSession();
  const organizationId = session?.activeOrganization.id;

  return useQuery({
    queryKey: queryKeys.contact(organizationId, id ?? ''),
    queryFn: () => contactService.getContact(organizationId!, id!),
    enabled: Boolean(organizationId && id),
    staleTime: 60 * 1000,
  });
}
