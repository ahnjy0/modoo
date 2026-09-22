import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Bell as BellIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, type NotificationType } from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/format";
import { markAllNotificationsRead, deleteNotification } from "@/actions/notifications";

const TYPE_ICON: Record<NotificationType, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  system: BellIcon,
  mention: BellIcon,
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const notifications = await getNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
            <span className="text-sm font-semibold text-slate-900">알림</span>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="rounded-full px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                모두 읽음
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-4xl px-4 pt-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
            <h4 className="text-sm font-bold text-slate-800">아직 알림이 없어요</h4>
            <p className="mt-1 text-xs text-slate-400">
              좋아요, 댓글, 팔로우 소식을 여기서 확인할 수 있어요.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => {
              const Icon = TYPE_ICON[notification.type];
              const content = (
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                    notification.isRead
                      ? "border-slate-100 bg-white"
                      : "border-indigo-100 bg-indigo-50/50"
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-indigo-50 ring-1 ring-slate-100">
                    {notification.actor?.avatarUrl ? (
                      <Image
                        src={notification.actor.avatarUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-indigo-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-bold">{notification.actor?.name ?? notification.title}</span>
                      {" "}
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={notification.id} className="relative">
                  {notification.postId ? (
                    <Link href={`/posts/${notification.postId}`} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                  <form
                    action={deleteNotification.bind(null, notification.id)}
                    className="absolute right-2 top-2"
                  >
                    <button
                      type="submit"
                      aria-label="알림 삭제"
                      className="rounded-full p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
