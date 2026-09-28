// Supabase 공개 설정값(프로젝트 URL, publishable 키).
// 둘 다 브라우저 번들에 그대로 포함되는 공개값이라 코드에 기본값으로 둬도 된다. 데이터 보호는 RLS가 담당한다.
// Vercel이 빌드 시 이 변수들을 빈 문자열로 주입해 .env 파일 값까지 덮어쓰는 일이 있어서,
// 비어 있으면 기본값을 쓰도록 `||`로 처리한다(`??`는 빈 문자열을 걸러내지 못한다).
// process.env.NEXT_PUBLIC_*는 빌드 시 문자열로 치환되므로 반드시 이렇게 직접 참조해야 한다.
// 비밀키(SUPABASE_SERVICE_ROLE_KEY)는 절대 여기에 두지 말 것.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lcgjkpuwyounrwbszyjv.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KnFeWYNlqWf4QnbIUXK12g_TqbMr27M";
