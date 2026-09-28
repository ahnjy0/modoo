"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string | null; message?: string | null };

const HANDLE_PATTERN = /^@[a-z0-9_]{2,20}$/i;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const rawHandle = String(formData.get("handle") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (name.length < 2) {
    return { error: "닉네임은 최소 2글자 이상 입력해주세요." };
  }

  const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
  if (!HANDLE_PATTERN.test(handle)) {
    return { error: "핸들은 @으로 시작하는 영문/숫자/밑줄 2~20자여야 합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      handle,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 핸들입니다." };
    }
    return { error: `프로필 수정에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/profile/me");
  return { error: null, message: "프로필이 저장되었습니다." };
}

export type NotificationPreferencesState = { error: string | null };

export async function updateNotificationPreferences(
  _prevState: NotificationPreferencesState,
  formData: FormData
): Promise<NotificationPreferencesState> {
  const pushEnabled = formData.get("pushEnabled") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      push_enabled: pushEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: `알림 설정 저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/settings");
  return { error: null };
}
