import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseReady = Boolean(url && key);

// createClient throws if url is empty — provide dummy values when not configured
// so the module loads safely; all callers gate on isSupabaseReady before using it
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
);

export interface TokenComment {
  id: string;
  token_network: string;
  token_address: string;
  user_id: string;
  twitter_handle: string;
  twitter_name: string | null;
  twitter_avatar: string | null;
  content: string;
  created_at: string;
}
