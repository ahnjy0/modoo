# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # start dev server (Turbopack), default port 3000
npm run dev -- --port 3001   # use an alternate port if 3000 is taken
npm run build             # production build
npm run start             # run the production build
npm run lint               # eslint (flat config in eslint.config.mjs)
npx tsc --noEmit           # type-check only — there is no dedicated npm script for this
```

There is no test framework configured in this project (no test runner, no test files).

### Database changes

There is no linked Supabase CLI project here (no `supabase/config.toml`, no `supabase link` done). Schema changes are plain SQL files under `supabase/migrations/`, numbered sequentially (`0001_profiles.sql`, `0002_posts.sql`, ...). To apply one, copy its full contents and run it in the target Supabase project's Dashboard → SQL Editor — there is no automated migration runner wired up. When adding a new migration, add a new numbered file rather than editing an existing one.

## Architecture

### This is a very new Next.js version

`next` is pinned to `16.3.5`, which is ahead of most training data and has breaking changes vs. the Next.js you may be used to. See `AGENTS.md` (imported above) for the standing instruction to check `node_modules/next/dist/docs/` before writing framework-touching code. One concrete example already hit in this repo: `middleware.ts` is deprecated in this version in favor of a `proxy.ts` convention — it still works, but don't be surprised by the deprecation warning in `next dev` output, and don't "fix" it without checking current docs first.

### Supabase client boundaries

There are three separate Supabase client constructors, and using the wrong one is the most likely mistake:

- `src/lib/supabase/client.ts` — browser client, for Client Components.
- `src/lib/supabase/server.ts` — server client for Server Components/Server Actions/Route Handlers. Reads/writes cookies via `next/headers`; the `setAll` cookie write is wrapped in try/catch because it throws when called from a plain Server Component (session refresh there is handled by `middleware.ts` instead, not by this catch).
- `src/lib/supabase/admin.ts` — `service_role` client that bypasses RLS entirely. Server-only, and only for operations that genuinely need to act outside a user's own permissions (account deletion, admin-confirming a signup — see below). Never import this into anything that reaches the client bundle.

### Auth flow and the dev-mode signup shortcut

`src/middleware.ts` calls `supabase.auth.getUser()` (not `getSession()` — `getUser()` validates the token and refreshes an expired session; `getSession()` just reads whatever is cached) on every request matched by its `config.matcher`, then redirects: unauthenticated users away from anything not in `PUBLIC_PATHS`, and authenticated users away from `GUEST_ONLY_PATHS` (`/auth/login`, `/auth/signup`) back to `/feed`.

`src/actions/auth.ts`'s `signup` action has a deliberate, temporary shortcut: after `supabase.auth.signUp()`, if no session came back, it uses the admin client to force `email_confirm: true` on the new user and immediately signs them in — skipping Supabase's real email-confirmation round trip entirely. This exists because the project's built-in mailer has a low rate limit that kept blocking manual testing. It's marked with a `TODO` in the code and **must be removed before real users sign up**, restoring a genuine "check your email" flow. If you touch signup, keep that TODO visible rather than quietly building more logic on top of the shortcut.

Also in that file: Supabase's anti-enumeration behavior means signing up with an email that's already registered doesn't return an error — it returns a fake `user` object with `identities: []`. `signup` checks for that explicitly and turns it into a normal "already registered" error; don't assume `signUp()` erroring is the only way to detect a duplicate.

### Server Actions: exports must all be async functions

Every file with `"use server"` at the top (`src/actions/*.ts`) may **only** export async functions. Exporting a plain constant or type-as-value (even something as innocuous as a shared initial-state object) breaks the build with "A 'use server' file can only export async functions, found object." `export type` is fine (types don't exist at runtime); a runtime value export is not. If a page needs a shared initial state for `useActionState`, define it locally in the page, not in the action file.

Action functions that operate on a specific row (`toggleLike`, `toggleBookmark`, `deletePost` in `src/actions/posts.ts`) are called from inside Server Components via `<form action={toggleLike.bind(null, post.id)}>` — this works without needing the surrounding component to be a Client Component.

### Data layer: `src/lib/posts.ts`

All feed/detail post queries go through this file rather than being inlined in pages. Two PostgREST patterns to know before touching it:

- `author:profiles!posts_author_id_fkey(...)` — explicit FK-named embed for the author join.
- `post_likes(count)` — embedded aggregate; comes back as `post_likes: [{ count: N }]`, not a bare number, so callers do `row.post_likes?.[0]?.count ?? 0`.

Per-viewer state (`isLiked`/`isBookmarked`) is fetched separately per request (`attachViewerState`) rather than embedded in the main query, because `post_bookmarks` RLS scopes `select` to the current user only (so an unfiltered query already returns just "my" bookmarks), while `post_likes` is publicly selectable (needed for public like counts) and must be explicitly filtered by `user_id` to derive "did I like this."

### Database schema and RLS

Every table has RLS enabled from creation (see `supabase/migrations/`). The consistent pattern: `select` is public on `profiles`/`posts`/`post_likes` (so counts and public content are readable by anyone), but `post_bookmarks` select is owner-only; `insert`/`update`/`delete` are always gated on `auth.uid() = <owner column>`. `posts.category` is a Postgres `CHECK` constraint against a fixed list of Korean category strings — that list is duplicated in code as `POST_CATEGORIES` in `src/lib/categories.ts`. If categories ever change, both places need updating together, or inserts will fail the CHECK constraint with no client-side warning beforehand.

`profiles` rows are created automatically by a Postgres trigger (`handle_new_user`, in `0001_profiles.sql`) on `auth.users` insert, not by application code — there is no "create profile" Server Action. It reads `name`/`handle` out of `raw_user_meta_data` (set via `signUp`'s `options.data`) and falls back to a generated `@user_<id prefix>` handle if none was supplied.

### Page-level chrome, not layout-level

`Header` (`src/components/layout/Header.tsx`, a Server Component that fetches the current user/profile itself) and `BottomNav` (`src/components/layout/BottomNav.tsx`, a Client Component that uses `usePathname` to decide active tab and to hide itself entirely on `/auth/*` and `/posts/new`) are not wired up via a Next.js layout route group. `BottomNav` is rendered once, globally, from the root `layout.tsx`. `Header` is imported and rendered individually at the top of each of the four main-tab pages (`/feed`, `/search`, `/profile/me`, `/settings`) — it deliberately does not appear on `/posts/new` or `/posts/[postId]`, which have their own back-navigation headers instead. When adding a new top-level tab page, add `<Header />` to it explicitly; don't assume it's inherited.

### Images

`next.config.ts` allows `remotePatterns` for `*.supabase.co/storage/v1/object/public/**`, anticipating Supabase Storage-hosted avatars/post images — but no upload UI exists yet, so `posts.images` and `profiles.avatar_url` are currently always empty/null in practice.
