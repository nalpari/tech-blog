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

function isPostSummary(value: unknown): value is PostSummary {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  const nullableString = (field: unknown) => field === null || typeof field === "string";
  return typeof post.id === "string"
    && typeof post.slug === "string"
    && typeof post.title === "string"
    && typeof post.date === "string"
    && Number.isFinite(Date.parse(post.date))
    && nullableString(post.excerpt)
    && nullableString(post.readTime)
    && nullableString(post.coverImage)
    && nullableString(post.coverGradient)
    && typeof post.authorId === "string"
    && typeof post.featured === "boolean"
    && typeof post.liked === "boolean"
    && typeof post.viewCount === "number" && Number.isFinite(post.viewCount)
    && typeof post.likeCount === "number" && Number.isFinite(post.likeCount)
    && Array.isArray(post.tags) && post.tags.every((tag) => typeof tag === "string");
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
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const autoPausedRef = useRef(false);
  // 중복 제거된 표시 행 수와 별도로 서버에서 소비한 행 수를 유지한다.
  const offsetRef = useRef(initialPosts.length);

  useEffect(() => () => requestRef.current?.abort(), []);

  const loadMore = useCallback(async () => {
    if (requestRef.current || !hasMore) return;
    const controller = new AbortController();
    requestRef.current = controller;
    autoPausedRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts?offset=${offsetRef.current}&limit=${pageSize}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("목록 요청 실패");
      const data: unknown = await res.json();
      if (!data || typeof data !== "object"
        || !("posts" in data) || !Array.isArray(data.posts)
        || !data.posts.every(isPostSummary)
        || !("hasMore" in data) || typeof data.hasMore !== "boolean"
        || (data.hasMore && data.posts.length === 0)) {
        throw new Error("잘못된 목록 응답");
      }
      if (controller.signal.aborted) return;
      const nextPosts = data.posts;
      setPosts((prev) => {
        const existing = new Set(prev.map((p) => p.slug));
        const newPosts = nextPosts.filter((post) => {
          if (existing.has(post.slug)) return false;
          existing.add(post.slug);
          return true;
        });
        return [...prev, ...newPosts];
      });
      offsetRef.current += nextPosts.length;
      setHasMore(data.hasMore);
    } catch {
      if (!controller.signal.aborted) {
        autoPausedRef.current = true;
        setError("이전 글을 불러오지 못했습니다. 다시 시도해주세요.");
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [hasMore, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || error || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !autoPausedRef.current) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loading, error, hasMore]);

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

      {posts.length === 0 && !hasMore && (
        <p className="py-10 text-[15px] text-muted">아직 발행된 글이 없습니다.</p>
      )}

      {error && (
        <div className="py-10 text-center text-sm text-muted">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="mt-3 rounded border border-border-strong! px-3 py-2 text-foreground hover:bg-surface disabled:opacity-50"
          >
            다시 시도
          </button>
        </div>
      )}

      {hasMore && !error && (
        <div ref={sentinelRef} className="flex justify-center py-10" role="status" aria-label="이전 글 불러오는 중">
          {loading && (
            <span className="size-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
