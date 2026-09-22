import { createClient } from "@/lib/supabase/server";

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
  };
};

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
  } | null;
};

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, content, created_at,
       author:profiles!comments_author_id_fkey ( id, name, handle, avatar_url )`
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();

  if (error || !data) {
    return [];
  }

  return data
    .filter((row): row is CommentRow & { author: NonNullable<CommentRow["author"]> } =>
      row.author !== null
    )
    .map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      author: {
        id: row.author.id,
        name: row.author.name,
        handle: row.author.handle,
        avatarUrl: row.author.avatar_url,
      },
    }));
}
