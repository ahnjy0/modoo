import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Bookmark, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import { getCommentsByPostId } from "@/lib/comments";
import { formatRelativeTime } from "@/lib/format";
import { toggleLike, toggleBookmark, deletePost } from "@/actions/posts";
import { deleteComment } from "@/actions/comments";
import CommentForm from "@/components/post/CommentForm";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === post.author.id;
  const comments = await getCommentsByPostId(postId);

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-semibold text-slate-900">게시글 상세</span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <Link
                href={`/posts/${post.id}/edit`}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" />
                수정
              </Link>
              <form action={deletePost.bind(null, post.id)}>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-4xl px-4 pt-3">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-base font-bold text-indigo-600">
                {post.author.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900">{post.author.name}</span>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatRelativeTime(post.createdAt)} · 조회 {post.views}
            </p>
          </div>
        </div>

        <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {post.category}
        </span>

        <h1 className="mb-3.5 text-xl font-bold leading-snug text-slate-900">
          {post.title}
        </h1>

        <p className="mb-5 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
          {post.content}
        </p>

        {post.images.length > 0 && (
          <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
            <Image
              src={post.images[0]}
              alt={post.title}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-cover"
            />
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-y border-slate-100 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-5">
            <form action={toggleLike.bind(null, post.id)}>
              <button
                type="submit"
                className={`flex items-center gap-1.5 font-medium transition ${
                  post.isLiked ? "text-rose-500" : "hover:text-rose-500"
                }`}
              >
                <Heart className={`h-5 w-5 ${post.isLiked ? "fill-rose-500 stroke-rose-500" : ""}`} />
                <span>{post.likesCount}</span>
              </button>
            </form>
            <span className="flex items-center gap-1.5 text-slate-400">
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length}</span>
            </span>
          </div>

          <form action={toggleBookmark.bind(null, post.id)}>
            <button
              type="submit"
              className={`rounded-full p-1.5 transition hover:bg-slate-100 ${
                post.isBookmarked ? "text-indigo-600" : "hover:text-indigo-600"
              }`}
              aria-label="북마크"
            >
              <Bookmark
                className={`h-5 w-5 ${post.isBookmarked ? "fill-indigo-600 stroke-indigo-600" : ""}`}
              />
            </button>
          </form>
        </div>

        <div className="py-4">
          <h2 className="mb-3 text-sm font-bold text-slate-800">댓글 {comments.length}</h2>

          {comments.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">첫 댓글을 남겨보세요.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="flex items-start gap-2.5">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
                    {comment.author.avatarUrl ? (
                      <Image
                        src={comment.author.avatarUrl}
                        alt={comment.author.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-xs font-bold text-indigo-600">
                        {comment.author.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {comment.author.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      {user?.id === comment.author.id && (
                        <form action={deleteComment.bind(null, postId, comment.id)}>
                          <button
                            type="submit"
                            aria-label="댓글 삭제"
                            className="rounded-full p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">
                      {comment.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {user ? (
            <CommentForm postId={postId} />
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              <Link href="/auth/login" className="font-semibold text-indigo-600">
                로그인
              </Link>
              하면 댓글을 남길 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
