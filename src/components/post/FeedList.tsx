"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadMoreFeedPosts } from "@/actions/posts";
import type { FeedPost } from "@/lib/posts";
import type { PostCategory } from "@/lib/categories";
import { PostCard } from "@/components/post/PostCard";

export function FeedList({
  initialPosts,
  initialHasMore,
  category,
}: {
  initialPosts: FeedPost[];
  initialHasMore: boolean;
  category?: PostCategory;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { posts: nextPosts, hasMore: nextHasMore } = await loadMoreFeedPosts(
        posts.length,
        category
      );
      setPosts((prev) => [...prev, ...nextPosts]);
      setHasMore(nextHasMore);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [posts.length, hasMore, category]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs lg:col-span-2 xl:col-span-3">
        <h4 className="text-sm font-bold text-slate-800">
          {category ? `'${category}' 카테고리에 글이 없습니다` : "아직 작성된 글이 없습니다"}
        </h4>
        <p className="mt-1 text-xs text-slate-400">
          첫 번째 글을 작성해서 커뮤니티를 시작해보세요!
        </p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="col-span-full flex items-center justify-center py-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중...
            </div>
          )}
        </div>
      )}
    </>
  );
}
