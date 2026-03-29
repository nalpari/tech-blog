"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/lib/toast";

interface UserAvatarProps {
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export function UserAvatar({ name, email, avatarUrl, isAdmin }: UserAvatarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative size-7 flex items-center justify-center overflow-hidden border border-border hover:border-accent/50 transition-colors cursor-pointer focus:outline-none focus:border-accent"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-[10px] font-mono font-bold">
              {initials}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 border border-border bg-background shadow-2xl shadow-black/40 animate-fade-in overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-mono font-bold text-foreground truncate">
              {name}
            </p>
            <p className="text-xs font-sans text-muted-foreground truncate">
              {email}
            </p>
          </div>

          {/* Admin menu */}
          {isAdmin && (
            <div className="py-1 border-b border-border">
              <MenuLink
                href="/admin/dashboard"
                label="~ dashboard"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/posts/new"
                label="+ write"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/admin/posts"
                label="@ manage posts"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/admin/tags"
                label="# manage tags"
                onClick={() => setOpen(false)}
              />
            </div>
          )}

          {/* User menu */}
          <div className="py-1">
            <ComingSoonButton label="profile" onClick={() => setOpen(false)} />
            <ComingSoonButton label="bookmarks" onClick={() => setOpen(false)} />
            <ComingSoonButton label="settings" onClick={() => setOpen(false)} />
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-xs font-mono text-muted-foreground hover:text-red-400 hover:bg-card-hover transition-colors cursor-pointer"
            >
              sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center px-4 py-2 text-xs font-mono text-muted-foreground hover:text-accent hover:bg-card-hover transition-colors"
    >
      {label}
    </Link>
  );
}

function ComingSoonButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        onClick();
        showToast("준비중인 기능입니다.");
      }}
      className="w-full flex items-center px-4 py-2 text-xs font-mono text-muted-foreground hover:text-accent hover:bg-card-hover transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}
