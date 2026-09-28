"use client";

import { useSyncExternalStore } from "react";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "@/lib/theme";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-left">
      <label className="flex items-center justify-between py-2.5">
        <span className="text-sm text-slate-700">다크 모드</span>
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            type="checkbox"
            role="switch"
            checked={theme === "dark"}
            onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            className="peer sr-only"
          />
          {/* 스위치 모양은 checked 상태가 아니라 dark: 변형으로 그린다 — 서버 HTML은 항상 라이트 기준이라
              checked로 그리면 하이드레이션 전까지 손잡이가 반대쪽에 보이기 때문. */}
          <span className="absolute inset-0 rounded-full bg-slate-200 transition dark:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition dark:translate-x-4" />
        </span>
      </label>
    </div>
  );
}
