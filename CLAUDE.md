# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint (flat config)
```

No test framework is currently configured.

## Tech Stack

- **Next.js 16.1.6** — App Router, React Compiler enabled (`reactCompiler: true`)
- **React 19** with TypeScript 5 (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` and `@theme inline` syntax, NOT v3 config files
- **Fonts**: JetBrains Mono (headings/nav), IBM Plex Mono (body), Pretendard Variable (prose, loaded from CDN)
- **Supabase** — backend, auth & database (`@supabase/supabase-js`, `@supabase/ssr`)
- **Zustand** — auth state management (`src/stores/auth-store.ts`)
- **TanStack React Query** — data fetching/caching (60s stale time)
- **react-markdown** + rehype-highlight + remark-gfm — markdown rendering with syntax highlighting
- **Package manager**: pnpm

## Architecture

**Blog name**: Spectra — dark-themed tech blog.

### Routing (App Router)

All routes live in `src/app/`:

- `/` — Home (infinite scroll post grid with scroll-to-top)
- `/posts/[slug]` — Post detail with markdown prose content
- `/posts/new` — New post creation (admin)
- `/tags` — Tag directory
- `/tags/[slug]` — Tag detail with filtered posts
- `/about` — About page
- `/admin/posts` — Admin post management
- `/(auth)/sign-in`, `/(auth)/sign-up` — Auth pages (route group)
- `/auth/callback` — OAuth callback handler

### API Routes

- `GET /api/posts?offset=N&limit=N` — Paginated post list for infinite scroll
- `POST /api/posts/[slug]/view` — Increment view counter
- `POST /api/posts/[slug]/like` — Increment like count

### Supabase

Client utilities in `src/lib/supabase/`:

- `client.ts` — Browser client (`createBrowserClient`) for client components
- `server.ts` — Server client (`createServerClient`) for server components and route handlers
- `middleware.ts` — Session refresh logic used by `src/middleware.ts`
- `database.types.ts` — Generated TypeScript types

Middleware (`src/middleware.ts`) runs on all routes except static assets, refreshing the auth token on every request.

**Tables**: `posts`, `tags`, `post_tags` (junction), `bookmarks`, `comments`, `profiles`

### Data Layer

- `src/lib/data.ts` — Type definitions (`Post`, `Tag`) and mapper functions (`mapPost`, `mapTag`, `formatDate`)
- `src/lib/queries.ts` — Supabase query functions with pagination (`getPosts`, `getPostBySlug`, `getPostsByTag`, `getTags`, etc.)
- `src/lib/post-actions.ts` — Server actions for post CRUD (validation, slug uniqueness, tag management)

### State Management & Providers

- `src/stores/auth-store.ts` — Zustand store (`useAuthStore`) for auth state
- `src/providers/auth-provider.tsx` — Listens to Supabase `onAuthStateChange`, hydrates auth store
- `src/providers/query-provider.tsx` — React Query provider
- Both providers wrap the app in `src/app/layout.tsx`

### Auth

- Real Supabase auth with OAuth (Google, GitHub) and email/password
- Admin check: `user?.email === "yoo32767@gmail.com"`
- User metadata: `full_name`, `name`, `avatar_url`, `picture` from `user.user_metadata`

### Component Conventions

- **Server components by default** — pages, footer, post-card, tag-badge
- **Client components** (`"use client"`) — header, auth-buttons, user-avatar, post-grid (infinite scroll), scroll-to-top, search-modal
- Components live in `src/components/`, one component per file

### Styling

Dark-only design using CSS custom properties defined in `globals.css`. Key design tokens:

- Background `#0a0a0a`, Card `#0f0f0f`, Accent `#10b981` (green), Accent Cyan `#06b6d4`
- Custom utility classes: `.prose-blog` (markdown content styling), `.stagger-children`, `.animate-fade-in-up`
- Toast system: Custom vanilla DOM implementation in `src/lib/toast.ts`

Path alias: `@/*` maps to `./src/*`.

### Image Handling

- Remote image patterns: `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `*.supabase.co`
- Image upload utility: `src/lib/upload-image.ts` (Supabase Storage)

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.
- task가 끝나면 서브 에이전트를 사용해서 린트체크, 타입체크, 빌드체크를 수행한다.
- 린트체크시 오류가 있으면 반드시 해결하고 넘어가도록 하고, 경고가 있더라도 해결하려고 노력한다.
- supabase 의 'my-notion-blog-comments' 프로젝트를 사용한다.
- 커밋시에 접두사는 영어로 나머지 타이틀과 내용은 한국어로 작성한다.
- task 완료시 CLAUDE.md 및 README.md 문서에 업데이트가 필요하면 진행한다.
