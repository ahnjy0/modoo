import Link from "next/link";
import { Pencil } from "lucide-react";
import { getFeedPosts } from "@/lib/posts";
import { FEED_FILTERS, POST_CATEGORIES, type PostCategory } from "@/lib/categories";
import { PostCard } from "@/components/post/PostCard";
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

  const posts = await getFeedPosts({ category });

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
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs lg:col-span-2 xl:col-span-3">
            <h4 className="text-sm font-bold text-slate-800">
              {category ? `'${category}' 카테고리에 글이 없습니다` : "아직 작성된 글이 없습니다"}
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              첫 번째 글을 작성해서 커뮤니티를 시작해보세요!
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
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
