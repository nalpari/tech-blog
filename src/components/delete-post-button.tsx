"use client";

import { useState } from "react";
import { deletePost } from "@/app/posts/[slug]/actions";

interface DeletePostButtonProps {
  postId: string;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deletePost(postId);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <span className="text-sm text-red-600 dark:text-red-400">
        {error}
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">
          정말 삭제하시겠습니까?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center h-8 px-3 rounded text-sm font-medium text-red-600 dark:text-red-400 border border-red-500/40! hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          {deleting ? "deleting..." : "confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="inline-flex items-center h-8 px-3 rounded text-sm text-foreground border border-border-strong! hover:bg-surface transition-colors cursor-pointer"
        >
          cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center h-8 px-3 rounded text-sm text-red-600 dark:text-red-400 border border-border-strong! hover:bg-red-500/10 transition-colors cursor-pointer"
    >
      delete
    </button>
  );
}
