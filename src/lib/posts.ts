import { createClient } from "@/lib/supabase/server";
import type { PostCategory } from "@/lib/categories";

export type FeedPost = {
  id: string;
  category: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  views: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
    badgeTitle: string | null;
    isCertified: boolean;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

type PostRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  views: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    badge_title: string | null;
    is_certified: boolean;
  } | null;
  post_likes: { count: number }[];
  comments: { count: number }[];
};

function escapeIlikeQuery(raw: string): string {
  return raw.replace(/[%_,()]/g, "");
}

async function attachViewerState(
  postIds: string[],
  userId: string | null
): Promise<{ likedSet: Set<string>; bookmarkedSet: Set<string> }> {
  if (!userId || postIds.length === 0) {
    return { likedSet: new Set(), bookmarkedSet: new Set() };
  }

  const supabase = await createClient();
  const [{ data: liked }, { data: bookmarked }] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds),
    // RLS already scopes post_bookmarks to the current user.
    supabase.from("post_bookmarks").select("post_id").in("post_id", postIds),
  ]);

  return {
    likedSet: new Set((liked ?? []).map((row) => row.post_id as string)),
    bookmarkedSet: new Set((bookmarked ?? []).map((row) => row.post_id as string)),
  };
}

export async function getFeedPosts(options?: {
  category?: PostCategory;
  authorId?: string;
  query?: string;
}): Promise<FeedPost[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(
      `id, category, title, content, images, tags, views, created_at,
       author:profiles!posts_author_id_fkey ( id, name, handle, avatar_url, badge_title, is_certified ),
       post_likes(count), comments(count)`
    )
    .order("created_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.authorId) {
    query = query.eq("author_id", options.authorId);
  }

  const searchTerm = escapeIlikeQuery(options?.query?.trim() ?? "");
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query.returns<PostRow[]>();

  if (error || !data) {
    console.error("getFeedPosts error:", error);
    return [];
  }

  const { likedSet, bookmarkedSet } = await attachViewerState(
    data.map((row) => row.id),
    user?.id ?? null
  );

  return data
    .filter((row): row is PostRow & { author: NonNullable<PostRow["author"]> } =>
      row.author !== null
    )
    .map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      images: row.images ?? [],
      tags: row.tags ?? [],
      views: row.views,
      createdAt: row.created_at,
      author: {
        id: row.author.id,
        name: row.author.name,
        handle: row.author.handle,
        avatarUrl: row.author.avatar_url,
        badgeTitle: row.author.badge_title,
        isCertified: row.author.is_certified,
      },
      likesCount: row.post_likes?.[0]?.count ?? 0,
      commentsCount: row.comments?.[0]?.count ?? 0,
      isLiked: likedSet.has(row.id),
      isBookmarked: bookmarkedSet.has(row.id),
    }));
}

export async function getPostById(postId: string): Promise<FeedPost | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, category, title, content, images, tags, views, created_at,
       author:profiles!posts_author_id_fkey ( id, name, handle, avatar_url, badge_title, is_certified ),
       post_likes(count), comments(count)`
    )
    .eq("id", postId)
    .maybeSingle<PostRow>();

  if (error || !data || !data.author) {
    return null;
  }

  const { likedSet, bookmarkedSet } = await attachViewerState([data.id], user?.id ?? null);

  return {
    id: data.id,
    category: data.category,
    title: data.title,
    content: data.content,
    images: data.images ?? [],
    tags: data.tags ?? [],
    views: data.views,
    createdAt: data.created_at,
    author: {
      id: data.author.id,
      name: data.author.name,
      handle: data.author.handle,
      avatarUrl: data.author.avatar_url,
      badgeTitle: data.author.badge_title,
      isCertified: data.author.is_certified,
    },
    likesCount: data.post_likes?.[0]?.count ?? 0,
    commentsCount: data.comments?.[0]?.count ?? 0,
    isLiked: likedSet.has(data.id),
    isBookmarked: bookmarkedSet.has(data.id),
  };
}

export async function getPopularTags(limit = 8): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("tags")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}
