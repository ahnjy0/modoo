"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { error: null };

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const toggleAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeService(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const toggleOne = (
    setter: (v: boolean) => void,
    current: boolean,
    others: boolean[]
  ) => {
    const next = !current;
    setter(next);
    setAgreeAll(next && others.every(Boolean));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="mb-5">
          <Link
            href="/auth/login"
            className="mb-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
          >
            ‹ 새로운 만남의 시작
          </Link>
          <h1 className="text-xl font-black text-slate-900">MODOO 시작하기</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            간단한 정보 입력으로 커뮤니티에 참여해보세요
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            <span className="text-rose-500">*</span> 표시는 필수 입력 항목입니다
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-3.5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-bold text-slate-800">
              닉네임 <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={20}
              placeholder="닉네임을 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-800">
              이메일 <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@modoo.com"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-800">
              비밀번호 <span className="text-rose-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="8자 이상 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="mb-1 block text-xs font-bold text-slate-800"
            >
              비밀번호 확인 <span className="text-rose-500">*</span>
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
            <label className="flex cursor-pointer items-center gap-2 border-b border-indigo-100 pb-2 text-xs font-bold text-slate-900">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => toggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              전체 동의하기
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                name="agreeService"
                checked={agreeService}
                onChange={() =>
                  toggleOne(setAgreeService, agreeService, [agreePrivacy, agreeMarketing])
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              [필수] 서비스 이용약관 동의
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={agreePrivacy}
                onChange={() =>
                  toggleOne(setAgreePrivacy, agreePrivacy, [agreeService, agreeMarketing])
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              [필수] 개인정보 수집 및 이용 동의
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                name="agreeMarketing"
                checked={agreeMarketing}
                onChange={() =>
                  toggleOne(setAgreeMarketing, agreeMarketing, [agreeService, agreePrivacy])
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              [선택] 마케팅 정보 수신 동의
            </label>
          </div>

          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {state.error}
            </p>
          )}
          {state.message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "가입 중..." : "회원가입 완료"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="font-bold text-indigo-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
