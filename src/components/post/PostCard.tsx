import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { toggleLike, toggleBookmark } from "@/actions/posts";
import { formatRelativeTime } from "@/lib/format";
import type { FeedPost } from "@/lib/posts";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-sm font-bold text-indigo-600">
                {post.author.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900">
                {post.author.name}
              </span>
              {post.author.badgeTitle && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {post.author.badgeTitle}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <Link href={`/posts/${post.id}`} className="block">
        <span className="mb-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {post.category}
        </span>
        <h3 className="mb-1.5 text-base font-bold leading-snug text-slate-900">
          {post.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {post.content}
        </p>
      </Link>

      {post.images.length > 0 && (
        <Link
          href={`/posts/${post.id}`}
          className="relative mb-3.5 block aspect-[16/10] overflow-hidden rounded-xl bg-slate-100"
        >
          <Image
            src={post.images[0]}
            alt={post.title}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </Link>
      )}

      {post.tags.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <form action={toggleLike.bind(null, post.id)}>
            <button
              type="submit"
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 transition hover:bg-rose-50 ${
                post.isLiked ? "font-semibold text-rose-500" : "hover:text-rose-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-rose-500 stroke-rose-500" : ""}`} />
              <span>{post.likesCount}</span>
            </button>
          </form>

          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentsCount}</span>
          </Link>
        </div>

        <form action={toggleBookmark.bind(null, post.id)}>
          <button
            type="submit"
            className={`rounded-md p-1.5 transition hover:bg-slate-100 ${
              post.isBookmarked ? "text-indigo-600" : "hover:text-indigo-600"
            }`}
            aria-label="북마크"
          >
            <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-indigo-600 stroke-indigo-600" : ""}`} />
          </button>
        </form>
      </div>
    </article>
  );
}
