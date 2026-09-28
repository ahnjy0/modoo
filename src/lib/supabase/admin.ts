import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키를 사용하는 관리자 클라이언트.
// RLS를 우회하므로 회원탈퇴 같은 서버 전용 작업(Server Action, Route Handler)에서만 사용하고
// 절대 클라이언트 컴포넌트나 NEXT_PUBLIC_* 환경변수로 노출하지 말 것.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
