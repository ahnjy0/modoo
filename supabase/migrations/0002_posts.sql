-- 2단계: 게시글 / 좋아요 / 북마크
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('디자인', 'AI 기술', '개발', '취미', '일상')),
  title text not null,
  content text not null,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  views int not null default 0,
  link_preview jsonb,
  tip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts_select_public"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = author_id);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "post_likes_select_public"
  on public.post_likes for select
  using (true);

create policy "post_likes_insert_own"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "post_likes_delete_own"
  on public.post_likes for delete
  using (auth.uid() = user_id);

create table if not exists public.post_bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_bookmarks enable row level security;

create policy "post_bookmarks_select_own"
  on public.post_bookmarks for select
  using (auth.uid() = user_id);

create policy "post_bookmarks_insert_own"
  on public.post_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "post_bookmarks_delete_own"
  on public.post_bookmarks for delete
  using (auth.uid() = user_id);
