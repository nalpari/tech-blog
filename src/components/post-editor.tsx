"use client";

import { useActionState, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPost, type CreatePostState } from "@/app/posts/new/actions";

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

interface PostEditorProps {
  tags: TagOption[];
}

export function PostEditor({ tags }: PostEditorProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<CreatePostState, FormData>(
    createPost,
    {},
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      return;
    }

    const text = await file.text();
    setContent(text);

    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.(md|markdown)$/, "");
      const formatted = nameWithoutExt
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      handleTitleChange(formatted);
    }

    setActiveTab("preview");
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-muted-foreground">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="포스트 제목을 입력하세요"
          className="w-full px-4 py-3 rounded-lg border border-border/60 bg-white/[0.02] text-foreground text-lg font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all"
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-red-400">{state.fieldErrors.title}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium text-muted-foreground">
          슬러그
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground/50 shrink-0">/posts/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated-slug"
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-border/60 bg-white/[0.02] text-foreground text-sm font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all"
          />
        </div>
        {state.fieldErrors?.slug && (
          <p className="text-sm text-red-400">{state.fieldErrors.slug}</p>
        )}
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <label htmlFor="excerpt" className="text-sm font-medium text-muted-foreground">
          요약
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="포스트에 대한 간단한 설명 (목록에서 표시됩니다)"
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-border/60 bg-white/[0.02] text-foreground text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all resize-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">태그</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-white/[0.04] text-muted-foreground border border-border/40 hover:border-border/80 hover:text-foreground"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground/40">등록된 태그가 없습니다</p>
          )}
        </div>
        {/* Hidden inputs for selected tags */}
        {selectedTags.map((tagId) => (
          <input key={tagId} type="hidden" name="tags" value={tagId} />
        ))}
      </div>

      {/* Content Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            내용 <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* File upload */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/40 hover:border-border/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer bg-white/[0.02] hover:bg-white/[0.04]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              .md 파일 업로드
              <input
                type="file"
                accept=".md,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "write"
                ? "text-foreground border-b-2 border-accent -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "preview"
                ? "text-foreground border-b-2 border-accent -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
        </div>

        {/* Editor / Preview area */}
        {activeTab === "write" ? (
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="마크다운으로 내용을 작성하세요...&#10;&#10;# 제목&#10;## 소제목&#10;&#10;일반 텍스트, **굵게**, *기울임*, `코드`&#10;&#10;```js&#10;const hello = 'world';&#10;```"
            rows={24}
            className="w-full px-4 py-3 rounded-lg border border-border/60 bg-white/[0.02] text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all resize-y"
          />
        ) : (
          <div className="min-h-[400px] px-6 py-4 rounded-lg border border-border/60 bg-white/[0.02] overflow-auto">
            {content ? (
              <div className="prose-blog">
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              </div>
            ) : (
              <p className="text-muted-foreground/30 text-sm">미리보기할 내용이 없습니다</p>
            )}
          </div>
        )}
        {/* Hidden textarea for content when in preview mode */}
        {activeTab === "preview" && (
          <input type="hidden" name="content" value={content} />
        )}
        {state.fieldErrors?.content && (
          <p className="text-sm text-red-400">{state.fieldErrors.content}</p>
        )}
      </div>

      {/* Options row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-border/40">
        {/* Featured toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="featured"
            className="sr-only peer"
          />
          <div className="relative w-9 h-5 rounded-full bg-white/[0.06] border border-border/40 peer-checked:bg-accent/30 peer-checked:border-accent/40 transition-all">
            <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-muted-foreground/60 peer-checked:bg-accent peer-checked:translate-x-4 transition-all" />
          </div>
          <span className="text-sm text-muted-foreground">Featured 포스트</span>
        </label>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/80 transition-all cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            name="status"
            value="draft"
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-white/[0.06] hover:bg-white/[0.1] border border-border/40 hover:border-border/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="submit"
            name="status"
            value="published"
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 shadow-sm shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "발행 중..." : "발행하기"}
          </button>
        </div>
      </div>
    </form>
  );
}
