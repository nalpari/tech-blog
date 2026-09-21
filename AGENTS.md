# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Tech Stack

- **Next.js 16.3.5** — App Router, React Compiler enabled (`reactCompiler: true`)
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

All routes live in `src/app/`. 모든 라우트는 요청 시 동적 렌더링된다 (`generateStaticParams` 없음 — 쿠키/`auth.getUser()` 의존). 대신 발행 포스트 조회를 쿼리 레벨에서 캐싱한다 (아래 Data Layer 참고):

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
- `proxy.ts` — Session refresh logic used by `src/proxy.ts`

Proxy (`src/proxy.ts` — formerly `middleware.ts`, Node.js runtime only) runs on all routes except static assets, refreshing the auth token on every request.

### Data Layer

`src/lib/data.ts` — Type definitions (`Post`, `PostSummary`, `Tag`)과 mapper (`mapPost`, `mapPostSummary`, `mapTag`, `formatDate`). `src/lib/queries.ts` — Supabase 쿼리 함수 (`getPosts`, `getPostBySlug`, `getPostsByTag`, `getRelatedPosts`, `getLikedPostIds`, `getTags` 등).

**목록 vs 상세 (중요)**: 목록·카드는 본문이 필요 없으므로 `PostSummary`(= `Omit<Post, "content">`)를 쓰고, 목록 쿼리는 `POST_SUMMARY_SELECT`로 컬럼을 명시한다. `select("*")`로 되돌리면 카드 하나당 마크다운 본문 전체가 전송되는 회귀가 난다. 상세(`getPostBySlug`)만 `Post`(content 포함).

**관련 포스트**: `getRelatedPosts(tagSlug, excludeSlug, limit)`가 DB에서 정렬·제외·limit까지 끝낸다. `getPostsByTag`로 전체를 받아 JS에서 `slice`하지 말 것.

**좋아요 상태**: `liked`는 서버 렌더 시점에 채워 `LikeButton`의 `initialLiked`로 내려준다 (목록 쿼리는 `withLiked`, 상세는 `getLikedPostIds`). 클라이언트가 마운트 때 좋아요 상태를 조회하는 API는 제거됐다 (`/api/posts/[slug]/like`는 POST만 존재).

**캐싱/무효화 (중요)**: 발행 포스트 상세는 `unstable_cache`(`revalidate: 60`, 태그 `POST_CACHE_TAG(slug)` = `post:<slug>`)로 요청 간 재사용된다.
- 캐시 콜백은 쿠키를 읽을 수 없으므로 **반드시** `src/lib/supabase/public.ts`의 `getPublicClient()`(세션 없는 anon 클라이언트)를 쓴다 (RLS `posts_select`가 published를 anon에 허용). 모듈 최상위가 아니라 첫 호출에 생성하는 이유는 env가 없는 CI/프리뷰에서 import만으로 빌드가 죽지 않게 하기 위함이다.
- draft 조회(`includeDraft: true`)는 권한에 따라 결과가 달라지므로 캐시를 타지 않는다.
- 포스트를 변경하는 Server Action은 **모두** `updateTag(POST_CACHE_TAG(slug))`를 호출해야 한다 (`post-actions.ts`, `posts/new/actions.ts`, `posts/[slug]/actions.ts`, `admin/posts/actions.ts`). slug를 바꾸는 `updatePost`는 변경 전/후 양쪽을 무효화한다. Next 16의 `revalidateTag`는 인자가 2개이고 지연 만료이므로, Server Action에서는 즉시 반영되는 `updateTag`를 쓴다.
- `view_count`/`like_count`도 이 캐시를 타므로 최대 60초 stale할 수 있다 (의도된 트레이드오프). 토글·조회 **직후 그 화면에서만** API 응답으로 보정되고, **새로고침하면 캐시된 옛 카운트로 되돌아간다** (예: 하트는 채워져 있는데 숫자는 1 적음). 정확한 카운트가 필요해지면 캐시 쿼리에서 카운터를 빼고 따로 읽어야 한다.
- 쿼리 실패를 `null`로 반환하면 그 `null`이 캐싱돼 일시적 DB 장애가 60초짜리 404로 굳는다. `fetchPublishedPost`는 error를 받으면 던진다 — 이 가드를 제거하지 말 것.
- **태그를 바꾸는 액션도 포스트 캐시를 무효화해야 한다.** 캐시된 포스트 row는 태그 slug를 embed하고 있어서, 태그 slug 변경/삭제 시 `admin/tags/actions.ts`의 `invalidatePostsOfTag`로 해당 포스트들을 함께 버린다 (삭제는 cascade 전에 호출). 이 파일은 자체 `updateTag` Server Action을 export하므로 `next/cache`의 것은 `updateCacheTag` 별칭으로 import한다.

