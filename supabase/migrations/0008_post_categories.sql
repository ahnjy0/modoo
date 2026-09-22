-- 8단계: 게시글 카테고리 목록 변경 (일상/정보공유/질문·답변/취미·모임/라이프 -> 디자인/AI 기술/개발/취미/일상)
-- Supabase 대시보드 > SQL Editor에 전체 복사해서 실행하세요.
-- 옛 카테고리로 저장된 글은 테스트/목업 데이터로 보고 삭제합니다.
-- 실제 사용자 글을 남겨야 한다면 이 delete 대신 새 카테고리로 UPDATE하는 문장으로 바꿔서 실행하세요.

delete from public.posts
where category not in ('디자인', 'AI 기술', '개발', '취미', '일상');

alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('디자인', 'AI 기술', '개발', '취미', '일상'));
