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
      <span className="text-xs font-mono text-red-400">
        {error}
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {"// 정말 삭제하시겠습니까?"}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-mono text-red-400 hover:text-red-300 border border-red-400/50 hover:border-red-400 px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50"
        >
          {deleting ? "deleting..." : "confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-accent/50 px-2.5 py-1 transition-colors cursor-pointer"
        >
          cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-mono text-muted-foreground hover:text-red-400 border border-border hover:border-red-400/50 px-2.5 py-1 transition-colors cursor-pointer"
    >
      delete
    </button>
  );
}
