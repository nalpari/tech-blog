"use client";

import Link from "next/link";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 shadow-sm shadow-indigo-500/20 hover:shadow-indigo-500/30"
      >
        Sign up
      </Link>
    </div>
  );
}
