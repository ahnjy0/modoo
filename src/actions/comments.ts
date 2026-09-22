"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CommentFormState = { error: string | null };

export async function createComment(
  postId: string,
  _prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const content = String(formData.get("content") ?? "").trim();

  if (!content) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, content });

  if (error) {
    return { error: `댓글 등록에 실패했습니다: ${error.message}` };
  }

  revalidatePath(`/posts/${postId}`);
  return { error: null };
}

export async function deleteComment(postId: string, commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("comments").delete().eq("id", commentId).eq("author_id", user.id);

  revalidatePath(`/posts/${postId}`);
}
