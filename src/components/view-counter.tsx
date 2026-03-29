"use client";

import { useEffect, useRef, useState } from "react";

function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

export function ViewCounter({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    fetch(`/api/posts/${slug}/view`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(`View count API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.viewCount != null) {
          setCount(data.viewCount);
        }
      })
      .catch((err) => {
        console.error("[ViewCounter] Failed to increment view count:", slug, err);
      });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1">
      <EyeIcon size={14} />
      {count.toLocaleString()}
    </span>
  );
}

export function ViewCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <EyeIcon size={12} />
      {count.toLocaleString()}
    </span>
  );
}
