"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { POST_CATEGORIES, type PostCategory } from "@/lib/categories";

export type CreatePostState = { error: string | null };

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "");
  const images = formData
    .getAll("images")
    .map((value) => String(value))
    .filter(Boolean);

  if (!POST_CATEGORIES.includes(category as PostCategory)) {
    return { error: "카테고리를 선택해주세요." };
  }
  if (!title || !content) {
    return { error: "제목과 본문을 입력해주세요." };
  }

  const tags = rawTags
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      category,
      title,
      content,
      tags,
      images,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { error: `게시글 등록에 실패했습니다: ${error?.message ?? "알 수 없는 오류"}` };
  }

  revalidatePath("/feed");
  redirect("/feed");
}

export async function updatePost(
  postId: string,
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "");
  const images = formData
    .getAll("images")
    .map((value) => String(value))
    .filter(Boolean);

  if (!POST_CATEGORIES.includes(category as PostCategory)) {
    return { error: "카테고리를 선택해주세요." };
  }
  if (!title || !content) {
    return { error: "제목과 본문을 입력해주세요." };
  }

  const tags = rawTags
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      category,
      title,
      content,
      tags,
      images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id)
    .select("id")
    .single();

  if (error || !post) {
    return { error: `게시글 수정에 실패했습니다: ${error?.message ?? "알 수 없는 오류"}` };
  }

  revalidatePath("/feed");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/feed");
  revalidatePath(`/posts/${postId}`);
}

export async function toggleBookmark(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: existing } = await supabase
    .from("post_bookmarks")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/feed");
  revalidatePath(`/posts/${postId}`);
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);

  revalidatePath("/feed");
  redirect("/feed");
}
