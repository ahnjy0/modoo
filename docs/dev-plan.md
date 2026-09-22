# MODOO Next.js + Supabase 개발 계획

> 기준 문서: [docs/requirements.md](./requirements.md)(기능/화면/데이터 요구사항), [docs/design.md](./design.md)(디자인 톤)
> 현재 React SPA(로컬 state + mock data) 프로토타입을 **Next.js(App Router) + Supabase(Postgres/Auth/Storage/Realtime)** 기반 실서비스로 재구현하기 위한 계획.

---

## 1. 폴더 구조

```
modi-community/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                     # 루트 레이아웃(폰트, 전역 Provider)
│  │  ├─ page.tsx                       # "/" → /feed 리다이렉트
│  │  ├─ auth/
│  │  │  ├─ login/page.tsx              # 로그인
│  │  │  ├─ signup/page.tsx             # 회원가입
│  │  │  └─ callback/route.ts           # OAuth 콜백(Route Handler)
│  │  ├─ (main)/                        # 로그인 필요 + Header/BottomNav 공통 레이아웃 그룹
│  │  │  ├─ layout.tsx                  # Header + BottomNav + 세션 체크
│  │  │  ├─ feed/page.tsx
│  │  │  ├─ search/page.tsx
│  │  │  ├─ notifications/page.tsx
│  │  │  ├─ settings/page.tsx
│  │  │  ├─ posts/
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [postId]/page.tsx
│  │  │  └─ profile/
│  │  │     ├─ me/page.tsx              # 내 피드
│  │  │     ├─ me/edit/page.tsx         # 프로필 수정
│  │  │     └─ [userId]/page.tsx        # 다른 사용자 프로필
│  │  └─ api/
│  │     └─ webhooks/…                  # 필요 시 외부 웹훅(결제 등은 현재 범위 밖)
│  ├─ components/
│  │  ├─ layout/ (Header, BottomNav)
│  │  ├─ post/ (PostCard, PostForm, ImageUploader, LinkPreviewCard, TagInput)
│  │  ├─ comment/ (CommentList, CommentItem, CommentForm)
│  │  ├─ profile/ (ProfileSummaryCard, ProfileForm, AvatarPicker, FollowButton)
│  │  ├─ notification/ (NotificationItem, NotificationFilterTabs)
│  │  └─ ui/ (Button, Input, Toast, Modal 등 공용 프리미티브)
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts                   # 브라우저용 createBrowserClient
│  │  │  ├─ server.ts                   # 서버 컴포넌트/RSC용 createServerClient
│  │  │  └─ admin.ts                    # service_role 클라이언트(탈퇴 처리 등 서버 전용)
│  │  ├─ validations/ (zod 스키마: post, comment, profile)
│  │  └─ utils.ts
│  ├─ actions/                          # Server Actions
│  │  ├─ posts.ts (create/update/delete/toggleLike/toggleBookmark)
│  │  ├─ comments.ts (create/toggleLike)
│  │  ├─ follows.ts (toggle)
│  │  ├─ profile.ts (update)
│  │  └─ notifications.ts (markRead/markAllRead/delete)
│  ├─ hooks/ (useOptimisticLike, useToast 등 클라이언트 훅)
│  ├─ types/
│  │  └─ database.types.ts              # `supabase gen types typescript` 결과물
│  └─ middleware.ts                     # 세션 갱신 + 보호 라우트 리다이렉트
├─ supabase/
│  ├─ migrations/                       # SQL 마이그레이션(테이블, RLS, 트리거)
│  └─ config.toml
├─ public/
├─ .env.local                           # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY(서버 전용)
└─ package.json
```

**설계 의도**
- 기존 `ScreenType` 기반 단일 SPA 상태 전환을 Next.js의 **파일 기반 라우트**로 1:1 매핑(아래 2번 참고).
- `(main)` 라우트 그룹으로 로그인 필요 화면 + 공통 Header/BottomNav 레이아웃을 한 번에 묶고, `auth/*`는 별도 레이아웃(탭바 없음)으로 분리 — 기존 `BottomNav`가 `login/signup/create`에서 숨겨지던 로직을 그대로 반영.
- `actions/`(Server Actions)로 mutation을 모으고 컴포넌트는 최대한 읽기 전용 서버 컴포넌트로 유지 → 기존 `App.tsx`에 몰려있던 handler들을 화면별이 아닌 **도메인별**로 재배치.

---

## 2. 페이지 / 라우트 목록

