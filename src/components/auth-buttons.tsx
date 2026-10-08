"use client";

import Link from "next/link";

export function AuthButtons() {
  return (
    <Link
      href="/sign-in"
      className="whitespace-nowrap text-[13px] font-medium text-muted hover:text-foreground transition-colors"
    >
      Sign in
    </Link>
  );
}
