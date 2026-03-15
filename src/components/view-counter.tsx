"use client";

import { useEffect, useState } from "react";

export function ViewCounter({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    fetch(`/api/posts/${slug}/view`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.viewCount != null) {
          setCount(data.viewCount);
        }
      })
      .catch(() => {
        // 조회수 증가 실패 시 무시 — 사용자 경험에 영향 없음
      });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}

export function ViewCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}
