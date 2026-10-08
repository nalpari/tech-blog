"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButtons } from "@/components/auth-buttons";
import { UserAvatar } from "@/components/user-avatar";
import { SearchModal } from "@/components/search-modal";
import { Wordmark } from "@/components/wordmark";
import { showToast } from "@/lib/toast";

const ADMIN_EMAIL = "yoo32767@gmail.com";

const navItems = [
  { href: "/", label: "blog" },
  { href: "/tags", label: "tags" },
  { href: "/about", label: "about", comingSoon: true },
];

const navLinkClass =
  "text-[13px] font-medium transition-colors duration-200 cursor-pointer";

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

  // SearchModal은 헤더 밖에 둔다. backdrop-filter가 걸린 헤더 안에 두면 안쪽 fixed 요소의
  // 기준점이 뷰포트가 아니라 헤더가 되어 오버레이가 헤더 영역만 덮는다.
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-md">
        <nav className="h-14 flex items-center justify-between px-[clamp(16px,2.6vw,48px)]">
          <div className="flex items-center gap-[clamp(14px,3vw,44px)]">
            <Link href="/" aria-label="techlog 홈" className="text-foreground">
              <Wordmark />
            </Link>

            <div className="flex items-center gap-[clamp(12px,2.2vw,32px)]">
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
                      className={`${navLinkClass} text-muted hover:text-foreground`}
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`${navLinkClass} ${
                      isActive
                        ? "text-foreground underline decoration-accent decoration-2 underline-offset-[10px]"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-[clamp(10px,1.6vw,24px)]">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="relative -top-[1.25px] sm:mr-0.5 flex items-center justify-center sm:justify-between gap-1.5 h-[26.5px] w-7 sm:w-[179px] sm:pl-2 sm:pr-2.5 rounded-full border border-border-strong! bg-card/60 text-muted hover:text-foreground hover:border-muted transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="hidden sm:inline text-[12.5px] font-medium mr-auto">Search</span>
              <kbd className="hidden sm:inline-flex items-center h-4 px-1 rounded-[3px] bg-foreground/10 font-sans text-[10.5px] font-medium text-muted">
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
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
