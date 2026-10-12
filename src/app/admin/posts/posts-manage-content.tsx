"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { togglePostStatus, deletePost } from "./actions";

interface PostItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
}

type Filter = "all" | "published" | "draft";

export function PostsManageContent({ posts }: { posts: PostItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<PostItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = posts.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };

  function handleToggle(postId: string) {
    startTransition(async () => {
      const result = await togglePostStatus(postId);
      if (result.error) {
        alert(result.error);
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deletePost(deleteTarget.id);
      if (result.error) {
        alert(result.error);
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "all" },
    { key: "published", label: "published" },
    { key: "draft", label: "draft" },
  ];

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer -mb-px ${
              filter === f.key
                ? "text-foreground font-medium border-b-2 border-foreground!"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted">
                title
              </th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted w-24">
                status
              </th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted w-28 hidden sm:table-cell">
                date
              </th>
              <th className="text-center px-3 py-3 text-xs font-medium text-muted w-16 hidden sm:table-cell">
                views
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted w-32">
                actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  포스트가 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-surface transition-colors"
                >
                  {/* Title */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${encodeURIComponent(post.slug)}`}
                      className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-1"
                    >
                      {post.featured && (
                        <span className="text-accent-amber mr-1.5" title="featured">
                          *
                        </span>
                      )}
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      /{post.slug}
                    </p>
                  </td>

                  {/* Status badge */}
                  <td className="text-center px-3 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        post.status === "published"
                          ? "text-accent bg-accent/10"
                          : "text-accent-amber bg-accent-amber/10"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="text-center px-3 py-3 text-xs font-mono text-muted-foreground hidden sm:table-cell">
                    {formatDate(post.published_at ?? post.created_at)}
                  </td>

                  {/* Views */}
                  <td className="text-center px-3 py-3 text-xs font-mono text-muted-foreground hidden sm:table-cell">
                    {post.view_count}
                  </td>

                  {/* Actions */}
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(post.id)}
                        disabled={isPending}
                        title={
                          post.status === "published"
                            ? "draft로 변경"
                            : "publish"
                        }
                        className="inline-flex items-center h-7 px-2.5 rounded text-xs text-foreground border border-border-strong! hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {post.status === "published" ? "unpublish" : "publish"}
                      </button>
                      <Link
                        href={`/posts/${encodeURIComponent(post.slug)}/edit`}
                        className="inline-flex items-center h-7 px-2.5 rounded text-xs text-foreground border border-border-strong! hover:bg-surface transition-colors"
                      >
                        edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(post)}
                        disabled={isPending}
                        className="inline-flex items-center h-7 px-2.5 rounded text-xs text-red-600 dark:text-red-400 border border-border-strong! hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 rounded-lg border border-border bg-background p-6">
            <h3 className="text-base font-bold text-foreground mb-4">
              이 포스트를 삭제하시겠습니까?
            </h3>
            <p className="text-sm text-muted-foreground mb-1 truncate">
              {deleteTarget.title}
            </p>
            <p className="text-xs font-mono text-muted-foreground mb-6">
              /{deleteTarget.slug}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              관련된 태그, 좋아요, 조회수, 북마크도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="h-9 px-4 rounded text-sm text-foreground border border-border-strong! hover:bg-surface transition-colors cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="h-9 px-4 rounded text-sm font-medium text-red-600 dark:text-red-400 border border-red-500/40! hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "deleting..." : "delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