| 기존 화면(ScreenType) | 라우트 | 컴포넌트 타입 | 인증 필요 | 비고 |
|---|---|---|---|---|
| `login` | `/auth/login` | Client(폼 상호작용) | ✕ | 로그인 상태면 `/feed`로 리다이렉트 |
| `signup` | `/auth/signup` | Client | ✕ | 가입 후 `/feed` 이동 |
| `feed` | `/feed` | Server(목록) + Client(필터/액션 일부) | ✓ | 초기 목록은 서버에서 SSR, 카테고리 필터는 쿼리스트링(`?category=`) |
| `search` | `/search` | Client | ✓ | 검색어는 쿼리스트링(`?q=`)으로 상태 유지, 공유 가능한 URL |
| `create` | `/posts/new` | Client | ✓ | 이미지 업로드(Storage) 포함 |
| `detail` | `/posts/[postId]` | Server(본문/댓글 SSR) + Client(좋아요/댓글 입력) | ✓ | 조회수 증가는 Server Action에서 처리 |
| `my-profile` | `/profile/me` | Server | ✓ | 세션의 `user.id` 기준 조회 |
| `edit-profile` | `/profile/me/edit` | Client | ✓ | 아바타 업로드 포함 |
| `user-profile` | `/profile/[userId]` | Server | ✓ | 본인 접근 시 `/profile/me`로 리다이렉트 고려 |
| `notifications` | `/notifications` | Server(목록) + Client(읽음/삭제) | ✓ | |
| `settings` | `/settings` | Client | ✓ | 로그아웃/탈퇴는 Server Action |
| (신규) OAuth 콜백 | `/auth/callback` | Route Handler | ✕ | Supabase OAuth 리다이렉트 처리 |

- 뒤로가기/스크롤 최상단 이동 등은 Next.js 기본 라우팅(`router.back()`, `scroll: true`)으로 대체.
- 하단 탭 4개(홈/검색/내피드/설정)는 `(main)/layout.tsx`의 BottomNav에서 `usePathname()`으로 활성 탭 판단.

---

## 3. DB 테이블 개요 (Supabase Postgres)

> `auth.users`는 Supabase Auth가 관리. 앱 데이터는 `public` 스키마에 구성하고 `profiles.id`가 `auth.users.id`를 그대로 참조(1:1).

| 테이블 | 주요 컬럼 | 설명 |
|---|---|---|
| **profiles** | `id (uuid, PK, FK→auth.users)`, `name`, `handle (unique)`, `avatar_url`, `badge_title`, `is_certified`, `level`, `bio`, `website`, `created_at`, `updated_at` | 요구사항의 `UserProfile`. `postCount/likeCount/followerCount`는 저장하지 않고 집계 쿼리 또는 뷰로 계산(아래 참고) |
| **posts** | `id (uuid, PK)`, `author_id (FK→profiles)`, `category`, `title`, `content`, `images (text[])`, `tags (text[])`, `views (int, default 0)`, `link_preview (jsonb, nullable)`, `tip (text, nullable)`, `created_at`, `updated_at` | 요구사항의 `Post`. 이미지는 Storage 경로/URL 배열 |
| **post_likes** | `post_id (FK)`, `user_id (FK)`, `created_at`, PK `(post_id, user_id)` | 좋아요 토글. PK 제약으로 중복 좋아요 자체 방지 |
| **post_bookmarks** | `post_id (FK)`, `user_id (FK)`, `created_at`, PK `(post_id, user_id)` | 북마크(스크랩) |
| **comments** | `id (uuid, PK)`, `post_id (FK)`, `author_id (FK→profiles)`, `parent_id (uuid, nullable, FK→comments.id)`, `content`, `created_at` | `parent_id`로 대댓글 표현(앱에서 1단계로 강제) |
| **comment_likes** | `comment_id (FK)`, `user_id (FK)`, PK `(comment_id, user_id)` | 댓글 좋아요 |
| **follows** | `follower_id (FK→profiles)`, `following_id (FK→profiles)`, `created_at`, PK `(follower_id, following_id)` | 팔로우 관계 |
| **notifications** | `id (uuid, PK)`, `recipient_id (FK→profiles)`, `type (enum: like/comment/follow/system/mention)`, `title`, `message`, `actor_id (FK→profiles, nullable)`, `post_id (FK, nullable)`, `is_read (bool, default false)`, `created_at` | 요구사항의 `AppNotification`. `like/comment/follow`는 DB 트리거로 자동 생성 권장 |
| **blocked_users** | `blocker_id (FK)`, `blocked_id (FK)`, `created_at`, PK `(blocker_id, blocked_id)` | 설정의 "차단한 사용자 관리" |

