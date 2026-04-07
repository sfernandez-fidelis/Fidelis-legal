import type { ReactNode } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
import { supabase } from '../lib/supabase/client';
import { queryKeys } from '../lib/queryKeys';
import { Toaster } from '../components/ui/sonner';
import { buildAppSession } from '../features/auth/api/authService';
import { captureAppError } from '../lib/monitoring';

function SessionSync() {
  const client = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        client.setQueryData(queryKeys.session(), null);
        return;
      }

      // TOKEN_REFRESHED: the SDK just renewed the JWT.
      // Invalidate so React Query refetches with the fresh token.
      // Do NOT call buildAppSession here — the new token is already
      // stored in the SDK; the next mutation will use it automatically.
      if (event === 'TOKEN_REFRESHED') {
        await client.invalidateQueries({ queryKey: queryKeys.session() });
        return;
      }

      // For SIGNED_IN / INITIAL_SESSION: build the app session using the
      // User object already provided by the event — no extra getSession()
      // or getUser() call, so no SDK mutex contention.
      try {
        const appSession = await buildAppSession(session.user);
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
