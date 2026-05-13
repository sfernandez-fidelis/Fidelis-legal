import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      // Persist session to localStorage so refresh doesn't require a server roundtrip
      persistSession: true,
      // Detect session from URL hash (needed for OAuth callback)
      detectSessionInUrl: true,
      // Auto-refresh token before it expires
      autoRefreshToken: true,
      // Use PKCE flow for better security and faster token exchange
      flowType: 'pkce',
    },
  },
);
