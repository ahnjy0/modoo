import { createClient } from "@/lib/supabase/server";

export type NotificationType = "like" | "comment" | "follow" | "system" | "mention";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
};

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, type, title, message, post_id, is_read, created_at,
       actor:profiles!notifications_actor_id_fkey ( id, name, avatar_url )`
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<NotificationRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    postId: row.post_id,
    isRead: row.is_read,
    createdAt: row.created_at,
    actor: row.actor
      ? { id: row.actor.id, name: row.actor.name, avatarUrl: row.actor.avatar_url }
      : null,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}
