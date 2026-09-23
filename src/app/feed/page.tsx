import Link from "next/link";
import { Pencil } from "lucide-react";
import { getFeedPosts, FEED_PAGE_SIZE } from "@/lib/posts";
import { FEED_FILTERS, POST_CATEGORIES, type PostCategory } from "@/lib/categories";
import { FeedList } from "@/components/post/FeedList";
import { Header } from "@/components/layout/Header";

function isPostCategory(value: string): value is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(value);
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category = rawCategory && isPostCategory(rawCategory) ? rawCategory : undefined;

  const fetchedPosts = await getFeedPosts({ category, limit: FEED_PAGE_SIZE + 1 });
  const hasMore = fetchedPosts.length > FEED_PAGE_SIZE;
  const posts = fetchedPosts.slice(0, FEED_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />

      <div className="sticky top-[57px] z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="no-scrollbar mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
          {FEED_FILTERS.map((filter) => {
            const isActive = filter === "전체" ? !category : category === filter;
            const href =
              filter === "전체" ? "/feed" : `/feed?category=${encodeURIComponent(filter)}`;
            return (
              <Link
                key={filter}
                href={href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto grid max-w-lg grid-cols-1 gap-3.5 px-4 pt-3 sm:max-w-2xl lg:max-w-4xl lg:grid-cols-2 xl:max-w-6xl xl:grid-cols-3">
        <FeedList
          key={category ?? "all"}
          initialPosts={posts}
          initialHasMore={hasMore}
          category={category}
        />
      </div>

      <Link
        href="/posts/new"
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:bg-indigo-700 active:scale-95"
      >
        <Pencil className="h-4 w-4" />
        글쓰기
      </Link>
    </div>
  );
}
