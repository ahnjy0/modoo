import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import { postImagePathFromUrl } from "@/lib/storage";
import { updatePost } from "@/actions/posts";
import PostForm from "@/components/post/PostForm";

export default async function EditPostPage({
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

  if (!user) {
    redirect("/auth/login");
  }
  if (user.id !== post.author.id) {
    redirect(`/posts/${postId}`);
  }

  return (
    <PostForm
      action={updatePost.bind(null, postId)}
      headerLabel="게시글 수정"
      backHref={`/posts/${postId}`}
      submitLabel="수정 완료"
      pendingLabel="수정 중..."
      initialCategory={post.category}
      initialTitle={post.title}
      initialContent={post.content}
      initialTags={post.tags.join(" ")}
      initialImages={post.images.map((url) => ({
        url,
        path: postImagePathFromUrl(url) ?? url,
      }))}
    />
  );
}
