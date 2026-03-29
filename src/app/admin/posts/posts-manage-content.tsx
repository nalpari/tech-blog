"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { togglePostStatus, deletePost } from "./actions";
import { showToast } from "@/lib/toast";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const savedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deletedRef = useRef(false);

  useEffect(() => {
    if (deleteTarget) {
      dialogRef.current?.focus();
    } else if (deletedRef.current) {
      deletedRef.current = false;
      savedTriggerRef.current = null;
    } else {
      if (savedTriggerRef.current?.isConnected) {
        savedTriggerRef.current.focus();
      }
      savedTriggerRef.current = null;
    }
  }, [deleteTarget]);

  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        setDeleteTarget(null);
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [isPending],
  );

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
        showToast(result.error);
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deletePost(deleteTarget.id);
      if (result.error) {
        showToast(result.error);
        return;
      }
      deletedRef.current = true;
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
            className={`px-4 py-2 text-xs font-mono transition-colors cursor-pointer ${
              filter === f.key
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-muted-foreground">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card/50">
              <th className="text-left px-4 py-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                title
              </th>
              <th className="text-center px-3 py-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider w-24">
                status
              </th>
              <th className="text-center px-3 py-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider w-28 hidden sm:table-cell">
                date
              </th>
              <th className="text-center px-3 py-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider w-16 hidden sm:table-cell">
                views
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider w-32">
                actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-muted-foreground font-mono"
                >
                  {"// 포스트가 없습니다"}
                </td>
              </tr>
            ) : (
              filtered.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border last:border-b-0 hover:bg-card/30 transition-colors"
                >
                  {/* Title */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${encodeURIComponent(post.slug)}`}
                      className="text-sm font-mono text-foreground hover:text-accent transition-colors line-clamp-1"
                    >
                      {post.featured && (
                        <span className="text-amber-400 mr-1.5" title="featured">
                          *
                        </span>
                      )}
                      {post.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                      /{post.slug}
                    </p>
                  </td>

                  {/* Status badge */}
                  <td className="text-center px-3 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono border ${
                        post.status === "published"
                          ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
                          : "text-amber-400 border-amber-400/30 bg-amber-400/5"
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
                        className={`px-2 py-1 text-[11px] font-mono border transition-colors cursor-pointer disabled:opacity-50 ${
                          post.status === "published"
                            ? "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
                            : "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                        }`}
                      >
                        {post.status === "published" ? "unpublish" : "publish"}
                      </button>
                      <Link
                        href={`/posts/${encodeURIComponent(post.slug)}/edit`}
                        className="px-2 py-1 text-[11px] font-mono text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
                      >
                        edit
                      </Link>
                      <button
                        onClick={(e) => {
                          savedTriggerRef.current = e.currentTarget;
                          setDeleteTarget(post);
                        }}
                        disabled={isPending}
                        className="px-2 py-1 text-[11px] font-mono text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-50"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
          onKeyDown={handleDialogKeyDown}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            className="w-full max-w-md mx-4 border border-border bg-background p-6 shadow-2xl shadow-black/40 outline-none"
          >
            <p className="text-xs font-mono text-red-400 mb-2">
              {"// confirm delete"}
            </p>
            <h3
              id="delete-dialog-title"
              className="text-sm font-mono font-bold text-foreground mb-4"
            >
              이 포스트를 삭제하시겠습니까?
            </h3>
            <p className="text-sm text-muted-foreground mb-1 truncate">
              {deleteTarget.title}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mb-6">
              /{deleteTarget.slug}
            </p>
            <p
              id="delete-dialog-desc"
              className="text-xs text-red-400/70 mb-6"
            >
              관련된 태그, 좋아요, 조회수, 북마크도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-50"
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
