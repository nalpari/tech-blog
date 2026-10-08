"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard, type TagInfo } from "@/components/post-card";
import type { PostSummary } from "@/lib/data";
import { kstYmd } from "@/lib/strata";

interface PostGridProps {
  initialPosts: PostSummary[];
  initialHasMore: boolean;
  pageSize: number;
  tagInfo?: TagInfo;
  // 첫 화면 히어로가 이미 가져간 글 수. 다음 페이지 offset에 더한다.
  startOffset?: number;
}

// 정렬된 글을 월 단위로 묶는다. 페이지가 이어져도 같은 달은 한 그룹으로 합쳐진다.
function groupByMonth(posts: PostSummary[]): [string, PostSummary[]][] {
  const groups = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const month = kstYmd(post.date).slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), post]);
  }
  return [...groups];
}

export function PostGrid({ initialPosts, initialHasMore, pageSize, tagInfo, startOffset = 0 }: PostGridProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts?offset=${startOffset + posts.length}&limit=${pageSize}`);
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
  }, [loading, hasMore, posts.length, pageSize, startOffset]);

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
      <div className="space-y-14">
        {groupByMonth(posts).map(([month, items]) => (
          <section key={month} className="grid gap-x-6 gap-y-5 md:grid-cols-[5.5rem_1fr]">
            <h2 className="font-mono text-[13px] font-medium tabular-nums text-muted md:sticky md:top-[4.5rem] md:self-start">
              {month}
            </h2>
            <div className="relative space-y-10 pl-8">
              {items.map((post) => (
                <PostCard key={post.slug} post={post} tagInfo={tagInfo} marker />
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
