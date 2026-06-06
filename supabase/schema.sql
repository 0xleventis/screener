-- ─────────────────────────────────────────────────────────────────────────────
-- Base Scope — Token Comments
-- Run this once in your Supabase project: SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists token_comments (
  id             uuid        primary key default gen_random_uuid(),
  token_network  text        not null,
  token_address  text        not null,
  user_id        uuid        not null references auth.users (id) on delete cascade,
  display_name   text        not null,
  twitter_handle text,
  twitter_avatar text,
  content        text        not null check (char_length(content) between 1 and 500),
  created_at     timestamptz not null default now()
);

create index if not exists token_comments_token_idx
  on token_comments (token_network, token_address, created_at desc);

alter table token_comments enable row level security;

create policy "public read"
  on token_comments for select using (true);

create policy "authenticated insert"
  on token_comments for insert
  with check (auth.uid() = user_id);

create policy "owner delete"
  on token_comments for delete
  using (auth.uid() = user_id);
