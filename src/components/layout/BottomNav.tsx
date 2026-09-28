"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Search, User, Settings } from "lucide-react";

const TABS = [
  { href: "/feed", label: "홈", icon: Layers },
  { href: "/search", label: "검색", icon: Search },
  { href: "/profile/me", label: "내 피드", icon: User },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

// 글쓰기 / 수정 / 로그인 / 회원가입 화면에서는 하단 탭바를 숨긴다.
const HIDDEN_PREFIXES = ["/auth", "/posts/new"];

export function BottomNav() {
  const pathname = usePathname();

  if (
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.endsWith("/edit")
  ) {
    return null;
  }

  return (
    <nav className="sticky bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center justify-around">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/feed" && pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
                isActive ? "font-semibold text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[11px] tracking-tight">{tab.label}</span>
              {isActive && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
