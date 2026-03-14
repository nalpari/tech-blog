"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButtons } from "@/components/auth-buttons";
import { UserAvatar } from "@/components/user-avatar";

const navItems = [
  { href: "/", label: "Blog" },
  { href: "/tags", label: "Topics" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/50" />
      <nav className="relative mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
            <span className="text-white font-bold text-sm tracking-tight">
              S
            </span>
          </div>
          <span className="text-foreground font-semibold tracking-tight text-[15px]">
            Spectra
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-foreground bg-white/[0.06]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="w-px h-4 bg-border/60 mx-2" />

          <button className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 hover:border-border text-muted-foreground hover:text-foreground text-[13px] transition-all duration-200 bg-white/[0.02] hover:bg-white/[0.04]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-50 group-hover:opacity-70 transition-opacity"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-muted-foreground/60 font-mono">
              ⌘K
            </kbd>
          </button>

          {user?.email === "yoo32767@gmail.com" && (
            <>
              <div className="w-px h-4 bg-border/60 mx-2" />
              <Link
                href="/posts/new"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === "/posts/new"
                    ? "text-foreground bg-white/[0.06]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
                </svg>
                <span className="hidden sm:inline">Write</span>
              </Link>
            </>
          )}

          <div className="w-px h-4 bg-border/60 mx-2" />

          {isLoading ? (
            <div className="size-8 rounded-full bg-white/[0.04] animate-pulse" />
          ) : user ? (
            <UserAvatar
              name={displayName}
              email={user.email || ""}
              avatarUrl={avatarUrl}
            />
          ) : (
            <AuthButtons />
          )}
        </div>
      </nav>
    </header>
  );
}