**부가 사항**
- `category`는 MVP에서는 `text` + `CHECK (category IN (...))`로 시작하고, 운영진이 카테고리를 관리해야 하면 별도 `categories` 테이블로 승격.
- **좋아요/댓글 수**: 처음엔 `count(*)` 집계 쿼리(또는 뷰)로 충분하며, 트래픽이 늘면 `posts.likes_count`/`comments_count` 컬럼 + 트리거(`AFTER INSERT/DELETE ON post_likes`)로 비정규화해 성능 확보.
- **팔로워/팔로잉 수**도 동일하게 집계 쿼리 우선, 필요 시 `profiles.follower_count` 트리거 캐싱.
- **Storage 버킷**: `avatars`(공개 read), `post-images`(공개 read) 2개 분리, 업로드는 인증 사용자만 자신의 `uid/` 경로 하위에만 쓰기 가능하도록 정책 설정.
- **검색**: 초기엔 `title/content ILIKE '%keyword%'`, 한글 형태소·유사도 검색이 필요하면 `pg_trgm` 확장 + GIN 인덱스로 확장.

---

## 4. 구현 순서

1. **프로젝트 셋업**
   Next.js(App Router, TS) + Tailwind v4 초기화 → Supabase 프로젝트 생성 → `@supabase/supabase-js`, `@supabase/ssr` 설치 → `.env.local` 구성 → `supabase/migrations`로 스키마 버전 관리 시작.

2. **인증(Auth)**
   이메일/비밀번호 가입·로그인 → `auth.users` insert 시 `profiles` row 자동 생성 트리거 → 미들웨어(`src/middleware.ts`)로 세션 갱신 및 `(main)` 그룹 보호 → 로그아웃/세션 유지 → (선택) 구글 OAuth 연동, 카카오는 Supabase 기본 제공자 목록에 없을 수 있어 사전 확인 후 Generic OAuth로 대체 검토.

3. **DB 스키마 + RLS 뼈대**
   3번 섹션 테이블 전체 마이그레이션 작성 → 모든 테이블 RLS 활성화 및 최소 정책(5번 섹션 기준) 우선 적용 → seed 스크립트로 목업 데이터 이관.

4. **피드(읽기)**
   서버 컴포넌트에서 `posts` + `profiles` join 조회, 카테고리 필터(쿼리스트링) → 페이지네이션/무한스크롤(`range()`) → 게시글 카드 컴포넌트 포팅.

5. **게시글 작성/상세**
   Storage 이미지 업로드(최대 5장, 5MB 제한은 클라이언트 검증 + Storage 정책 이중화) → 작성 Server Action → 상세 페이지 SSR + 조회수 증가(Server Action, 중복 방지는 추후 개선 과제로 명시) → 삭제(작성자 본인만).

6. **좋아요 · 북마크**
   `post_likes`/`post_bookmarks` 토글 Server Action + 낙관적 UI(Optimistic Update) → PK 충돌 시 idempotent 처리.

7. **댓글/대댓글**
   `comments` CRUD(수정은 범위 밖, 작성/삭제만) → `parent_id` 기반 1단계 대댓글 렌더링 → 댓글 좋아요.

8. **프로필/팔로우**
   내 프로필(집계 쿼리로 통계 계산) → 프로필 수정(아바타 업로드 포함) → 다른 사용자 프로필 + 팔로우 토글.

9. **검색**
   게시글/사용자 탭별 쿼리, 최근 검색어는 우선 `localStorage`로 시작(서버 저장이 필요하면 `search_history` 테이블 추가 검토), 인기 키워드는 초기엔 정적/수동 데이터로 시작.

10. **알림**
    좋아요/댓글/팔로우 발생 시 DB 트리거로 `notifications` insert → 목록/필터/읽음 처리 Server Action → (선택) Supabase Realtime 구독으로 벨 아이콘 실시간 배지 갱신 → 30일 지난 알림은 Supabase Cron(Edge Function)으로 정리.

11. **설정 · 계정 관리**
    차단 사용자 관리(`blocked_users`), 로그아웃 → 회원탈퇴는 `service_role` 클라이언트로 `auth.users` 삭제(관련 테이블 `ON DELETE CASCADE` 설계 필수).

12. **배포**
    Vercel에 배포, `next.config`의 `images.remotePatterns`에 Supabase Storage 도메인 등록, 환경변수(운영/스테이징 분리), 배포 전 RLS 정책 재점검 및 프로덕션 데이터로 스모크 테스트.

---

## 5. 주의점

