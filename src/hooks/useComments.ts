import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseReady, type TokenComment } from '../lib/supabase';
import type { XUser } from './useAuth';

export function useComments(network: string, address: string) {
  const [comments, setComments] = useState<TokenComment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const addr = address.toLowerCase();

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return; }

    setLoading(true);

    supabase
      .from('token_comments')
      .select('*')
      .eq('token_network', network)
      .eq('token_address', addr)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setComments(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`comments:${network}:${addr}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'token_comments',
          filter: `token_address=eq.${addr}` },
        payload => setComments(prev => [payload.new as TokenComment, ...prev]),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'token_comments',
          filter: `token_address=eq.${addr}` },
        payload => setComments(prev => prev.filter(c => c.id !== (payload.old as TokenComment).id)),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [network, addr]);

  const postComment = useCallback(async (content: string, user: XUser) => {
    const { error: err } = await supabase.from('token_comments').insert({
      token_network:  network,
      token_address:  addr,
      user_id:        user.id,
      twitter_handle: user.handle,
      twitter_name:   user.name,
      twitter_avatar: user.avatar,
      content:        content.trim(),
    });
    return err?.message ?? null;
  }, [network, addr]);

  const deleteComment = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('token_comments')
      .delete()
      .eq('id', id);
    return err?.message ?? null;
  }, []);

  return { comments, loading, error, postComment, deleteComment };
}
