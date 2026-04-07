import type { ReactNode } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
import { supabase } from '../lib/supabase/client';
import { queryKeys } from '../lib/queryKeys';
import { Toaster } from '../components/ui/sonner';
import { authService } from '../features/auth/api/authService';
import { captureAppError } from '../lib/monitoring';

function SessionSync() {
  const client = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        client.setQueryData(queryKeys.session(), null);
        return;
      }

      // TOKEN_REFRESHED: the SDK just renewed the JWT internally.
      // Don't call getSessionUser() here — that would try to acquire
      // the same internal Supabase lock that is still held by the
      // refresh, causing a >15 s wait and a timeout error.
      // Simply invalidate so React Query refetches when needed.
      if (event === 'TOKEN_REFRESHED') {
        await client.invalidateQueries({ queryKey: queryKeys.session() });
        return;
      }

      try {
        const appSession = await authService.getSessionUser();
        client.setQueryData(queryKeys.session(), appSession);
      } catch (error) {
        captureAppError(error, { area: 'auth-state-change' });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [client]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionSync />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
