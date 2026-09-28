"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { createComment, type CommentFormState } from "@/actions/comments";

const initialState: CommentFormState = { error: null };

export default function CommentForm({ postId }: { postId: string }) {
  const action = createComment.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <div className="flex items-center gap-2">
        <input
          name="content"
          type="text"
          required
          placeholder="댓글을 입력하세요"
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="댓글 등록"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      {state.error && (
        <p className="mt-1.5 px-1 text-xs font-medium text-rose-600">{state.error}</p>
      )}
    </form>
  );
}
