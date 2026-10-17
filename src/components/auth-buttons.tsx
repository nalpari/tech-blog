"use client";

import Link from "next/link";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="hidden sm:inline whitespace-nowrap text-[13px] font-medium text-muted hover:text-foreground transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        title="Sign up"
        className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded bg-foreground text-background text-[13px] font-medium min-[360px]:w-auto min-[360px]:px-3"
      >
        <svg className="min-[360px]:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2m4-13v6m-3-3h6" />
        </svg>
        <span className="sr-only min-[360px]:not-sr-only">Sign up</span>
      </Link>
    </div>
  );
}