### 5.1 RLS(Row Level Security) / 접근 권한
- **모든 테이블 RLS를 기본 ON**으로 시작하고, 화이트리스트 방식으로 정책을 추가(정책 없으면 전면 차단이 안전한 기본값).
- 테이블별 최소 정책 예시:
  - `profiles`: `select` 전체 공개, `update`는 `auth.uid() = id`인 본인만.
  - `posts`: `select` 전체 공개, `insert`는 `auth.uid() = author_id`, `update/delete`는 작성자 본인만.
  - `post_likes` / `post_bookmarks` / `comment_likes`: `insert/delete`는 `auth.uid() = user_id`만, `select`는 공개(집계용) 또는 본인 것만으로 제한할지 결정.
  - `comments`: `insert`는 로그인 사용자, `delete`는 작성자 본인(또는 게시글 작성자에게도 삭제 권한 부여할지 정책 결정 필요).
  - `follows`: `insert/delete`는 `auth.uid() = follower_id`만.
  - `notifications`: **`select`/`update(is_read)`는 `recipient_id = auth.uid()`만**, `insert`는 클라이언트에서 직접 못 하게 막고 **DB 트리거 또는 `service_role`**에서만 생성 — 클라이언트가 임의로 "내가 알림을 만들 수 있게" 허용하면 알림 위조/스팸 가능.
  - `blocked_users`: `auth.uid() = blocker_id`인 경우만 접근.
- Storage 버킷 정책도 테이블과 별도로 설정 필요(경로 규칙 예: `avatars/{uid}/*`, `post-images/{uid}/*`로 업로드자 본인만 쓰기).

### 5.2 인증/세션
- 브라우저용(`createBrowserClient`), 서버 컴포넌트/Server Action용(`createServerClient`), 관리자 작업용(`service_role`, **서버 전용, 절대 클라이언트 번들에 노출 금지**) 클라이언트를 명확히 분리.
- `middleware.ts`에서 세션 쿠키 갱신을 반드시 처리하지 않으면 서버 컴포넌트에서 세션이 간헐적으로 만료된 것처럼 보이는 문제 발생.
- 로그인 여부에 따라 `(main)` 그룹 접근을 미들웨어에서 리다이렉트 처리(현재 SPA의 `currentScreen` 분기 로직을 서버 레벨 가드로 대체).
- 카카오 로그인은 Supabase Auth 기본 제공자 여부를 먼저 확인 — 미지원 시 Kakao REST API 연동을 별도 OAuth 플로우로 구현해야 하므로 일정에 반영.

### 5.3 데이터 정합성
- 요구사항 문서 5.6에서 언급된 "목업 고정값(팔로워 수 등)"은 실제 서비스에서는 반드시 **집계 쿼리 또는 트리거 기반 카운터**로 교체 — 프론트에서 임의로 숫자를 더하는 방식(현재 `UserProfileView`의 `followerCount + (isFollowing ? 1 : 0)`)은 실제 DB 값과 불일치할 수 있으므로 서버 값을 신뢰하는 구조로 전환.
- 좋아요/북마크/팔로우는 PK 제약(복합키)으로 중복 삽입 자체를 막아 동시 클릭에도 안전하게 처리.
- 대댓글은 DB 스키마상 `parent_id` self-reference라 이론상 무한 depth가 가능하므로, **UI/Server Action 레벨에서 1단계로 강제**해야 요구사항과 일치.
- 조회수 증가 로직은 새로고침/중복 방문 시 어뷰징 가능 — MVP 이후 세션/쿠키 기반 중복 방지 로직 추가 검토.

### 5.4 회원 탈퇴 / 개인정보
- 탈퇴 시 `auth.users` 삭제와 연관 테이블(`posts`, `comments`, `follows` 등) 처리 방식을 사전 결정: **완전 삭제(CASCADE)** vs **소프트 삭제/익명화**(게시글은 남기고 작성자 정보만 "탈퇴한 사용자"로 치환). 커뮤니티 서비스 특성상 후자가 흔하지만 요구사항 문서(전면 삭제 안내 문구)와 맞추려면 정책을 명확히 확정 필요.
- 비밀번호 재설정, 이메일 인증 등은 Supabase Auth의 기본 이메일 발송 기능/템플릿을 사용하되, 발신 도메인·리다이렉트 URL 설정을 배포 전에 점검.

### 5.5 성능/운영
- 알림 테이블은 트리거로 계속 쌓이므로 30일 보관 정책을 Supabase Cron(Edge Function 또는 pg_cron)으로 주기 정리하지 않으면 무한 증가.
- 이미지가 많은 피드는 Storage 공개 URL + `next/image`(원격 도메인 허용 설정) 조합으로 최적화, Unsplash 등 외부 이미지가 섞여 있다면 `remotePatterns`에 함께 등록.
- 검색은 트래픽/데이터 규모가 커지면 Postgres 단순 검색만으로 부족할 수 있어 초기부터 인덱스 전략(GIN + `pg_trgm`)을 염두에 두고 설계.