**요청 단위 중복 제거**: `getPostBySlug`와 `src/lib/auth.ts`의 `getCurrentUser`/`isAdmin`은 `react.cache()`로 감싸져 있다. `cache()`는 인자를 참조/개수로 비교하므로 `getPostBySlug(slug, includeDraft)`는 **항상 인자 2개를 원시값으로** 넘겨야 적중한다 (객체 인자로 바꾸면 매번 캐시 미스).

**Mutations**: Server Actions만 사용 (`"use server"`).
- `src/lib/post-actions.ts` — `updatePost(prev, FormData) → UpdatePostState` (form state 패턴)
- `src/app/admin/{posts,tags}/actions.ts` — 도메인별 admin 액션
- 포스트를 바꾸는 액션은 `updateTag` + `revalidatePath` 무효화를 반드시 포함 (위 캐싱 항목 참고)

**Server state**: React Query (`src/providers/query-provider.tsx`) — 기본값 `staleTime: 60_000`, `refetchOnWindowFocus: false`. `<QueryLoadingIndicator />`가 전역 로딩 상태 표시.

**Sort 불변식 (중요)**: `posts.sort_date`는 `COALESCE(published_at, created_at)`을 담는 generated column. 모든 목록 쿼리는 `(sort_date desc, created_at desc, id desc)`로 정렬해야 페이지네이션 중복/누락이 없음. mapper의 `date` 필드 의미가 `sort_date`와 어긋나면 "카드 표시일 ≠ 정렬일" 회귀가 재발함. 자세한 주석은 `src/lib/queries.ts:6-16`.

**DB schema/types**: 마이그레이션은 `supabase/migrations/` (Supabase CLI 워크플로우). 타입은 `src/lib/supabase/database.types.ts`에서 자동 생성.

**Diagrams**: `docs/diagrams/`에 시스템 아키텍처, 시퀀스(OAuth·무한 스크롤·좋아요), 흐름도, 상태 머신, DB 스키마, 권한 계층 다이어그램이 단일 HTML로 있음 (`index.html`에서 시작). 라우팅·인증·스키마를 바꾸면 해당 다이어그램도 함께 갱신.

### Component Conventions

- **Server components by default** — pages, footer, post-card, tag-badge
- **Client components** (`"use client"`) — header, auth-buttons, user-avatar, post-grid (infinite scroll), scroll-to-top, like-button, view-counter, copy-button
- **마크다운 렌더는 서버에서** — `markdown-content.tsx`는 서버 컴포넌트다. react-markdown/highlight.js를 클라 번들에 넣지 않기 위해, 복사 버튼만 `copy-button.tsx`로 분리해 클라이언트로 둔다. `"use client"`를 다시 붙이면 번들과 하이드레이션 비용 회귀.
- Components live in `src/components/`, one component per file

### Auth State

실제 Supabase Auth로 동작 중. 흐름:

- `src/providers/auth-provider.tsx` — `onAuthStateChange` 구독, zustand 스토어 동기화
- `src/stores/auth-store.ts` — `{ user, isLoading, setUser, setLoading }` (zustand)
- `src/lib/supabase/proxy.ts` — 모든 요청에서 `getUser()`로 토큰 갱신

**Admin gate**: 정식 헬퍼는 `src/lib/auth.ts`의 `ADMIN_EMAIL` / `isAdmin()` / `getCurrentUser()`다 (`getCurrentUser`는 `react.cache()`로 감싸져 요청당 Auth 왕복 1회). 현재 `app/posts/[slug]/page.tsx`만 이 헬퍼를 쓰고, 나머지 9개 파일은 여전히 각자 상수를 하드코딩한다 — `components/header.tsx`, `lib/post-actions.ts`, `app/posts/new/actions.ts`, `app/posts/[slug]/actions.ts`, `app/admin/{dashboard,posts,tags}/page.tsx`, `app/admin/{posts,tags}/actions.ts` (`rg "ADMIN_EMAIL = " src`로 확인, 총 10곳). 값 변경 시 모든 위치 동기화 필요. **새 코드는 `lib/auth.ts`를 import할 것** — 상수를 또 만들면 동기화 지점만 늘어난다.

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
- task 완료시 AGENTS.md 및 README.md 문서에 업데이트가 필요하면 진행한다.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
