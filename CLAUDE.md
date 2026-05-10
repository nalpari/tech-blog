# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Tech Stack

- **Next.js 16.1.6** — App Router, React Compiler enabled (`reactCompiler: true`)
- **React 19** with TypeScript 5 (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` and `@theme inline` syntax, NOT v3 config files
- **Fonts**: JetBrains Mono + IBM Plex Mono via `next/font/google`; Pretendard via CDN `<link>` in `layout.tsx`
- **Supabase** — backend & database (`@supabase/supabase-js`, `@supabase/ssr`)
- **State / Data**: `@tanstack/react-query` (server state), `zustand` (client/auth store)
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-highlight` (with `highlight.js`)
- **Class utilities**: `clsx` + `tailwind-merge`
- **Package manager**: pnpm

## Architecture

**Blog name**: techlog — `layout.tsx`의 `SITE_NAME` 기준 정식 이름. Linear.app의 디자인 언어에서 영감을 받은 다크 테마 기술 블로그.

### Routing (App Router)

All routes live in `src/app/`. Dynamic routes use `generateStaticParams` for full static generation:

- `/` — Home (infinite scroll post grid with scroll-to-top)
- `/posts/[slug]` — Post detail with prose content
- `/tags` — Tag directory
- `/tags/[slug]` — Tag detail with filtered posts
- `/about` — Coming soon (header에서 toast로 안내, 직접 navigate 시 페이지는 존재)
- `(auth)/sign-in`, `(auth)/sign-up` — Supabase Auth UI (route group, URL에서 `(auth)` 표기 안 됨)
- `/auth/callback` — OAuth 콜백 핸들러
- `/admin/dashboard`, `/admin/posts`, `/admin/tags` — 관리자 전용 (admin email gate)
- `/api/posts/[slug]` — REST 엔드포인트

### Supabase

Client utilities in `src/lib/supabase/`:

- `client.ts` — Browser client (`createBrowserClient`) for client components
- `server.ts` — Server client (`createServerClient`) for server components and route handlers
- `middleware.ts` — Session refresh logic used by `src/middleware.ts`

Middleware (`src/middleware.ts`) runs on all routes except static assets, refreshing the auth token on every request.

### Data Layer

`src/lib/data.ts` — Type definitions (`Post`, `Tag`) and mapper functions (`mapPost`, `mapTag`, `formatDate`). `src/lib/queries.ts` — Supabase query functions with pagination support (`getPosts`, `getPostBySlug`, `getPostsByTag`, `getTags`, etc.).

**Mutations**: Server Actions만 사용 (`"use server"`).
- `src/lib/post-actions.ts` — `updatePost(prev, FormData) → UpdatePostState` (form state 패턴)
- `src/app/admin/{posts,tags}/actions.ts` — 도메인별 admin 액션

**Server state**: React Query (`src/providers/query-provider.tsx`) — 기본값 `staleTime: 60_000`, `refetchOnWindowFocus: false`. `<QueryLoadingIndicator />`가 전역 로딩 상태 표시.

**Sort 불변식 (중요)**: `posts.sort_date`는 `COALESCE(published_at, created_at)`을 담는 generated column. 모든 목록 쿼리는 `(sort_date desc, id desc)`로 정렬해야 페이지네이션 중복/누락이 없음. mapper의 `date` 필드 의미가 `sort_date`와 어긋나면 "카드 표시일 ≠ 정렬일" 회귀가 재발함. 자세한 주석은 `src/lib/queries.ts:7-14`.

**DB schema/types**: 마이그레이션은 `supabase/migrations/` (Supabase CLI 워크플로우). 타입은 `src/lib/supabase/database.types.ts`에서 자동 생성.

### Component Conventions

- **Server components by default** — pages, footer, post-card, tag-badge
- **Client components** (`"use client"`) — header, auth-buttons, user-avatar, post-grid (infinite scroll), scroll-to-top
- Components live in `src/components/`, one component per file

### Auth State

실제 Supabase Auth로 동작 중. 흐름:

- `src/providers/auth-provider.tsx` — `onAuthStateChange` 구독, zustand 스토어 동기화
- `src/stores/auth-store.ts` — `{ user, isLoading, setUser, setLoading }` (zustand)
- `src/lib/supabase/middleware.ts` — 모든 요청에서 `getUser()`로 토큰 갱신

**Admin gate**: `ADMIN_EMAIL = "yoo32767@gmail.com"`이 `header.tsx`, `lib/post-actions.ts`, `app/admin/*/actions.ts`에 하드코딩되어 권한 분기로 사용됨. 변경 시 모든 위치 동기화 필요.

### Styling

Dark-first design using CSS custom properties in `globals.css` with Tailwind v4 `@theme inline` 매핑.

**실제 디자인 토큰** (`globals.css:3-33`):

- Background `#0a0a0a`, Foreground `#fafafa`, Card/Surface `#0f0f0f`, Card hover `#1f1f1f`
- Border `#2a2a2a` / Border light `#1a1a1a`, Muted `#6b7280` / Muted foreground `#4b5563`
- Accent `#10b981` (emerald), Accent cyan `#06b6d4`, Accent amber `#f59e0b` — 단일 accent 시스템, 그라데이션 정의 없음
- 토큰은 `:root`와 `@theme inline`에 이중 매핑되어 raw `var(--*)`와 Tailwind 유틸(`bg-card` 등) 모두 같은 변수를 가리킴. 값 변경은 한 곳만, 이름 변경은 두 곳 모두 수정 필요.

**실제 정의된 유틸리티 클래스**:

- `.prose-blog` (`globals.css:110-284`) — 마크다운 본문; Pretendard 본문 + JetBrains Mono 코드, 헤딩에 `# / ## / ###` 접두 마커
- `.stagger-children` — 1~6번째 자식까지 50ms 간격 `fade-in-up`. **7번째 이후는 delay 0이므로 그리드 컬럼 늘릴 때 cliff 주의**
- `.animate-fade-in-up`, `.animate-fade-in` — 단발 페이드

**폰트 적용 범위**:

- `body` — IBM Plex Mono(`--font-sans`)가 전역 기본
- `.prose-blog` 본문 — Pretendard(`layout.tsx` `<head>`의 CDN `<link>`)
- 코드/헤딩 마커 — JetBrains Mono(`--font-mono`)

Path alias: `@/*` maps to `./src/*`.

### Environment

필수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 선택: `NEXT_PUBLIC_SITE_URL` (`layout.tsx`의 `metadataBase`, 기본값 `https://techlog.dev`).

이미지 외부 호스트(`next.config.ts`): `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `*.supabase.co`.

## Always Do

- 모든 답변과 추론과정은 한국어로 작성한다.
- task가 끝나면 서브 에이전트를 사용해서 린트체크, 타입체크, 빌드체크를 수행한다.
- 린트체크시 오류가 있으면 반드시 해결하고 넘어가도록 하고, 경고가 있더라도 해결하려고 노력한다.
- supabase 의 'my-notion-blog-comments' 프로젝트를 사용한다.
- 커밋시에 접두사는 영어로 나머지 타이틀과 내용은 한국어로 작성한다.
- task 완료시 CLAUDE.md 및 README.md 문서에 업데이트가 필요하면 진행한다.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **tech-blog** (801 symbols, 1094 relationships, 27 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/tech-blog/context` | Codebase overview, check index freshness |
| `gitnexus://repo/tech-blog/clusters` | All functional areas |
| `gitnexus://repo/tech-blog/processes` | All execution flows |
| `gitnexus://repo/tech-blog/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
