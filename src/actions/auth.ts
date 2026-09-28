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

  // 개발 단계 임시 조치: supabase.auth.signUp()은 "Confirm email" 설정이 켜져 있으면
  // 호출 시점에 확인 메일을 먼저 발송해서, 기본 메일러의 낮은 발송 한도(rate limit)에 금방 걸린다.
  // 그래서 admin API로 이미 이메일 확인된 계정을 직접 만들어 메일 발송 자체를 건너뛰고 바로 로그인시킨다.
  // TODO: 실서비스 오픈 전 반드시 제거하고 supabase.auth.signUp() 기반의 정식 이메일 확인 플로우로 되돌릴 것.
  //       (그때는 signUp이 이미 가입된 이메일에 에러 대신 identities: []인 가짜 user를 돌려주는
  //        anti-enumeration 동작도 다시 처리해야 한다.)
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError) {
    if (createError.code === "email_exists" || createError.code === "user_already_exists") {
      return { error: "이미 가입된 이메일입니다. 로그인해주세요." };
    }
    return { error: describeSignupError(createError.message) };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return {
      error: null,
      message: "가입이 완료되었습니다. 로그인 페이지에서 다시 로그인해주세요.",
    };
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
