# AGENTS.md — Spectra Tech Blog

Guidelines for AI agents working in this repository.

## Commands

```bash
pnpm dev              # Start dev server with Turbopack (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint (flat config)
```

No test framework is configured. If adding tests, use Vitest with `*.test.ts` pattern.

## Tech Stack

- **Next.js 16** — App Router, React Compiler enabled
- **React 19** — TypeScript 5 strict mode
- **Tailwind CSS v4** — `@import "tailwindcss"` and `@theme inline` syntax
- **Supabase** — Auth, database, storage
- **Zustand** — Auth state (`useAuthStore`)
- **TanStack Query** — Data fetching (60s stale time)
- **Package Manager** — pnpm

## Code Style Guidelines

### File Organization

- Server components by default (no directive)
- Client components: `"use client"` at file top
- One component per file in `src/components/`
- Path alias: `@/*` maps to `./src/*`

### Naming Conventions

- Components: PascalCase (`PostCard`, `Header`)
- Functions/variables: camelCase (`getPosts`, `formatDate`)
- Types/Interfaces: PascalCase
- Files: kebab-case (`post-card.tsx`)
- CSS classes: kebab-case

### TypeScript

- Strict mode enabled; avoid `any`
- Explicit return types on exported functions
- Use `type` for shapes, `interface` for extensible contracts
- Import types explicitly: `import type { Post } from "@/lib/data"`

### Import Order

1. External libraries (alphabetical)
2. Internal absolute imports (alphabetical by path)
3. Relative imports

```typescript
import { create } from "zustand";
import Link from "next/link";

import { AuthButtons } from "@/components/auth-buttons";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
```

### Component Patterns

```typescript
// Server component (default)
export function PostCard({ post }: { post: Post }) {
  return <article>...</article>;
}

// Client component
"use client";
export function Header() {
  const user = useAuthStore((s) => s.user);
  return <header>...</header>;
}
```

### Error Handling

- Server Actions: return `{ error?: string; fieldErrors?: Record<string, string> }`
- Use `isRedirectError` from `next/dist/client/components/redirect-error`
- Wrap async operations in try/catch
- Return user-friendly Korean error messages

### Server Actions Pattern

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function actionName(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    redirect("/path");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "예기치 않은 오류가 발생했습니다." };
  }
}
```

### Data Fetching

- Server: `createClient()` from `@/lib/supabase/server`
- Client: `createBrowserClient()` from `@/lib/supabase/client`
- React Query for client-side caching

### Styling

- Tailwind utilities + `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- CSS variables in `globals.css` for design tokens
- Dark-only theme; no light mode

### Key Files

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| `src/lib/data.ts`          | Types (`Post`, `Tag`) and mappers |
| `src/lib/queries.ts`       | Supabase query functions          |
| `src/lib/post-actions.ts`  | Server actions for post CRUD      |
| `src/lib/utils.ts`         | `cn()` utility                    |
| `src/lib/constants.ts`     | `ADMIN_EMAIL` constant            |
| `src/stores/auth-store.ts` | Zustand auth store                |
| `src/middleware.ts`        | Auth token refresh                |

### Admin Privileges

- Check: `user?.email === ADMIN_EMAIL`
- Only admin can create/edit posts and manage tags

### Before Completing Tasks

1. Run `pnpm lint` — fix all errors and warnings
2. Run `pnpm build` — verify no type errors
3. Update CLAUDE.md/README.md if architecture changes

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.
- task가 끝나면 에이전트 팀을 사용해서 린트체크, 타입체크, 빌드체크를 수행하고 완료되면 팀을 shutdown한다.
- 린트체크시 오류가 있으면 반드시 해결하고 넘어가도록 하고, 경고가 있더라도 해결하려고 노력한다.
- supabase 의 'my-notion-blog-comments' 프로젝트를 사용한다.
- 커밋시에 접두사는 영어로 나머지 타이틀과 내용은 한국어로 작성한다.
- task 완료시 CLAUDE.md 및 README.md 문서에 업데이트가 필요하면 진행한다.
