"use client";

import { createPost } from "@/actions/posts";
import PostForm from "@/components/post/PostForm";

export default function NewPostPage() {
  return (
    <PostForm
      action={createPost}
      headerLabel="새로운 피드 작성"
      backHref="/feed"
      submitLabel="등록"
      pendingLabel="등록 중..."
    />
  );
}
