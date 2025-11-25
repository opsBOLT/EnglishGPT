import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseMissingEnv = !supabaseUrl || !supabaseAnonKey;

// Use provided keys when present, otherwise fall back to inert placeholders to avoid hard crashes in dev.
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-anon-key';

// Disable auto token refresh to avoid repeated refresh-token calls when a bad/expired refresh token is cached.
export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    // Keep refresh on, we'll handle failures gracefully in AuthContext.
    autoRefreshToken: true,
    persistSession: true,
    // Keep URL parsing on so Google OAuth callbacks are captured.
    detectSessionInUrl: true,
  },
});
