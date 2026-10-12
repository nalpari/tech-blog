"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard, type TagInfo } from "@/components/post-card";
import type { PostSummary } from "@/lib/data";
import { kstYmd } from "@/lib/format";

interface PostGridProps {
  initialPosts: PostSummary[];
  initialHasMore: boolean;
  pageSize: number;
  tagInfo?: TagInfo;
}

// 정렬된 글을 연도 단위로 묶는다. 페이지가 이어져도 같은 해는 한 그룹으로 합쳐진다.
function groupByYear(posts: PostSummary[]): [string, PostSummary[]][] {
  const groups = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const year = kstYmd(post.date).slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups];
}

export function PostGrid({ initialPosts, initialHasMore, pageSize, tagInfo }: PostGridProps) {
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
        const newPosts = (data.posts as PostSummary[]).filter((p) => !existing.has(p.slug));
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
      <div className="space-y-12">
        {groupByYear(posts).map(([year, items], i) => (
          <section key={year} className={i > 0 ? "border-t border-border pt-8" : undefined}>
            <h2 className="text-sm font-semibold tabular-nums text-muted">{year}</h2>
            <div className="mt-6 space-y-9">
              {items.map((post) => (
                <PostCard key={post.slug} post={post} tagInfo={tagInfo} dateStyle="short" />
              ))}
            </div>
          </section>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-10" role="status" aria-label="이전 글 불러오는 중">
          {loading && (
            <span className="size-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
