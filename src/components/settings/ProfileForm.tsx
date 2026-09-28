"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile, type ProfileFormState } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { storageObjectPathFromUrl } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type ProfileFormProps = {
  initialName: string;
  initialHandle: string;
  initialBio: string;
  initialAvatarUrl: string | null;
};

const initialState: ProfileFormState = { error: null };

export default function ProfileForm({
  initialName,
  initialHandle,
  initialBio,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/") || file.size > MAX_FILE_SIZE) {
      setUploadError("이미지 파일만, 5MB 이하로 업로드할 수 있어요.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("로그인이 필요합니다.");
      return;
    }

    setUploading(true);
    try {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file);
      if (error) {
        setUploadError(`업로드에 실패했습니다: ${error.message}`);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const previousPath = avatarUrl ? storageObjectPathFromUrl(avatarUrl, "avatars") : null;
      if (previousPath) {
        await supabase.storage.from("avatars").remove([previousPath]);
      }

      setAvatarUrl(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form action={formAction} className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-4">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative h-20 w-20 overflow-hidden rounded-full bg-indigo-50 ring-2 ring-slate-100 disabled:opacity-60"
          aria-label="프로필 사진 변경"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-indigo-600">
              {initialName.slice(0, 1)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
        {uploadError && <p className="text-xs font-medium text-rose-600">{uploadError}</p>}
      </div>

      <div className="text-left">
        <label htmlFor="name" className="mb-1 block text-xs font-bold text-slate-800">
          닉네임
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="text-left">
        <label htmlFor="handle" className="mb-1 block text-xs font-bold text-slate-800">
          핸들
        </label>
        <input
          id="handle"
          name="handle"
          type="text"
          required
          defaultValue={initialHandle}
          placeholder="@handle"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="text-left">
        <label htmlFor="bio" className="mb-1 block text-xs font-bold text-slate-800">
          소개
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={initialBio}
          placeholder="자기소개를 입력해보세요"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {state.error}
        </p>
      )}
      {!state.error && state.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
