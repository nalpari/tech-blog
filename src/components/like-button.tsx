"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

function HeartIcon({
  size = 16,
  filled = false,
}: {
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function LikeButton({
  slug,
  initialCount,
  initialLiked = false,
  compact = false,
}: {
  slug: string;
  initialCount: number;
  initialLiked?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [count, setCount] = useState(initialCount);
  // 좋아요 상태는 서버 렌더 시점에 주입된다. 마운트 후 별도 fetch를 하지 않는다.
  const [liked, setLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const isToggling = useRef(false);

  async function handleToggle() {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (isToggling.current) return;
    isToggling.current = true;

    const newLiked = !liked;
    setLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));
    setIsAnimating(true);

    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: "POST" });

      if (res.status === 401) {
        router.push("/sign-in");
        setLiked(!newLiked);
        setCount((prev) => (newLiked ? Math.max(prev - 1, 0) : prev + 1));
        return;
      }

      if (!res.ok) throw new Error(`Like API returned ${res.status}`);
      const data: Record<string, unknown> = await res.json();

      if (typeof data.likeCount === "number") setCount(data.likeCount);
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch (err) {
      console.error("[LikeButton] Failed to toggle like:", slug, err);
      setLiked(!newLiked);
      setCount((prev) => (newLiked ? Math.max(prev - 1, 0) : prev + 1));
    } finally {
      isToggling.current = false;
      setTimeout(() => setIsAnimating(false), 300);
    }
  }

  function handleClick(e: React.MouseEvent) {
    if (compact) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleToggle();
  }

  const iconSize = compact ? 12 : 16;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center transition-colors duration-200 ${
        compact ? "gap-1" : "gap-1.5"
      } ${
        liked
          ? "text-rose-400 hover:text-rose-300"
          : "text-muted-foreground hover:text-rose-400"
      }`}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <span
        className={`transition-transform duration-300 ${isAnimating ? "scale-125" : "scale-100"}`}
      >
        <HeartIcon size={iconSize} filled={liked} />
      </span>
      <span className={`tabular-nums ${compact ? "text-[11px]" : "text-xs"}`}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

export function LikeCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <HeartIcon size={12} />
      {count.toLocaleString()}
    </span>
  );
}
