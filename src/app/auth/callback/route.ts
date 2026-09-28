import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 이메일 확인 링크(가입 확인, 비밀번호 재설정)가 도착하는 엔드포인트.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirm_failed`);
}
