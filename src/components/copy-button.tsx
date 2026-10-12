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
      type="button"
      onClick={handleCopy}
      className={`absolute top-2 right-2 cursor-pointer rounded border border-border bg-background/80 px-2 py-1 text-xs transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${
        copied ? "text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}
