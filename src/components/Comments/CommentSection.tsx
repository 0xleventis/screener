import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Trash2, LogOut, Twitter } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useComments } from '../../hooks/useComments';
import { isSupabaseReady, type TokenComment } from '../../lib/supabase';
import { LiveIndicator } from '../common/LiveIndicator';

const MAX_CHARS = 500;

// ── Single comment row ────────────────────────────────────────────────────────
function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: TokenComment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isOwn = currentUserId === comment.user_id;
  const timeAgo = formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true });

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(comment.id);
    setDeleting(false);
  };

  return (
    <div className="flex gap-3 py-3 border-b border-nova-border/40 last:border-0 group">
      {comment.twitter_avatar ? (
        <img
          src={comment.twitter_avatar}
          alt={comment.twitter_handle}
          className="w-8 h-8 rounded-full shrink-0 ring-1 ring-nova-border object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full shrink-0 bg-nova-accent/20 flex items-center justify-center text-xs font-bold text-nova-accent ring-1 ring-nova-border">
          {comment.twitter_handle.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-nova-text truncate">
            {comment.twitter_name ?? comment.twitter_handle}
          </span>
          <span className="text-[11px] text-nova-subtle">@{comment.twitter_handle}</span>
          <span className="text-[10px] text-nova-subtle ml-auto shrink-0">{timeAgo}</span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-nova-subtle hover:text-loss disabled:opacity-30"
              title="Delete comment"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <p className="text-sm text-nova-muted leading-relaxed break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

// ── Comment input form ────────────────────────────────────────────────────────
function CommentForm({
  handle,
  avatar,
  onPost,
}: {
  handle: string;
  avatar: string | null;
  onPost: (text: string) => Promise<string | null>;
}) {
  const [text, setText]       = useState('');
  const [posting, setPosting] = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const remaining = MAX_CHARS - text.length;

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setErr(null);
    const error = await onPost(trimmed);
    if (error) {
      setErr(error);
      setPosting(false);
    } else {
      setText('');
      setPosting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
  };

  return (
    <div className="mb-4">
      <div className="flex gap-3">
        {avatar ? (
          <img src={avatar} alt={handle} className="w-8 h-8 rounded-full shrink-0 ring-1 ring-nova-border object-cover mt-1" />
        ) : (
          <div className="w-8 h-8 rounded-full shrink-0 bg-nova-accent/20 flex items-center justify-center text-xs font-bold text-nova-accent ring-1 ring-nova-border mt-1">
            {handle.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className={clsx(
            'rounded-xl border transition-colors bg-nova-elevated',
            text ? 'border-nova-accent/40' : 'border-nova-border',
          )}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
              onKeyDown={onKeyDown}
              placeholder={`What do you think about this token, @${handle}?`}
              rows={2}
              className="w-full bg-transparent text-sm text-nova-text placeholder-nova-subtle resize-none outline-none px-3 pt-2.5 pb-1 leading-relaxed"
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <span className={clsx(
                'text-[11px] transition-colors',
                remaining < 50 ? 'text-loss' : remaining < 100 ? 'text-warn/80' : 'text-nova-subtle',
              )}>
                {remaining} left
              </span>
              <button
                onClick={submit}
                disabled={!text.trim() || posting}
                className={clsx(
                  'flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-all',
                  text.trim() && !posting
                    ? 'bg-nova-accent/15 text-nova-accent border border-nova-accent/30 hover:bg-nova-accent/25'
                    : 'text-nova-subtle border border-nova-border opacity-40 cursor-not-allowed',
                )}
              >
                {posting ? (
                  <span className="animate-pulse">Posting…</span>
                ) : (
                  <><Send size={11} /> Post <span className="hidden sm:inline opacity-60">(⌘↵)</span></>
                )}
              </button>
            </div>
          </div>
          {err && <p className="text-xs text-loss mt-1.5">{err}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────
export function CommentSection({ network, address, tokenSymbol }: {
  network: string;
  address: string;
  tokenSymbol?: string;
}) {
  const { user, loading: authLoading, signInWithX, signOut } = useAuth();
  const { comments, loading, postComment, deleteComment }    = useComments(network, address);

  if (!isSupabaseReady) return null;

  return (
    <div className="mt-6 rounded-xl border border-nova-border bg-nova-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-nova-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-nova-accent" />
          <span className="text-sm font-semibold text-nova-text">Community</span>
          {!loading && (
            <span className="text-[11px] text-nova-subtle bg-nova-elevated border border-nova-border rounded-full px-2 py-0.5">
              {comments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator label="live" />
          {user && !authLoading && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-nova-subtle hidden sm:block">@{user.handle}</span>
              <button
                onClick={signOut}
                className="text-nova-subtle hover:text-nova-muted transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {!authLoading && (
          user ? (
            <CommentForm
              handle={user.handle}
              avatar={user.avatar}
              onPost={text => postComment(text, user)}
            />
          ) : (
            <div className="flex items-center justify-between gap-4 mb-5 p-4 rounded-xl border border-nova-border/60 bg-nova-elevated/50">
              <div>
                <p className="text-sm font-medium text-nova-text">Join the discussion</p>
                <p className="text-xs text-nova-subtle mt-0.5">
                  Sign in with your X account to post about {tokenSymbol ? `$${tokenSymbol}` : 'this token'}.
                </p>
              </div>
              <button
                onClick={signInWithX}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-sm font-semibold transition-colors"
              >
                <Twitter size={14} />
                Sign in with X
              </button>
            </div>
          )
        )}

        {loading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-nova-elevated shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-nova-elevated rounded w-32" />
                  <div className="h-3 bg-nova-elevated rounded w-full" />
                  <div className="h-3 bg-nova-elevated rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare size={28} className="mx-auto mb-2 text-nova-subtle opacity-30" />
            <p className="text-sm text-nova-subtle">No comments yet.</p>
            <p className="text-xs text-nova-subtle opacity-60 mt-1">Be the first to share your thoughts.</p>
          </div>
        ) : (
          <div>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id}
                onDelete={deleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
