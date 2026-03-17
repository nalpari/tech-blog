"use client";

import { useState, type ComponentProps } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark-dimmed.css";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    return extractText(props?.children);
  }
  return "";
}

function Pre({ children, ...props }: ComponentProps<"pre">) {
  const code = extractText(children);
  return (
    <div className="relative group">
      <pre {...props}>{children}</pre>
      <CopyButton code={code.trim()} />
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{ pre: Pre }}
    >
      {content}
    </Markdown>
  );
}
