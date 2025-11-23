import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseMissingEnv = !supabaseUrl || !supabaseAnonKey;

if (supabaseMissingEnv) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Using placeholder values; auth will not work until set.');
}

// Use provided keys when present, otherwise fall back to inert placeholders to avoid hard crashes in dev.
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(clientUrl, clientKey);
