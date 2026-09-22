"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { login, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
            <MessageCircle className="h-8 w-8" fill="currentColor" strokeWidth={0} />
          </div>
          <span className="mb-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            모두의 이야기
          </span>
          <h1 className="text-2xl font-black tracking-tight text-indigo-600">
            MODOO
          </h1>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-bold text-slate-800"
            >
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@modoo.app"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-bold text-slate-800"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-indigo-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/auth/signup"
            className="font-bold text-indigo-600 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
