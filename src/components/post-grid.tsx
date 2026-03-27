"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/post-card";
import type { Post } from "@/lib/data";

interface PostGridProps {
  initialPosts: Post[];
  initialHasMore: boolean;
  pageSize: number;
}

export function PostGrid({ initialPosts, initialHasMore, pageSize }: PostGridProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts?offset=${posts.length}&limit=${pageSize}`);
      const data = await res.json();
      setPosts((prev) => {
        const existing = new Set(prev.map((p) => p.slug));
        const newPosts = (data.posts as Post[]).filter((p) => !existing.has(p.slug));
        return [...prev, ...newPosts];
      });
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, posts.length, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {loading && (
            <span className="size-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
