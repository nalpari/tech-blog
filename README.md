# Spectra

Dark-themed tech blog inspired by [Linear](https://linear.app)'s design language. Built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, React Compiler) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Database) |
| Fonts | Geist Sans, Geist Mono, Instrument Serif |
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
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, header, footer)
│   ├── page.tsx            # Home — featured + latest posts
│   ├── about/              # About — team, values, origin story
│   ├── posts/[slug]/       # Post detail — prose content
│   └── tags/
│       ├── page.tsx        # Tag directory
│       └── [slug]/         # Tag detail — filtered posts
├── components/             # Shared UI components
│   ├── header.tsx          # Fixed nav with auth state
│   ├── footer.tsx          # Site footer
│   ├── post-card.tsx       # PostCard + FeaturedPostCard
│   ├── tag-badge.tsx       # Tag link badge
│   ├── auth-buttons.tsx    # Sign in / Sign up buttons
│   └── user-avatar.tsx     # Avatar with dropdown menu
├── lib/
│   ├── data.ts             # Mock post & tag data
│   └── supabase/           # Supabase client utilities
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client
│       └── middleware.ts   # Session refresh logic
└── middleware.ts           # Auth token refresh on all routes
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Design

- **Theme**: Dark-first with indigo/violet gradient accents
- **Typography**: Geist Sans (body), Instrument Serif (display accents)
- **Effects**: Glass morphism cards, noise overlay, stagger animations

## Deploy

Deploy to [Vercel](https://vercel.com) with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/tech-blog)

Set the environment variables in your Vercel project settings.

## License

Private project.
