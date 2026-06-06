import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, key);

export const isSupabaseReady = Boolean(url && key);

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
