import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import type { ContactType } from '../../../types';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { contactService } from '../api/contactService';

export function useContactSuggestions(
  search: string,
  options: { limit?: number; types?: ContactType[]; sort?: 'recent' | 'frequent' | 'name'; enabled?: boolean } = {},
) {
  const session = useAppSession();
  const organizationId = session?.activeOrganization.id;

  return useQuery({
    queryKey: queryKeys.contactSuggestions(organizationId, search, options),
    queryFn: () => contactService.searchContacts(organizationId!, search, options),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: search.trim() ? 30 * 1000 : 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
