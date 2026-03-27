"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButtons } from "@/components/auth-buttons";
import { UserAvatar } from "@/components/user-avatar";
import { SearchModal } from "@/components/search-modal";
import { showToast } from "@/lib/toast";

import { ADMIN_EMAIL } from "@/lib/constants";

const navItems = [
  { href: "/", label: "blog" },
  { href: "/tags", label: "tags" },
  { href: "/about", label: "about", comingSoon: true },
];

export function Header() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <nav className="mx-auto max-w-[1200px] px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-accent font-mono text-xl font-bold">
              &gt;
            </span>
            <span className="text-foreground font-mono text-lg font-medium">
              techlog
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              if (item.comingSoon) {
                return (
                  <button
                    key={item.href}
                    onClick={() => showToast("준비중인 기능입니다.")}
                    className="font-mono text-[13px] transition-colors duration-200 text-muted hover:text-foreground cursor-pointer"
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-[13px] transition-colors duration-200 ${
                    isActive
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground text-[13px] font-mono transition-colors cursor-pointer"
          >
            <span className="text-muted">/</span>
            <span>search...</span>
            <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 text-[10px] text-muted border border-border bg-background">
              Ctrl K
            </kbd>
          </button>

          {isLoading ? (
            <div className="size-7 rounded-full bg-border animate-pulse" />
          ) : user ? (
            <UserAvatar
              name={displayName}
              email={user.email || ""}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
            />
          ) : (
            <AuthButtons />
          )}
        </div>
      </nav>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
