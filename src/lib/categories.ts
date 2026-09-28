export const POST_CATEGORIES = [
  "디자인",
  "AI 기술",
  "개발",
  "취미",
  "일상",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const FEED_FILTERS = ["전체", ...POST_CATEGORIES] as const;
