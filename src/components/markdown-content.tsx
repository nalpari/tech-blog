"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // If content looks like HTML (starts with < tag), render as HTML
  const isHtml = /^\s*<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>;
}
