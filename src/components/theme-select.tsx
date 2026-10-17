"use client";

import { useSyncExternalStore } from "react";
import {
  getServerThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
} from "@/lib/theme";

const themeLabels = { system: "시스템 설정", light: "라이트", dark: "다크" };

export function ThemeSelect() {
  const preference = useSyncExternalStore(subscribeToTheme, getThemePreference, getServerThemePreference);

  return (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border-strong! text-muted transition-colors hover:bg-surface hover:text-foreground focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {preference === "light" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : preference === "dark" ? (
          <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
        ) : (
          <>
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </>
        )}
      </svg>
      <select
        aria-label="화면 테마"
        title={`화면 테마: ${themeLabels[preference]}`}
        value={preference}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "system" || value === "light" || value === "dark") setThemePreference(value);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        <option value="system">시스템 설정</option>
        <option value="light">라이트</option>
        <option value="dark">다크</option>
      </select>
    </div>
  );
}
