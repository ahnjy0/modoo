-- 7단계: 차단한 사용자
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "blocked_users_select_own"
  on public.blocked_users for select
  using (auth.uid() = blocker_id);

create policy "blocked_users_insert_own"
  on public.blocked_users for insert
  with check (auth.uid() = blocker_id);

create policy "blocked_users_delete_own"
  on public.blocked_users for delete
  using (auth.uid() = blocker_id);
