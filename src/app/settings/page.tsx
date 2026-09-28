import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import { Header } from "@/components/layout/Header";
import ProfileForm from "@/components/settings/ProfileForm";
import NotificationPreferencesForm from "@/components/settings/NotificationPreferencesForm";
import DeleteAccountButton from "@/components/settings/DeleteAccountButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, handle, bio, avatar_url, push_enabled")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Header />
      <div className="flex flex-col items-center gap-6 px-4 py-10">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xs">
          <h2 className="text-left text-xs font-bold text-slate-800">👤 프로필 수정</h2>
          <p className="mb-3 text-left text-[11px] text-slate-400">
            닉네임, 핸들, 소개, 프로필 사진을 변경할 수 있어요.
          </p>
          <ProfileForm
            initialName={profile?.name ?? ""}
            initialHandle={profile?.handle ?? ""}
            initialBio={profile?.bio ?? ""}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
        </div>

        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800">🔔 푸시 알림 설정</h2>
          <p className="mb-3 text-[11px] text-slate-400">
            새 좋아요, 댓글, 팔로워 알림을 푸시로 받을지 선택하세요.
          </p>
          <NotificationPreferencesForm initialPushEnabled={profile?.push_enabled ?? true} />
        </div>

        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xs">
          <p className="mb-3 text-xs text-slate-400">{user.email}</p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              로그아웃
            </button>
          </form>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  );
}
