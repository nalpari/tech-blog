"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>;
}
