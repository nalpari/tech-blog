---
name: techlog
description: A quiet, reading-first personal engineering blog. System theme by default with saved light/dark choices, one blue accent, and Pretendard throughout.
colors:
  paper: "#fcfcfd"
  paper-dark: "#0e1013"
  ink: "#14161a"
  ink-dark: "#e8eaee"
  surface: "#f3f4f6"
  surface-dark: "#16191e"
  surface-hover: "#eceef1"
  surface-hover-dark: "#1c2026"
  muted: "#5b6270"
  muted-dark: "#9aa1ad"
  muted-faint: "#686f7d"
  muted-faint-dark: "#828a98"
  rule: "#e6e8ec"
  rule-dark: "#23272e"
  rule-strong: "#c9cdd4"
  rule-strong-dark: "#3a4049"
  rule-faint: "#f0f1f4"
  rule-faint-dark: "#1a1d22"
  accent: "#2f5bea"
  accent-dark: "#7c9cff"
  accent-cyan: "#0e7490"
  accent-cyan-dark: "#7fc4c0"
  draft-amber: "#b45309"
  draft-amber-dark: "#f59e0b"
  hl-keyword: "#8250df"
  hl-keyword-dark: "#d2a8ff"
  hl-string: "#116329"
  hl-string-dark: "#7ee787"
  hl-number: "#953800"
  hl-number-dark: "#ffa657"
  hl-title: "#0550ae"
  hl-title-dark: "#79c0ff"
  hl-built-in: "#0b6e79"
  hl-built-in-dark: "#56d4dd"
  hl-deletion: "#b42318"
  hl-deletion-dark: "#ff7b72"
typography:
  page-title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px (36px from sm)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  list-title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1.0625rem (17px)"
    fontWeight: 400
    lineHeight: 1.85
  excerpt:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "13px to 14px"
    fontWeight: 400
    fontFeature: "tabular-nums (dates)"
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875em inline, 0.875rem block"
    lineHeight: 1.7
rounded:
  default: "6px"
  large: "12px"
  code-block: "8px"
spacing:
  header-height: "56px"
  reading-column: "720px"
  page-x: "clamp(20px, 4vw, 40px)"
  header-x: "clamp(16px, 2.6vw, 48px)"
  list-row-gap: "2.25rem"
  year-gap: "3rem"
components:
  tag-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.default}"
    padding: "4px 10px"
    fontSize: "13px"
  tag-badge-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    borderColor: "{colors.rule-strong}"
    rounded: "{rounded.default}"
    height: "32px"
    width: "180px (32px icon-only below sm)"
  search-modal:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.large}"
    width: "max 600px"
  header:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.rule}"
    height: "56px"
---

# Design System: techlog

## Overview

**Creative North Star: "Quiet Reading"**

techlog gets out of the way of the writing. There is no hero graphic, no card grid and no entrance animation: the home page is a one-line introduction and a list of posts grouped by year, and a post page is a title, a meta line and the text in a 720px column.

The header offers system, light, and dark themes. System is the default; the choice is saved as `techlog-theme` in localStorage. A synchronous head script resolves the preference before first paint. The html `data-theme` attribute selects the actual palette and Tailwind `dark:` utilities. OS changes apply while system is selected; explicit choices take precedence. The media query supplies a system-dark fallback when JavaScript is unavailable. All tokens live in `src/app/globals.css`, mapped to Tailwind through `@theme inline`.

**Key Characteristics:**
- One blue accent for links, focus and hover; everything else is ink, grey and hairlines.
- Pretendard for every surface, including dates; JetBrains Mono only for code.
- Flat surfaces separated by 1px rules; the search modal is the only element with a shadow.
- Lists show date, title, excerpt and tags only. Views, likes and read time appear on the post page.

## Colors

Each token has a light and a dark value (light / dark below). Text colours clear WCAG AA (4.5:1) on that theme's background and surface.

