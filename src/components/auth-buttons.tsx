"use client";

import Link from "next/link";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="font-mono text-[13px] text-muted hover:text-foreground transition-colors"
      >
        sign in
      </Link>
      <Link
        href="/sign-up"
        className="font-mono text-[13px] px-3 py-1.5 border border-accent text-accent hover:bg-accent hover:text-background transition-colors"
      >
        sign up
      </Link>
    </div>
  );
}
