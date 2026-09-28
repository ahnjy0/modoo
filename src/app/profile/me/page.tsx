import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/post/PostCard";
import { getFeedPosts } from "@/lib/posts";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, handle")
    .eq("id", user.id)
    .single();

  const posts = await getFeedPosts({ authorId: user.id });
  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />
      <div className="border-b border-slate-100 bg-white px-4 py-6 text-center">
        <h1 className="text-sm font-bold text-slate-800">
          {profile?.name ?? user.email}님의 내 피드
        </h1>
        <div className="mx-auto mt-4 grid max-w-xs sm:max-w-sm lg:max-w-md grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 py-3">
            <p className="text-sm font-bold text-slate-800">{posts.length}</p>
            <p className="mt-0.5 text-[12px] text-slate-600">내가 쓴 글</p>
          </div>
          <div className="rounded-xl bg-rose-50 py-3">
            <p className="text-sm font-bold text-rose-600">{totalLikes}</p>
            <p className="mt-0.5 text-[12px] text-rose-600">받은 좋아요</p>
          </div>
          <div className="rounded-xl bg-indigo-50 py-3">
            <p className="text-sm font-bold text-indigo-600">{totalComments}</p>
            <p className="mt-0.5 text-[12px] text-indigo-600">총 댓글</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-lg grid-cols-1 gap-3.5 px-4 pt-3 sm:max-w-2xl lg:max-w-4xl lg:grid-cols-2 xl:max-w-6xl xl:grid-cols-3">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs lg:col-span-2 xl:col-span-3">
            <h4 className="text-sm font-bold text-slate-800">아직 작성한 글이 없습니다</h4>
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
