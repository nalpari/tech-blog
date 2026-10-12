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
        className="inline-flex items-center h-8 px-3 whitespace-nowrap rounded bg-foreground text-background text-[13px] font-medium"
      >
        Sign up
      </Link>
    </div>
  );
}
