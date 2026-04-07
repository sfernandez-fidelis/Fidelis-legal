import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { authService } from '../api/authService';

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: authService.getSessionUser,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
}

export function useAppSession() {
  return useSessionQuery().data ?? null;
}

export function useCurrentUser() {
  return useAppSession()?.user ?? null;
}

export function useActiveOrganization() {
  return useAppSession()?.activeOrganization ?? null;
}

export function useActiveMembership() {
  return useAppSession()?.membership ?? null;
}
