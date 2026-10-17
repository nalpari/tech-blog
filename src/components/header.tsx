"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButtons } from "@/components/auth-buttons";
import { UserAvatar } from "@/components/user-avatar";
import { SearchModal } from "@/components/search-modal";
import { Wordmark } from "@/components/wordmark";
import { ThemeSelect } from "@/components/theme-select";
import { showToast } from "@/lib/toast";

const ADMIN_EMAIL = "yoo32767@gmail.com";

const navItems = [
  { href: "/", label: "blog" },
  { href: "/tags", label: "tags" },
  { href: "/about", label: "about", comingSoon: true },
];

const navLinkClass =
  "text-[14px] transition-colors cursor-pointer";

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

  // SearchModal은 헤더 밖에 둔다. backdrop-filter·filter·transform이 걸린 헤더 안에 두면 안쪽 fixed
  // 요소의 기준점이 뷰포트가 아니라 헤더가 되어 오버레이가 헤더 영역만 덮는다. 지금은 블러가 없지만
  // 나중에 다시 붙어도 깨지지 않도록 형제로 유지한다.
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <nav className="h-14 flex items-center justify-between gap-2 px-[clamp(12px,2.6vw,48px)]">
          <div className="flex items-center gap-[clamp(8px,2vw,44px)]">
            <Link href="/" aria-label="techlog 홈" className="text-foreground">
              <Wordmark />
            </Link>

            <div className="flex items-center gap-[clamp(8px,1.5vw,32px)]">
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
                        ? "text-foreground font-semibold"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[clamp(6px,1.6vw,24px)]">
            <ThemeSelect />
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="flex items-center justify-center sm:justify-between gap-1.5 h-8 w-8 sm:w-[180px] sm:pl-2.5 sm:pr-2 rounded border border-border-strong! bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="hidden sm:inline text-[13px] mr-auto">Search</span>
              <kbd className="hidden sm:inline-flex items-center font-sans text-[11px] text-muted-foreground">
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
