"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/actions/auth";

const initialState: DeleteAccountState = { error: null };

export default function DeleteAccountButton() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const confirmed = window.confirm(
          "정말 탈퇴하시겠어요? 작성한 글, 댓글 등 모든 데이터가 삭제되며 되돌릴 수 없습니다."
        );
        if (!confirmed) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-rose-50 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
      >
        {pending ? "탈퇴 처리 중..." : "회원탈퇴"}
      </button>
      {state.error && (
        <p className="mt-2 text-xs font-medium text-rose-600">{state.error}</p>
      )}
    </form>
  );
}