### Accent
- **Accent** (#2f5bea / #7c9cff): prose links (40% underline, full on hover), focus ring (2px, offset 2px), list title hover, loading spinner, selection tint (22%).
- **Accent cyan** (#0e7490 / #7fc4c0): defined token, secondary accent.
- **Draft amber** (#b45309 / #f59e0b): draft banner and draft label only.

### Neutral
- **Paper** (#fcfcfd / #0e1013): page and header background.
- **Ink** (#14161a / #e8eaee): foreground text, headings.
- **Surface** (#f3f4f6 / #16191e): inline code, code blocks, tag badges, search field, table row hover. **Surface hover** (#eceef1 / #1c2026).
- **Muted** (#5b6270 / #9aa1ad): dates, excerpts, tags, nav, blockquote, code comments. **Muted faint** (#686f7d / #828a98): placeholders, key hints.
- **Rule** (#e6e8ec / #23272e): default border (global `* { border-color }`). **Rule strong** (#c9cdd4 / #3a4049): search field, blockquote rule, table header, scrollbar thumb. **Rule faint** (#f0f1f4 / #1a1d22).

### Code highlight
highlight.js theme CSS is not imported. `.hljs-*` rules in `globals.css` read `--hl-keyword`, `--hl-string`, `--hl-number`, `--hl-title`, `--hl-built-in` and `--hl-deletion` (values in the front matter); comments use Muted, variables use Ink.

### Named Rules
**The One Accent Rule.** Blue is the only interactive colour. Amber is status, never interaction.

## Typography

**All text:** Pretendard Variable, loaded from the jsDelivr CDN `<link>` in `layout.tsx` (`--font-sans`).
**Code:** JetBrains Mono through `next/font`, exposed as `--font-jetbrains-mono`.

### Hierarchy
- **Page title** (700, 28px / 36px from sm, 1.25, -0.02em, `text-balance`): home intro line, post title, tag pages.
- **List title** (600, 20px, snug, -0.02em): each post row; turns accent on hover.
- **Body** (400, 17px, 1.85, `word-break: keep-all`): `.prose-blog`. Prose headings 700 at 1.75, 1.5, 1.25rem, -0.02em, `text-balance`.
- **Excerpt** (15px, relaxed, Muted, two lines, max 62ch).
- **Label** (13px to 14px, Muted): dates (`tabular-nums`), tags, nav (14px; active is Ink 600), year headings (14px 600).

### Named Rules
**The Mono Is Code Rule.** JetBrains Mono appears only in code. Dates are Pretendard with tabular numerals.

## Layout

The header is fixed, 56px (`h-14`), solid Paper with a bottom rule; pages offset by `pt-14`. It holds the `techlog` text wordmark, the `blog` / `tags` / `about` nav, the search field and the account control.

Reading pages (home, post, tag directory, tag detail) share a 720px column. The home list groups posts by year: a Muted year heading, then rows 2.25rem apart; years after the first are separated by a top rule. From md up, a row is a two-column grid: `MM.DD` in a 4.5rem column, then title, excerpt and tags. Below md the date sits on its own line above the title; related-post lists on the post page use the full `YYYY.MM.DD` on its own line. The footer is a 1280px row with the compact wordmark and a one-line note.

## Elevation & Depth

Flat. Surfaces are separated by 1px rules and the Surface tone. The search modal is the only raised layer (`shadow-xl` over a 50% black backdrop), rendered as a sibling of `<header>` so its fixed overlay is anchored to the viewport.

## Shapes

`--radius` 6px for badges, the search field and the draft banner; `--radius-lg` 12px for the search modal and the cover image; code blocks and prose images 8px.

## Components

### Post row
The title link stretches over the whole row, so the row is one target. Date, title, a two-line excerpt and tag names (plain text, no badges). No counts.

### Post header
Title, then a meta line: date, read time (when present), view counter and like button, with admin edit and delete aligned right. Tag badges follow.

### Tag badge
Surface background, Muted 13px text, 6px radius; hover to Surface hover and Ink.

### Search
A 180px field (32px icon-only below sm) with a strong rule, a `Search` label and a `Ctrl K` hint; opens the modal on click or Ctrl/Cmd+K.

### Prose
Ink text, accent links, inline code on Surface with a 6px radius, code blocks on Surface with 8px radius and no border, blockquote with a 2px strong left rule in Muted, tables with a strong header rule and Surface row hover.

## Do's and Don'ts

### Do:
- **Do** keep the list to date, title, excerpt and tags; put counts and read time on the post page.
- **Do** keep the light `:root`, explicit dark `[data-theme="dark"]`, and system-dark media fallback token values consistent.
- **Do** write custom-CSS font references as `var(--font-jetbrains-mono)`; `@theme inline` variables are not emitted to `:root` unless a utility uses them.
- **Do** suffix border colour utilities with `!` (`border-border-strong!`); the global `* { border-color }` outranks them.

### Don't:
- **Don't** add a hero graphic, cards or entrance animations to reading pages.
- **Don't** introduce a second accent colour for interaction.
- **Don't** set dates or UI text in mono.
- **Don't** make the layout depend on post count or on optional fields being filled.
