# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Tech Stack

- **Next.js 16.1.6** — App Router, React Compiler enabled (`reactCompiler: true`)
- **React 19** with TypeScript 5 (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` and `@theme inline` syntax, NOT v3 config files
- **Fonts**: Geist Sans, Geist Mono, Instrument Serif (all via `next/font/google`)
- **Supabase** — backend & database (`@supabase/supabase-js`, `@supabase/ssr`)
- **Package manager**: pnpm

## Architecture

**Blog name**: Spectra — dark-themed tech blog inspired by Linear.app's design language.

### Routing (App Router)

All routes live in `src/app/`. Dynamic routes use `generateStaticParams` for full static generation:

- `/` — Home (featured posts + latest grid)
- `/posts/[slug]` — Post detail with prose content
- `/tags` — Tag directory
- `/tags/[slug]` — Tag detail with filtered posts
- `/about` — Team, values, origin story

### Supabase

Client utilities in `src/lib/supabase/`:

- `client.ts` — Browser client (`createBrowserClient`) for client components
- `server.ts` — Server client (`createServerClient`) for server components and route handlers
- `middleware.ts` — Session refresh logic used by `src/middleware.ts`

Middleware (`src/middleware.ts`) runs on all routes except static assets, refreshing the auth token on every request.

### Data Layer

`src/lib/data.ts` — Static in-memory mock data. All posts and tags are hardcoded arrays with typed interfaces (`Post`, `Tag`). Helper functions: `getPostBySlug`, `getPostsByTag`, `getTagBySlug`, `getFeaturedPosts`, `formatDate`.

### Component Conventions

- **Server components by default** — pages, footer, post-card, tag-badge
- **Client components** (`"use client"`) — header (uses `usePathname`), auth-buttons, user-avatar
- Components live in `src/components/`, one component per file

### Auth State

`src/components/header.tsx` has a `MOCK_USER` variable that toggles between:

- `null` → renders `<AuthButtons />` (Sign in / Sign up)
- User object → renders `<UserAvatar />` with dropdown menu

Replace `MOCK_USER` with real auth state when implementing authentication.

### Styling

Dark-first design using CSS custom properties defined in `globals.css`. Key design tokens:

- Background `#09090b`, Card `#111113`, Accent `#818cf8` (indigo), Accent Secondary `#a78bfa` (violet)
- Gradient accent: indigo → violet (used in buttons, badges, avatar fallbacks)
- Custom utility classes: `.gradient-text`, `.glass-card`, `.glow-line`, `.noise-overlay`, `.prose-blog`
- Stagger animations: `.stagger-children` applies `fade-in-up` with 60ms incremental delays

Path alias: `@/*` maps to `./src/*`.

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.
- task가 끝나면 서브 에이전트를 사용해서 린트체크, 타입체크, 빌드체크를 수행한다.
- 린트체크시 오류가 있으면 반드시 해결하고 넘어가도록 하고, 경고가 있더라도 해결하려고 노력한다.
- supabase 의 'my-notion-blog-comments' 프로젝트를 사용한다.
- 커밋시에 접두사는 영어로 나머지 타이틀과 내용은 한국어로 작성한다.
- task 완료시 CLAUDE.md 및 README.md 문서에 업데이트가 필요하면 진행한다.
