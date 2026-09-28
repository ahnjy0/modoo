import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버 컴포넌트 / Server Action / Route Handler 전용.
// 서버 컴포넌트에서는 쿠키를 쓸 수 없어 setAll이 실패할 수 있는데,
// 세션 갱신은 middleware.ts가 담당하므로 무시해도 안전하다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 — middleware가 세션을 갱신하므로 무시
          }
        },
      },
    }
  );
}
