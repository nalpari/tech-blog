# Spectra

Dark-themed tech blog built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Compiler) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Database, Storage) |
| State | Zustand (auth), TanStack React Query (data) |
| Markdown | react-markdown + rehype-highlight + remark-gfm |
| Fonts | JetBrains Mono, IBM Plex Mono, Pretendard Variable |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase project URL and anon key
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
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (fonts, providers, metadata)
│   ├── page.tsx                # Home — infinite scroll post grid
│   ├── about/                  # About page
│   ├── posts/
│   │   ├── [slug]/             # Post detail — markdown prose content
│   │   └── new/                # New post creation (admin)
│   ├── tags/
│   │   ├── page.tsx            # Tag directory
│   │   └── [slug]/             # Tag detail — filtered posts
│   ├── admin/posts/            # Admin post management
│   ├── (auth)/                 # Auth route group
│   │   ├── sign-in/            # Sign in page
│   │   └── sign-up/            # Sign up page
│   ├── auth/callback/          # OAuth callback handler
│   └── api/
│       └── posts/              # Post pagination, view & like APIs
├── components/                 # Shared UI components
│   ├── header.tsx              # Fixed nav with search & auth state
│   ├── footer.tsx              # Site footer
│   ├── post-card.tsx           # PostCard + FeaturedPostCard
│   ├── post-grid.tsx           # Infinite scroll with IntersectionObserver
│   ├── post-editor.tsx         # Markdown post editor
│   ├── search-modal.tsx        # Full-text search modal
│   ├── markdown-content.tsx    # Markdown renderer with syntax highlight
│   ├── like-button.tsx         # Post like interaction
│   ├── view-counter.tsx        # Post view counter
│   ├── scroll-to-top.tsx       # Floating scroll-to-top button
│   ├── tag-badge.tsx           # Tag link badge
│   ├── auth-buttons.tsx        # Sign in / Sign up buttons
│   └── user-avatar.tsx         # Avatar with dropdown menu
├── lib/
│   ├── data.ts                 # Type definitions & mapper functions
│   ├── queries.ts              # Supabase query functions with pagination
│   ├── post-actions.ts         # Server actions for post CRUD
│   ├── slug.ts                 # Slug generation utility
│   ├── toast.ts                # Custom toast notification system
│   ├── upload-image.ts         # Image upload to Supabase Storage
│   ├── utils.ts                # cn() — clsx + tailwind-merge
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client
│       ├── middleware.ts        # Session refresh logic
│       └── database.types.ts   # Generated TypeScript types
├── stores/
│   └── auth-store.ts           # Zustand auth state store
├── providers/
│   ├── auth-provider.tsx       # Supabase auth state listener
│   └── query-provider.tsx      # React Query provider
└── middleware.ts               # Auth token refresh on all routes
```

## Features

- **Infinite scroll** — Post grid with IntersectionObserver-based pagination
- **Authentication** — Supabase Auth with Google/GitHub OAuth and email/password
- **Admin dashboard** — Post creation, editing, and management
- **Markdown editor** — Write posts in markdown with live preview
- **Full-text search** — Search posts by title and content
- **View & Like counters** — Real-time engagement tracking
- **Syntax highlighting** — Code blocks with highlight.js
- **Scroll-to-top** — Floating button on long pages
- **Toast notifications** — Custom vanilla DOM toast system
- **SEO** — Open Graph and Twitter Card metadata

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Site URL for metadata (default: `https://techlog.dev`) |

## Design

- **Theme**: Dark-only with green (`#10b981`) and cyan (`#06b6d4`) accents
- **Typography**: JetBrains Mono (headings/nav), IBM Plex Mono (body), Pretendard Variable (prose)
- **Effects**: Fade-in-up animations, stagger children, custom scrollbar

## Deploy

Deploy to [Vercel](https://vercel.com) with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/tech-blog)

Set the environment variables in your Vercel project settings.

## License

Private project.
