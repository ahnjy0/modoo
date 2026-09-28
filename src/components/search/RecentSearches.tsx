"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import {
  clearRecentSearches,
  getRecentSearchesServerSnapshot,
  getRecentSearchesSnapshot,
  removeRecentSearch,
  subscribeRecentSearches,
} from "@/lib/recentSearches";

export default function RecentSearches() {
  const items = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    getRecentSearchesServerSnapshot
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-800">🕒 최근 검색어</h2>
        <button
          type="button"
          onClick={clearRecentSearches}
          className="text-[11px] text-slate-400 hover:text-slate-600"
        >
          전체삭제
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((term) => (
          <div
            key={term}
            className="flex items-center gap-1 rounded-full bg-slate-100 py-1.5 pl-3 pr-2 text-xs text-slate-600"
          >
            <Link href={`/search?q=${encodeURIComponent(term)}`} className="hover:text-slate-800">
              {term}
            </Link>
            <button
              type="button"
              onClick={() => removeRecentSearch(term)}
              aria-label={`${term} 삭제`}
              className="rounded-full p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
