import Link from "next/link";
import { Search, X } from "lucide-react";
import { getFeedPosts, getPopularTags } from "@/lib/posts";
import { PostCard } from "@/components/post/PostCard";
import { Header } from "@/components/layout/Header";
import RecentSearches from "@/components/search/RecentSearches";
import SaveRecentSearch from "@/components/search/SaveRecentSearch";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim() ?? "";
  const posts = query ? await getFeedPosts({ query }) : [];
  const popularTags = query ? [] : await getPopularTags();

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />

      <div className="sticky top-[57px] z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <form action="/search" method="GET" className="mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center gap-2 px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              type="text"
              defaultValue={query}
              placeholder="제목, 내용으로 검색"
              className="peer w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
            <Link
              href="/search"
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 flex -translate-y-1/2 text-slate-400 transition hover:text-slate-600 peer-placeholder-shown:hidden"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            <Search className="h-4 w-4" />
            검색
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl space-y-3.5 px-4 pt-3">
        {query && <SaveRecentSearch query={query} />}
        {!query ? (
          <>
            <RecentSearches />

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-bold text-slate-800">🔥 인기 키워드</h2>
              {popularTags.length === 0 ? (
                <p className="text-xs text-slate-400">아직 인기 키워드가 없어요.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
            <h4 className="text-sm font-bold text-slate-800">
              &apos;{query}&apos;에 대한 검색 결과가 없습니다
            </h4>
            <p className="mt-1 text-xs text-slate-400">다른 검색어로 다시 시도해보세요.</p>
          </div>
        ) : (
          <>
            <p className="text-base font-bold text-slate-800">
              &apos;{query}&apos; 검색 결과 {posts.length}건
            </p>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
