# techlog

A quiet, reading-first personal tech blog. Built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Compiler) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Database) |
| State / Data | TanStack Query, Zustand |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Fonts | Pretendard (UI, headings, prose, dates), JetBrains Mono (code) |
| Package Manager | pnpm |

## Features

- **Posts**: Markdown content with syntax highlighting (highlight.js), GFM support, generated cover images
- **Tags**: Multi-tag posts, dedicated tag directory and filtered tag pages
- **Auth**: Email/social sign-in via Supabase, session refresh via proxy
- **Admin**: Post & tag management UI, draft/publish workflow, featured flag (admin email-gated)
- **Engagement**: View counter, like button (auth-required)
- **Search**: `Ctrl/Cmd + K` quick search modal
- **Home**: one-line intro, then posts grouped by year (date, title, excerpt, tags) with infinite scroll
- **Reading UX**: scroll-to-top, prose typography, header light/dark theme toggle (light by default) with saved preference

## Getting Started

### Prerequisites

- Node.js 20.18+ (Next.js 16 requirement)
- pnpm
- Supabase 프로젝트 (URL과 anon key)

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Create .env.local with the variables documented in the
# "Environment Variables" section below.
```

### Development

```bash
pnpm dev        # Start dev server at http://localhost:3000
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, header, footer)
│   ├── page.tsx            # Home — featured + latest posts
│   ├── about/              # About page
│   ├── posts/[slug]/       # Post detail — prose content
│   ├── tags/
│   │   ├── page.tsx        # Tag directory
│   │   └── [slug]/         # Tag detail — filtered posts
│   ├── (auth)/             # Sign in / Sign up (route group)
│   ├── auth/callback/      # OAuth callback handler
│   ├── admin/              # Admin dashboard, posts, tags (gated)
│   └── api/posts/[slug]/   # REST endpoint
├── components/             # Shared UI components
├── providers/              # AuthProvider, QueryProvider
├── stores/                 # Zustand stores (auth)
├── lib/
│   ├── data.ts             # Post/Tag types and mapper functions
│   ├── queries.ts          # Supabase read queries (paginated)
│   ├── post-actions.ts     # Server Actions for post mutations
│   └── supabase/           # Supabase client utilities
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client
│       ├── proxy.ts        # Session refresh logic
│       └── database.types.ts  # Generated DB types
└── proxy.ts                # Auth token refresh on all routes

supabase/
├── migrations/             # SQL migrations (Supabase CLI)
└── config.toml

docs/
└── diagrams/               # 아키텍처·시퀀스·흐름도·DB 스키마 다이어그램 (index.html)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | (Optional) Site origin for `metadataBase`. Defaults to `https://techlog.dev` |

이미지 외부 호스트는 `next.config.ts`에 등록되어 있음: `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `*.supabase.co`.

## Design

- **Concept**: quiet reading. No hero graphic, no cards, no entrance animation; just an intro line and the post list. Product facts live in `PRODUCT.md`, the design system in `DESIGN.md`.
- **Theme**: light by default, with a light (`#fcfcfd`) / dark (`#0e1013`) toggle in the header. The selection is saved locally and applied before the first paint; a single blue accent (`#2f5bea` / `#7c9cff`).
- **Typography**: Pretendard for everything (Korean-first, 17px / 1.85 prose in a 720px column), JetBrains Mono for code only.
- **Motion**: colour transitions on hover only; no entrance animation.

## Deploy

Deploy to [Vercel](https://vercel.com) with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/tech-blog)

Set the environment variables in your Vercel project settings.

### Database

Apply schema migrations with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Migrations live in `supabase/migrations/`.

### 2026-10-17 리뷰 수정 배포

앱을 배포하기 **전에** `my-notion-blog-comments` 프로젝트에 다음 마이그레이션을 순서대로 적용한다. 신규 저장·삭제 RPC를 사용하는 앱을 먼저 배포하면 해당 요청이 실패한다.

1. `20261017090000_harden_auth_and_engagement.sql`: 프로필 role 수정 권한 제한, 활동 RPC 신원·공개 상태 검증, 구형 RPC 제거, 좋아요 직렬화와 카운터 보정, 충돌 없는 가입 username 생성.
2. `20261017091000_atomic_post_mutations.sql`: 글·태그 트랜잭션 저장, 관리자 전용 삭제, 이미지 정리 대기열과 재시도.

기존 admin/author 역할은 자동으로 강등하지 않는다. 배포 전에 역할이 정당한지 확인한다. 앱의 `src/lib/auth.ts` 관리자 이메일과 DB의 관리자 판정도 함께 맞춰야 한다. 마이그레이션 파일 작성과 운영 DB 적용은 별개이며, 이 저장소 수정만으로 운영 DB가 변경되지는 않는다.

각 마이그레이션은 한 트랜잭션으로 적용한다. 권한 변경과 카운터 보정이 함께 반영돼야 하며, 좋아요 수 보정 중에는 글·좋아요 쓰기가 잠시 잠긴다. 기존 slug도 배포 전에 읽기 전용으로 점검한다.

```sql
select id, slug from public.posts
where length(slug) > 100 or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
```

이미지 파일은 글 삭제 성공 후 정리한다. 실패하거나 다른 글에서 참조하는 파일은 대기열에 보존하며, 관리자 글 목록의 이미지 정리 화면(`/admin/image-cleanup`)에서 재시도할 수 있다.

수정 내역과 검증 범위는 `docs/04-report/codebase-review-2026-10-17.md` 및 같은 이름의 HTML 문서에 기록한다.

### 회귀 검증

```bash
node --test scripts/*.mjs
pnpm lint
pnpm build
pnpm exec tsc --noEmit
```

SQL 검증은 테스트 DB에서 `supabase/tests/*.sql`을 실행한다. 운영 DB에서는 실행하지 않는다. Docker 없이 검증하려면 별도 임시 폴더에 `@electric-sql/pglite`를 설치하고, 그 모듈의 `dist/index.js` 절대 경로를 `PGLITE_MODULE` 환경변수로 지정한 뒤 `node supabase/tests/run-local.mjs`를 실행한다. PGlite는 단일 연결이므로 실제 동시 요청은 PostgreSQL isolationtester로 `supabase/tests/concurrent_likes.spec`을 별도 실행한다.

## License

Private project.
