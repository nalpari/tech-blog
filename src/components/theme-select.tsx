"use client";

import { useSyncExternalStore } from "react";
import { getServerTheme, getTheme, setTheme, subscribeToTheme } from "@/lib/theme";

export function ThemeSelect() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "다크 모드로 전환" : "라이트 모드로 전환";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded border border-border-strong! text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === "dark" ? (
          <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        )}
      </svg>
    </button>
  );
}
