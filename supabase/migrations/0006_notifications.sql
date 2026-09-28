-- 6단계: 알림 + 좋아요/댓글/팔로우 발생 시 자동 생성 트리거
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'system', 'mention')),
  title text not null,
  message text not null,
  actor_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = recipient_id);

-- insert 정책을 의도적으로 두지 않음: 클라이언트는 알림을 직접 생성할 수 없고
-- 아래 트리거 또는 service_role 클라이언트에서만 생성 가능.

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- 게시글 좋아요 -> 게시글 작성자에게 알림
create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id from public.posts where id = new.post_id;

  if v_author_id is not null and v_author_id <> new.user_id then
    insert into public.notifications (recipient_id, type, title, message, actor_id, post_id)
    values (v_author_id, 'like', '새 좋아요', '회원님의 게시글에 좋아요를 눌렀습니다.', new.user_id, new.post_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_post_like_created on public.post_likes;
create trigger on_post_like_created
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

-- 댓글 작성 -> 게시글 작성자에게 알림
create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id from public.posts where id = new.post_id;

  if v_author_id is not null and v_author_id <> new.author_id then
    insert into public.notifications (recipient_id, type, title, message, actor_id, post_id)
    values (v_author_id, 'comment', '새 댓글', '회원님의 게시글에 댓글을 남겼습니다.', new.author_id, new.post_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.notify_post_comment();

-- 팔로우 -> 대상에게 알림
create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, type, title, message, actor_id)
  values (new.following_id, 'follow', '새 팔로워', '회원님을 팔로우하기 시작했습니다.', new.follower_id);

  return new;
end;
$$;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.notify_new_follower();
