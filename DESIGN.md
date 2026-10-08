---
name: techlog
description: A personal engineering blog drawn as a stratigraphic core section, where every published post is one bed of mineral-coloured rock on a deep ink ground.
colors:
  ink-ground: "#081818"
  core-surface: "#0d2020"
  core-surface-hover: "#132a2a"
  ore-white: "#f2f4f3"
  survey-grey: "#9aa9b5"
  survey-grey-dim: "#758790"
  hairline: "#263838"
  hairline-strong: "#74879a"
  hairline-faint: "#142629"
  ochre-accent: "#e2b04a"
  patina-cyan: "#7fc4c0"
  draft-amber: "#f59e0b"
  bed-ochre: "#9a6d2e"
  bed-teal: "#33797a"
  bed-rust: "#9a5339"
  bed-violet: "#575989"
  bed-bone: "#d8d7c7"
  bed-slate: "#76848e"
  hero-cta-fill: "#eaeae9"
  hero-cta-ink: "#09181f"
typography:
  hero-title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 7.6vw, 40px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  post-title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "3xl to 4xl (30px / 36px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  log-title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  bed-title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "15px (14.5px on mobile), scales with the SVG"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "12px to 13px"
    fontWeight: 500
  survey-mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px to 13px"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  rect: "2px"
  code-block: "0px"
  pill: "9999px"
spacing:
  hero-inset: "20px"
  log-gutter: "2rem"
  page-x: "clamp(20px, 2.6vw, 48px)"
  log-row-gap: "2.5rem"
components:
  hero-cta:
    backgroundColor: "{colors.hero-cta-fill}"
    textColor: "{colors.hero-cta-ink}"
    rounded: "{rounded.rect}"
    height: "42px"
    padding: "0 22px"
  hero-cta-hover:
    backgroundColor: "{colors.ochre-accent}"
  tag-badge:
    textColor: "{colors.survey-grey}"
    rounded: "{rounded.rect}"
    padding: "2px 8px"
  search-field:
    backgroundColor: "{colors.core-surface}"
    textColor: "{colors.survey-grey}"
    rounded: "{rounded.pill}"
    height: "26.5px"
    width: "179px"
  lamina-tip:
    backgroundColor: "{colors.ink-ground}"
    textColor: "{colors.ore-white}"
    padding: "6px 10px"
---

# Design System: techlog

## Overview

**Creative North Star: "The Core Log"**

techlog is drawn as a geological survey sheet and drill-core log. The blog is the section: one published post is one bed, newest on top, stacked by date, coloured by tag cluster. A deep mineral-ink ground carries brightly lit rock beds the way a core scan glows against a dark tray. Everything else is quiet survey furniture: hairline rulers, mono dates, leader lines, and a log of posts hung off a core column.

The system has one loud moment, the home first viewport, where beds settle into place once. Every other surface (tags, post detail, the month log) is calm, flat and reads-first, and shares only the ground, the mineral colours and the survey vocabulary. Colour is always data: a slot colour means a tag cluster, never decoration.

The approved comp (`.impeccable/mocks/comp-a-crosssection.png`) is the composition reference only. The build binds real Supabase data and departs from the comp in the ways listed under Do's and Don'ts.

**Key Characteristics:**
- Ink ground with a mirror-tiled paper-grain plate; no cards, no soft panels.
- Six mineral bed slots carry all categorical colour; the ochre accent carries all interaction.
- Pretendard for every Korean-first reading surface; JetBrains Mono only for survey numerals (dates, depth ticks, month labels).
- 2px rectangles everywhere except the pill search field.
- One motion moment: beds settle oldest-first on load, then stillness.

## Colors

A deep teal-black ground, one warm ochre accent, and six rock colours that appear only as tag-cluster data.

