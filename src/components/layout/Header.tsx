import Image from "next/image";
import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/notifications";

// 홈/검색/내 피드/설정 4개 탭 화면에서 공통으로 쓰는 상단 헤더.
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (user) {
    const [{ data: profile }, count] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single(),
      getUnreadNotificationCount(user.id),
    ]);
    name = profile?.name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    unreadCount = count;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            <span className="text-xl font-extrabold text-indigo-600">MODOO</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/notifications"
              aria-label="알림"
              className="relative text-slate-600 transition hover:text-slate-900"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/profile/me"
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 transition hover:ring-2 hover:ring-slate-300"
            aria-label="내 피드"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              (name ?? user?.email ?? "?").slice(0, 1)
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
