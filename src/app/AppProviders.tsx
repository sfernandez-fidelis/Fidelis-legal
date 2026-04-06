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
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        client.setQueryData(queryKeys.session(), null);
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