### Primary
- **Ochre Accent** (#e2b04a): links in prose, focus ring (2px), active nav underline, hover fill of the hero CTA, list markers, table header rule, loading spinner. The only interactive colour.

### Secondary
- **Patina Cyan** (#7fc4c0): inline code text only.
- **Draft Amber** (#f59e0b): the draft banner and draft label on post pages only.

### Tertiary (mineral bed slots)
Slots `.f0` to `.f5` are assigned by tag post-count rank: the top five tags take slots 0 to 4, every other tag takes slot 5. Each slot defines `--bed`, `--bed-2`, `--bed-3` (the three tones cycled inside one cluster to make banding) and `--bed-fg` (text on the bed).
- **Ochre Bed** (#9a6d2e; tones #936629, #8b6026; text #f2f4f3): slot 0. Darkened from the comp so white title text passes AA.
- **Teal Bed** (#33797a; #276163, #1f5153; text #f2f4f3): slot 1.
- **Rust Bed** (#9a5339; #8a4832, #7a3f2b; text #f2f4f3): slot 2.
- **Violet Bed** (#575989; #4d4f7b, #43456d; text #f2f4f3): slot 3.
- **Bone Bed** (#d8d7c7; #e4e3d6, #cccab6; text #0b1a17): slot 4. Dark text.
- **Slate Bed** (#76848e; #8b98a1, #6a7882; text #0b1a17): slot 5, "other". Dark text.

### Neutral
- **Ink Ground** (#081818): page background, under the ground plate.
- **Core Surface** (#0d2020) and **Core Surface Hover** (#132a2a): code blocks, search field, the only raised tone.
- **Ore White** (#f2f4f3): foreground text, hero surface line (at 50%), lamina marker.
- **Survey Grey** (#9aa9b5): body text in prose, secondary text, dates, ticks, legend labels.
- **Survey Grey Dim** (#758790): meta lines in the log (dates, counts, likes).
- **Hairline** (#263838): default border; **Hairline Strong** (#74879a): tag badge, search field and tooltip borders; **Hairline Faint** (#142629).
- **Hero CTA** (#eaeae9 fill, #09181f ink): the one near-white button.

### Named Rules
**The Colour Is Data Rule.** A bed colour appears only where a tag cluster or a post's primary tag is being shown (hero beds, legend, log core, swatches). Never use a slot colour for buttons, decoration or status.
**The One Warm Voice Rule.** Ochre is the only interactive colour. The ochre bed slot is a darker, separate value and must not be used as the accent.

## Typography

**Display Font:** Pretendard Variable (with Pretendard, system sans)
**Body Font:** Pretendard Variable, loaded from the jsDelivr CDN `<link>` in `layout.tsx`
**Label/Mono Font:** JetBrains Mono through `next/font`, exposed as `--font-jetbrains-mono`

**Character:** Korean-first, keep-all word breaks, tight tracking on bold titles. Mono is reserved for numerals that read like survey annotations.

### Hierarchy
- **Hero title** (700, clamp(28px, 7.6vw, 40px), 1.2; desktop max(26px, 2.8u)): the home statement, two lines, `keep-all`.
- **Post title** (700, 30px to 36px, 1.2, tracking tight, `text-balance`): post detail.
- **Log title** (600, 17px, 1.375): each row in the month log; hover turns ochre.
- **Bed title** (600, 15px / 14.5px mobile, -0.01em): set on the bed's centreline via textPath, with a 3px halo in the bed colour so the plate texture never fights the glyphs.
- **Body** (400, 1rem, 1.8, `keep-all`, measure 720px column): post prose; prose headings 700 at 1.75, 1.5, 1.25rem.
- **Label** (500, 12px to 13px): nav, tag badges, legend.
- **Survey mono** (500, 11px to 13px, tabular-nums): dates on beds, tooltip time, depth ticks (max(10px, 0.76u)), month headings in the log.

### Named Rules
**The Numerals Are Survey Rule.** Dates, depth ticks and month labels are JetBrains Mono with tabular-nums. Prose, titles and UI text are never mono, except code.

## Layout

Home is a 16:9 frame on desktop. At 1100px and above, `.hero` is `100u` wide and `56.55u` tall where the frame unit is `--u: min(1cqw, 1dvh * 1.7684)`. It is anchored to the container (`.hero-root` is a size container), never to `100vw`, so a scrollbar cannot cause horizontal overflow. Regions are placed by percentage of the frame: title (left 2.6%, top 12.5%), CTA (top 25.13%), ground surface line (top 33.42%), depth ruler (left 1.7%, width 4.4%), strata column (left 6.7%, width 82%), legend (left 88.7%, width 11.3%). Text sizes inside the frame scale with `u` and have px floors.

Below 1100px the hero becomes a flowed stack: title, CTA, surface line, then a narrow bed list. The narrow list is a separate layout (title and date on two lines per bed) rendered in parallel and toggled by CSS, and the ruler and legend are hidden.

Titled beds are the newest 8 posts; older posts compress into a laminae band, a thin-strata strip at the bottom of the column (about 25% of the height on desktop). Bed thickness is a modest read-time weight (up to +/-25%, 7 minutes assumed when missing), so nothing depends on read time.

Below the hero, posts continue as the log: a single centred column (max 900px) of month sections, each a `5.5rem` sticky mono month label beside a list with a `2rem` left gutter that holds the core column. Rows are separated by 2.5rem. Post detail uses a 1024px shell with a 720px reading column. Tags directory uses a 1280px shell and a 1/2/3 column grid. The fixed header is 56px (`pt-14` on pages).

## Elevation & Depth

Flat, tonal and hairline-driven. There are no drop shadows anywhere. Depth is expressed by the section metaphor itself: bed tops carry a 1px white 22% lip, bed edges a 1px ground-colour 55% stroke, laminae are separated by 0.7px ground strokes, and the hovered bed lifts 5px. The header is the only translucent layer (ground at 70% with a backdrop blur). The tooltip is ground at 94% with a strong hairline.

### Named Rules
**The Flat Rock Rule.** Surfaces are flat at rest. Lift is a 5px translate on a hovered bed, never a shadow.

## Shapes

Hard geometry. Rectangles, buttons, tag badges, swatches (8px squares) and images take a 2px radius; code blocks and prose images take none. The single rounded form is the pill search field. Bed silhouettes are folded parallel strata (a shared anticline axis and ripple phase, deterministic, no randomness); the core column is an 8px-wide vertical strip textured with the bed plate of the post's primary tag. The wordmark is a mark of three offset stacked bars plus lowercase `techlog` in 800 weight.

## Components

### Strata hero (signature)
Each titled bed is a link (an `<a>` around an SVG) with a base fill, a texture plate on top, an edge, a lip, a centreline title and a mono date. Textures are the cut plates `public/assets/plates/bed-{slot}-{variant}.webp`, cropped from the approved comp (the `.webp.json` sidecars record the origin: cropped patch, mirror-tiled or periodic tile, not generated). The three tones inside a cluster alternate: base plate, alternate plate, then the third tone darker via brightness and contrast filters and the `--bed-3` fill. Hover or keyboard focus lifts the bed 5px; focus adds a 2px foreground edge. A depth ruler (hairline rule, minor ticks at each bed top, mono month ticks) sits left; a legend of leader line, swatch and tag name sits right. Both annotations fade in after the beds land.

### Lamina picker
A transparent layer over the laminae band. Mouse: move to pick, click to open. Touch: tap to raise the tooltip link. Keyboard: up and down arrows pick, Enter opens, Escape clears. A 2px mark spans the column at the picked lamina and a tooltip (title truncated with ellipsis, mono date) sits beside it, 1px strong hairline, no radius.

### Hero CTA
The latest-post button: near-white rectangle, 2px radius, 42px tall, 14px 700 dark ink. Hover fills ochre; press moves 1px down.

### Log row
Title link stretches over the whole row. Under it: a two-line excerpt (62ch max), a meta line (mono date, then one 8px bed-coloured swatch plus name per tag) and counts. The 8px core strip at the row's left takes the primary tag's plate texture and spans that post's segment.

### Tag badge
Text on a strong hairline, 2px radius, 12px, survey grey; hover brightens text and border.

### Search field
Pill, 179px wide on desktop (icon-only on mobile), strong hairline, `Search` label and a `Ctrl K` key hint; opens the modal on click or Ctrl/Cmd+K.

### Navigation
Header wordmark plus `blog`, `tags`, `about` at 13px 500. Active item is foreground text with a 2px ochre underline offset 10px; others survey grey. `about` is coming soon and shows a toast.

### Prose
Post body: survey grey text, headings foreground, links ochre with 40% underline, code cyan on a faint chip, code blocks on Core Surface with a hairline and no radius, blockquote a 1px strong-hairline left rule, table header a 2px ochre rule.

## Do's and Don'ts

### Do:
- **Do** derive every large visual element from real posts, tags and dates; colour, order, legend and depth ticks come from the data.
- **Do** keep the ochre accent as the only interactive colour, and set beds, swatches and the core column from the slot variables.
- **Do** put dates and depth numerals in JetBrains Mono with tabular-nums, and Korean text in Pretendard with `keep-all`.
- **Do** run the settle animation once, oldest bed first (60ms stagger, 0.9s, translateY(-26px) and fade), and set `animation: none` and no lift transition under `prefers-reduced-motion`.
- **Do** carry a text alternative for the hero: beds are real links, the latest-post CTA is a link, and the month log lists every post.
- **Do** write custom-CSS font references as `var(--font-jetbrains-mono)` directly. `@theme inline` variables are not emitted to `:root` unless a utility uses them, so `var(--font-mono)` is empty in custom CSS.
- **Do** suffix border colour utilities with `!` (`border-border-strong!`). The global `* { border-color: var(--border) }` outranks Tailwind border colour utilities.
- **Do** keep any `position: fixed` element (scroll-to-top and similar) outside `.hero-root`; its `container-type: inline-size` re-anchors fixed children.

### Don't:
- **Don't** use cards, rounded SaaS panels, soft shadows or gradients; the section is flat.
- **Don't** use radii above 2px except the pill search field.
- **Don't** use `100vw` for frame sizing; use the container unit `u`.
- **Don't** use a slot colour for anything that is not a tag cluster, or bring back a separate legend-to-colour mapping like the comp's inconsistent one.
- **Don't** apply a hue-rotate to derive a third tone; that idea was dropped, and tones now come from the `--bed-2`, `--bed-3` values.

### Intentional deviations from the approved comp
- Titles, dates, formation hues and legend entries are bound to real Supabase data, not the comp's text; the comp's inconsistent colour mapping is not reproduced.
- Ochre is darkened (#9a6d2e) so white text on it clears AA.
- The comp is a composition reference only; the owner lowered its authority, so the build wins where they disagree.
- The archive shows all published posts: 8 titled beds plus compressed laminae, beyond the comp's fixed set.
