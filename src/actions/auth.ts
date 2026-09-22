"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthFormState = {
  error: string | null;
  message?: string | null;
};

function describeSignupError(message: string): string {
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (message.includes("rate limit")) {
    return "이메일 발송 요청이 너무 많습니다. 잠시 후(약 1시간 뒤) 다시 시도해주세요.";
  }
  if (message.toLowerCase().includes("invalid") && message.toLowerCase().includes("email")) {
    return "유효하지 않은 이메일 주소입니다.";
  }
  if (message.toLowerCase().includes("password")) {
    return "비밀번호 형식을 확인해주세요 (8자 이상).";
  }
  return `가입 중 오류가 발생했습니다: ${message}`;
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const agreeService = formData.get("agreeService") === "on";
  const agreePrivacy = formData.get("agreePrivacy") === "on";

  if (!name || name.length < 2) {
    return { error: "닉네임은 최소 2글자 이상 입력해주세요." };
  }
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }
  if (!agreeService || !agreePrivacy) {
    return { error: "필수 약관(서비스 이용약관, 개인정보 수집·이용)에 동의해주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: describeSignupError(error.message) };
  }

  // Supabase는 이미 가입된(확인 완료) 이메일로 재가입을 시도하면 계정 존재 여부를
  // 노출하지 않기 위해 에러 대신 실제로 존재하지 않는 가짜 user를 담아 성공 응답을 준다.
  // identities가 빈 배열이면 이 케이스이므로 별도로 걸러낸다.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "이미 가입된 이메일입니다. 로그인해주세요." };
  }

  // 개발 단계 임시 조치: Supabase 프로젝트의 "Confirm email" 대시보드 설정과 무관하게
  // 이메일 발송 없이 즉시 계정을 활성화하고 로그인시킨다.
  // TODO: 실서비스 오픈 전 반드시 제거하고 정식 이메일 확인 플로우로 되돌릴 것.
  if (!data.session && data.user) {
    const admin = createAdminClient();
    const { error: confirmError } = await admin.auth.admin.updateUserById(data.user.id, {
      email_confirm: true,
    });

    if (confirmError) {
      return { error: `계정 활성화에 실패했습니다: ${confirmError.message}` };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return {
        error: null,
        message: "가입이 완료되었습니다. 로그인 페이지에서 다시 로그인해주세요.",
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export type DeleteAccountState = { error: string | null };

export async function deleteAccount(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState 시그니처를 맞추기 위한 자리표시자
  _prevState: DeleteAccountState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState 시그니처를 맞추기 위한 자리표시자
  _formData: FormData
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: `계정 삭제에 실패했습니다: ${error.message}` };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
