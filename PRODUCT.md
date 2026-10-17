# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: fellow developers. They arrive by search or a shared link, read one technical post (mostly Korean, with English terms and code), and often keep or revisit it. Their job is to understand a technique and copy the code that works. The owner (single author, admin-gated) also uses the site as their own retrievable archive, but readers set the first-impression bar.

## Product Purpose

techlog is one engineer's personal blog for accumulating technical knowledge: how-tos, guides and migration notes on AI tooling (Claude Code), the React/Next.js/TypeScript stack, Java/Spring Boot, and infra (Docker, Git). Success: a visitor finds the post they need, reads it comfortably to the end, and returns; the author's growing body of work stays easy to scan.

## Positioning

A quiet personal tech blog where the writing reads well. No hero graphic or visual concept competes with the text: an intro line, a plain list of posts, and comfortable reading pages. The earlier data-drawn home visual has been retired.

## Operating Context

- Single author; posts are Markdown, written and published through an in-app editor (draft/publish workflow, featured flag), admin-gated by email.
- Posts carry tags (many-to-many), publish date, an optional read time, view and like counters, and an optional cover image or gradient.
- Reader features that must keep working: infinite-scroll listing, Ctrl/Cmd+K search modal, tag directory and tag pages, like (sign-in required), view counting, Supabase Auth sign-in/sign-up (OAuth), syntax-highlighted code with a copy button.
- Server-rendered dynamic routes with query-level caching of published posts; Markdown renders on the server (no markdown/highlighter code in the client bundle).

## Capabilities and Constraints

- Routes, slugs and primary nav labels (`blog`, `tags`, `about`) stay stable. `about` is still "coming soon" (a toast in the header); do not invent its content.
- Site name stays `techlog` (`SITE_NAME`). The `>` prompt mark and `// comment` labels are retired; the logo is the text wordmark `techlog`.
- Lists and cards use `PostSummary` and explicit selected columns, never `select("*")` or post content.
- Design tokens live in `src/app/globals.css` (Tailwind v4, `@theme inline`), double-mapped with `:root`; renaming a token means editing both.
- Undecided / open: `read_time` is populated on only 6 of 25 published posts, so nothing may depend on it alone; whether an `about` page will be written.

## Brand Commitments

- Name: techlog (kept). Logo: the text wordmark `techlog` (no separate mark).
- Tone: quiet and reading-first; light theme by default, with a persistent light/dark toggle in the header.

## Evidence on Hand

- 25 published posts (plus drafts) with dates from 2025-08-06 to 2026-03-12, 18 distinct tags; largest tag families: AI (6), Claude Code (6), Next.js (5), React (5), JAVA (5), SpringBoot (4), Javascript (4). Source of truth is the Supabase `posts`/`tags` tables; an export sits at `notion-posts-export.json`.
- No logo image file, no cover-image library, no testimonials, no analytics or reader counts to cite. Do not fabricate any of these.

## Product Principles

1. Reading comes first. Every page serves comprehension of the text; nothing decorative competes with it.
2. An intro line and a list, nothing more. The home page is a one-line introduction and posts grouped by year.
3. It must work at 25 posts and at 250. The layout cannot depend on the post count or on optional fields (read time, cover image) being filled.
4. Korean-first typography: mixed Hangul, Latin and code set with intent, a 720px measure and generous line height.
5. Performance and accessibility are part of the design: fast first paint, server-rendered content, reduced motion respected, keyboard usable.

## Accessibility & Inclusion

Reduced motion must collapse any animation to a static state. WCAG AA (including both light and dark token sets) contrast minimum; visible focus for keyboard users.
