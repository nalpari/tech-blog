"use client";

import { useState, useRef, useEffect } from "react";

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
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    // localStorage를 즉시 반영하여 깜빡임 방지
    const storedLiked = localStorage.getItem(`liked-${slug}`);
    if (storedLiked === "1") {
      setLiked(true);
    }

    // 서버(httpOnly 쿠키) 상태를 source of truth로 동기화
    fetch(`/api/posts/${slug}/like`)
      .then((res) => {
        if (!res.ok) throw new Error(`Like status API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLiked(data.liked);
        if (data.likeCount != null) {
          setCount(data.likeCount);
        }
        // localStorage를 서버 상태와 동기화
        if (data.liked) {
          localStorage.setItem(`liked-${slug}`, "1");
        } else {
          localStorage.removeItem(`liked-${slug}`);
        }
      })
      .catch((err) => {
        console.error("[LikeButton] Failed to fetch like status:", slug, err);
        // fetch 실패 시 localStorage 값 유지
      });
  }, [slug]);

  async function handleToggle() {
    if (isAnimating) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));
    setIsAnimating(true);

    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: "POST" });
      if (!res.ok) throw new Error(`Like API returned ${res.status}`);
      const data = await res.json();

      if (data.likeCount != null) {
        setCount(data.likeCount);
      }
      setLiked(data.liked);

      if (data.liked) {
        localStorage.setItem(`liked-${slug}`, "1");
      } else {
        localStorage.removeItem(`liked-${slug}`);
      }
    } catch (err) {
      console.error("[LikeButton] Failed to toggle like:", slug, err);
      setLiked(!newLiked);
      setCount((prev) => (newLiked ? Math.max(prev - 1, 0) : prev + 1));
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 transition-colors duration-200 ${
        liked
          ? "text-rose-400 hover:text-rose-300"
          : "text-muted-foreground hover:text-rose-400"
      }`}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <span
        className={`transition-transform duration-300 ${isAnimating ? "scale-125" : "scale-100"}`}
      >
        <HeartIcon size={16} filled={liked} />
      </span>
      <span className="text-xs tabular-nums">{count.toLocaleString()}</span>
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
