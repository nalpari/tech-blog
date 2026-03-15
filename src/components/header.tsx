"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthButtons } from "@/components/auth-buttons";
import { UserAvatar } from "@/components/user-avatar";

const navItems = [
  { href: "/", label: "blog" },
  { href: "/tags", label: "tags" },
  { href: "/about", label: "about" },
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
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground text-[13px] font-mono transition-colors cursor-pointer">
            <span className="text-muted">/</span>
            <span>search...</span>
          </button>

          {user?.email === "yoo32767@gmail.com" && (
            <Link
              href="/posts/new"
              className={`font-mono text-[13px] transition-colors duration-200 ${
                pathname === "/posts/new"
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              + write
            </Link>
          )}

          {isLoading ? (
            <div className="size-7 rounded-full bg-border animate-pulse" />
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
