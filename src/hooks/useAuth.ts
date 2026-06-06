import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface XUser {
  id: string;
  handle: string;
  name: string;
  avatar: string | null;
  raw: User;
}

function toXUser(user: User): XUser {
  const meta = user.user_metadata ?? {};
  return {
    id:     user.id,
    handle: meta.user_name ?? meta.preferred_username ?? meta.screen_name ?? 'user',
    name:   meta.name ?? meta.full_name ?? meta.user_name ?? 'User',
    avatar: meta.avatar_url ?? meta.picture ?? null,
    raw:    user,
  };
}

export function useAuth() {
  const [user, setUser]       = useState<XUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? toXUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? toXUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithX = () =>
    supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: { redirectTo: window.location.href },
    });

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signInWithX, signOut };
}
