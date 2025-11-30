import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Client for user operations (uses anon key)
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);

// Admin client for server-side operations (uses service key)
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

