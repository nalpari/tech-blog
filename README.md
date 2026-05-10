# techlog

Dark-themed tech blog inspired by [Linear](https://linear.app)'s design language. Built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Compiler) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Database) |
| State / Data | TanStack Query, Zustand |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Fonts | JetBrains Mono, IBM Plex Mono, Pretendard |
| Package Manager | pnpm |

## Features

- **Posts**: Markdown content with syntax highlighting (highlight.js), GFM support, generated cover images
- **Tags**: Multi-tag posts, dedicated tag directory and filtered tag pages
- **Auth**: Email/social sign-in via Supabase, session refresh via middleware
- **Admin**: Post & tag management UI, draft/publish workflow, featured flag (admin email-gated)
- **Engagement**: View counter, like button (auth-required)
- **Search**: `Ctrl/Cmd + K` quick search modal
- **Reading UX**: Infinite scroll, scroll-to-top, prose typography, dark theme

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
│       ├── middleware.ts   # Session refresh logic
│       └── database.types.ts  # Generated DB types
└── middleware.ts           # Auth token refresh on all routes

supabase/
├── migrations/             # SQL migrations (Supabase CLI)
└── config.toml
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | (Optional) Site origin for `metadataBase`. Defaults to `https://techlog.dev` |

이미지 외부 호스트는 `next.config.ts`에 등록되어 있음: `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `*.supabase.co`.

## Design

- **Theme**: Dark-first (`#0a0a0a` background) with single emerald accent (`#10b981`); secondary cyan (`#06b6d4`) and amber (`#f59e0b`) accents. No gradient system.
- **Typography**: IBM Plex Mono (body default, monospace-first aesthetic), Pretendard (post prose body, Korean), JetBrains Mono (code blocks and prose heading markers)
- **Effects**: `.stagger-children` fade-in cascade (1–6th children, 50ms steps), `.animate-fade-in-up` / `.animate-fade-in` single-shot fades

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

## License

Private project.
