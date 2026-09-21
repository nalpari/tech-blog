"use client";

import { useState } from "react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API 미지원 환경 (HTTP, 구형 브라우저)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-mono border border-border/60 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}
