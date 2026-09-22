"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import type { CreatePostState } from "@/actions/posts";
import { POST_CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type UploadedImage = {
  path: string;
  url: string;
};

type PostFormProps = {
  action: (prevState: CreatePostState, formData: FormData) => Promise<CreatePostState>;
  headerLabel: string;
  backHref: string;
  submitLabel: string;
  pendingLabel: string;
  initialCategory?: string;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string;
  initialImages?: UploadedImage[];
};

const initialState: CreatePostState = { error: null };

export default function PostForm({
  action,
  headerLabel,
  backHref,
  submitLabel,
  pendingLabel,
  initialCategory,
  initialTitle,
  initialContent,
  initialTags,
  initialImages,
}: PostFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [category, setCategory] = useState<string>(
    initialCategory && (POST_CATEGORIES as readonly string[]).includes(initialCategory)
      ? initialCategory
      : POST_CATEGORIES[0]
  );
  const [images, setImages] = useState<UploadedImage[]>(initialImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadError(null);

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const invalidFile = filesToUpload.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE
    );
    if (invalidFile) {
      setUploadError("이미지 파일만, 장당 5MB 이하로 첨부할 수 있어요.");
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
      const uploaded: UploadedImage[] = [];
      for (const file of filesToUpload) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("post-images").upload(path, file);
        if (error) {
          setUploadError(`이미지 업로드에 실패했습니다: ${error.message}`);
          break;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(path);
        uploaded.push({ path, url: publicUrl });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (target: UploadedImage) => {
    setImages((prev) => prev.filter((img) => img.path !== target.path));
    const supabase = createClient();
    await supabase.storage.from("post-images").remove([target.path]);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg sm:max-w-2xl lg:max-w-4xl items-center gap-2 px-4 py-2.5">
          <Link
            href={backHref}
            className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold text-slate-900">{headerLabel}</span>
        </div>
      </div>

      <form action={formAction} className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-4xl space-y-4 px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {POST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === cat
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {cat}
            </button>
          ))}
          <input type="hidden" name="category" value={category} />
        </div>

        <input
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          placeholder="제목을 입력하세요"
          className="w-full border-b border-slate-200 pb-2.5 text-lg font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
        />

        <textarea
          name="content"
          required
          rows={8}
          defaultValue={initialContent}
          placeholder="사진과 함께 공유하고 싶은 이야기를 자유롭게 적어보세요..."
          className="w-full resize-none text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none"
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">사진</span>
            <span className="text-[11px] text-slate-400">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {images.map((img) => (
              <div key={img.path} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label="이미지 삭제"
                >
                  <X className="h-3 w-3" />
                </button>
                <input type="hidden" name="images" value={img.url} />
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-400 hover:text-indigo-500 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-[10px] font-medium">
                  {uploading ? "업로드 중" : "사진 추가"}
                </span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
          {uploadError && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{uploadError}</p>
          )}
        </div>

        <div>
          <label htmlFor="tags" className="mb-1.5 block text-xs font-bold text-slate-800">
            태그
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={initialTags}
            placeholder="공백이나 쉼표로 구분해서 입력 (예: 카페투어 원격근무)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}
