-- 4단계: 댓글 / 댓글 좋아요
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments_select_public"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = author_id);

create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

create policy "comment_likes_select_public"
  on public.comment_likes for select
  using (true);

create policy "comment_likes_insert_own"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

create policy "comment_likes_delete_own"
  on public.comment_likes for delete
  using (auth.uid() = user_id);
