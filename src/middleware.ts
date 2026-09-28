import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/callback"];
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/signup"];

// TODO: 임시 진단용 — 프로덕션 MIDDLEWARE_INVOCATION_FAILED 원인 확인 후 제거할 것.
// 실패 시 에러 메시지와 NEXT_PUBLIC_* 값의 "형태"(존재 여부/앞부분/따옴표·공백 포함 여부)만 헤더로 노출한다.
// NEXT_PUBLIC_* 값은 원래 브라우저 번들에 포함되는 공개값이며, 비밀키는 다루지 않는다.
function describeEnv(value: string | undefined) {
  if (value === undefined) return "undefined";
  return JSON.stringify({
    len: value.length,
    head: value.slice(0, 14),
    quoted: /^["']|["']$/.test(value),
    space: /^\s|\s$/.test(value),
  });
}

export async function middleware(request: NextRequest) {
  try {
    return await runMiddleware(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[middleware] failed:", error);
    return new NextResponse("middleware error (diagnostic)", {
      status: 500,
      headers: {
        "x-mw-error": encodeURIComponent(message.slice(0, 300)),
        "x-mw-env-url": encodeURIComponent(describeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)),
        "x-mw-env-key": encodeURIComponent(describeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)),
      },
    });
  }
}

async function runMiddleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()가 토큰을 검증하면서 만료된 세션을 갱신한다 (getSession()은 검증 없이 캐시만 읽음).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isGuestOnlyPath = GUEST_ONLY_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isGuestOnlyPath) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
