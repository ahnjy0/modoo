-- 10단계: 푸시 알림 선호도 설정
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.
-- 실제 브라우저 푸시 발송(서비스워커/VAPID)은 포함하지 않고, 사용자 선호도만 저장한다.

alter table public.profiles
  add column if not exists push_enabled boolean not null default true;
