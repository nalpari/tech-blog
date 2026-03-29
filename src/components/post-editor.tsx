"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPost, type CreatePostState } from "@/app/posts/new/actions";
import { updatePost, type UpdatePostState } from "@/lib/post-actions";
import { generateSlug } from "@/lib/slug";

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

interface EditMode {
  postId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  featured: boolean;
  status: string;
  tagIds: string[];
}

interface PostEditorProps {
  tags: TagOption[];
  editMode?: EditMode;
}

export function PostEditor({ tags, editMode }: PostEditorProps) {
  const isEditing = !!editMode;

  const [createState, createAction, isCreatePending] = useActionState<CreatePostState, FormData>(
    createPost,
    {},
  );

  const [updateState, updateAction, isUpdatePending] = useActionState<UpdatePostState, FormData>(
    updatePost,
    {},
  );

  const state = isEditing ? updateState : createState;
  const formAction = isEditing ? updateAction : createAction;
  const isPending = isEditing ? isUpdatePending : isCreatePending;

  const [title, setTitle] = useState(editMode?.title ?? "");
  const [slug, setSlug] = useState(editMode?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!editMode);
  const [content, setContent] = useState(editMode?.content ?? "");
  const [excerpt, setExcerpt] = useState(editMode?.excerpt ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(editMode?.tagIds ?? []);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [featured, setFeatured] = useState(editMode?.featured ?? false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(editMode?.coverImage || null);
  const [coverImageUrl, setCoverImageUrl] = useState(editMode?.coverImage ?? "");
  const coverImageUrlRef = useRef<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (coverImageUrlRef.current) {
        URL.revokeObjectURL(coverImageUrlRef.current);
      }
    };
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

  async function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("이미지 크기는 10MB 이하여야 합니다.");
      e.target.value = "";
      return;
    }

    setUploadError(null);

    // Show local preview immediately
    if (coverImageUrlRef.current) {
      URL.revokeObjectURL(coverImageUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    coverImageUrlRef.current = previewUrl;
    setCoverImagePreview(previewUrl);
    e.target.value = "";

    // Upload directly to Supabase Storage from client
    setCoverUploading(true);
    try {
      const { uploadImage } = await import("@/lib/upload-image");
      const { url } = await uploadImage(file, "covers/");
      setCoverImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "커버 이미지 업로드 실패");
      setCoverImagePreview(null);
      setCoverImageUrl("");
      if (coverImageUrlRef.current) {
        URL.revokeObjectURL(coverImageUrlRef.current);
        coverImageUrlRef.current = null;
      }
    } finally {
      setCoverUploading(false);
    }
  }

  function removeCoverImage() {
    if (coverImageUrlRef.current) {
      URL.revokeObjectURL(coverImageUrlRef.current);
      coverImageUrlRef.current = null;
    }
    setCoverImagePreview(null);
    setCoverImageUrl("");
  }

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);

    setContent(before + text + after);

    requestAnimationFrame(() => {
      const newPos = start + text.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setImageUploading(true);

    try {
      const { uploadImage } = await import("@/lib/upload-image");
      const { url } = await uploadImage(file);
      const altText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      insertAtCursor(`\n![${altText}](${url})\n`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "이미지 업로드 실패");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      setUploadError(".md 또는 .markdown 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      setContent(text);

      if (!title) {
        const nameWithoutExt = file.name.replace(/\.(md|markdown)$/, "");
        const formatted = nameWithoutExt
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        handleTitleChange(formatted);
      }

      setActiveTab("preview");
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setUploadError(`파일을 읽는 중 오류가 발생했습니다: ${message}`);
      e.target.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {isEditing && (
        <input type="hidden" name="postId" value={editMode.postId} />
      )}
      {state.error && (
        <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-sans">
          {state.error}
        </div>
      )}

      {/* Cover Image URL (uploaded client-side to Supabase Storage) */}
      <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          커버 이미지
        </label>
        {coverImagePreview ? (
          <div className="relative group rounded-xl overflow-hidden border border-border/40">
            <Image
              src={coverImagePreview}
              alt="커버 이미지 미리보기"
              width={800}
              height={400}
              className="w-full h-48 sm:h-64 object-cover"
              unoptimized
            />
            {coverUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium cursor-pointer hover:bg-white/30 transition-colors">
                변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={removeCoverImage}
                className="px-3 py-1.5 rounded-lg bg-red-500/30 backdrop-blur-sm text-white text-xs font-medium cursor-pointer hover:bg-red-500/50 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border/40 hover:border-accent/40 bg-white/2 hover:bg-white/4 transition-all cursor-pointer">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/40 mb-2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-sm text-muted-foreground/50">클릭하여 커버 이미지 업로드</span>
            <span className="text-xs text-muted-foreground/30 mt-1">PNG, JPG, WebP (최대 10MB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-xs font-mono text-muted">
          title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="포스트 제목을 입력하세요"
          className="w-full px-3 py-2.5 border border-border bg-background text-foreground text-lg font-mono font-bold placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-red-400 font-sans">{state.fieldErrors.title}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-xs font-mono text-muted">
          slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono shrink-0">/posts/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated-slug"
            className="flex-1 px-3 py-2 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        {state.fieldErrors?.slug && (
          <p className="text-sm text-red-400 font-sans">{state.fieldErrors.slug}</p>
        )}
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <label htmlFor="excerpt" className="text-xs font-mono text-muted">
          excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="포스트에 대한 간단한 설명"
          rows={2}
          className="w-full px-3 py-2.5 border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-muted">tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer border ${
                  isSelected
                    ? "border-accent text-accent bg-accent/5"
                    : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {tag.name.toLowerCase()}
              </button>
            );
          })}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground font-sans">{"// 등록된 태그가 없습니다"}</p>
          )}
        </div>
        {selectedTags.map((tagId) => (
          <input key={tagId} type="hidden" name="tags" value={tagId} />
        ))}
      </div>

      {/* Content Editor */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-muted">
            content <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* Image upload */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border hover:border-accent/50 text-muted-foreground hover:text-accent text-xs font-mono transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {imageUploading ? (
                <>
                  <span className="size-3 border border-accent border-t-transparent rounded-full animate-spin" />
                  uploading...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  image
                </>
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* .md file upload */}
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border hover:border-accent/50 text-muted-foreground hover:text-accent text-xs font-mono transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              .md
              <input
                type="file"
                accept=".md,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
        {uploadError && (
          <p className="text-sm text-red-400 font-sans">{uploadError}</p>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "write"
                ? "text-accent border-b border-accent -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "text-accent border-b border-accent -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            preview
          </button>
        </div>

        {/* Editor / Preview */}
        {activeTab === "write" ? (
          <textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="마크다운으로 내용을 작성하세요..."
            rows={24}
            className="w-full px-3 py-3 border border-border bg-background text-foreground text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors resize-y"
          />
        ) : (
          <div className="min-h-[400px] px-4 py-3 border border-border bg-background overflow-auto">
            {content ? (
              <div className="prose-blog">
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm font-sans">{"// 미리보기할 내용이 없습니다"}</p>
            )}
          </div>
        )}
        {activeTab === "preview" && (
          <input type="hidden" name="content" value={content} />
        )}
        {state.fieldErrors?.content && (
          <p className="text-sm text-red-400 font-sans">{state.fieldErrors.content}</p>
        )}
      </div>

      {/* Options row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-border">
        {/* Featured toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={featured}
          onClick={() => setFeatured((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input type="hidden" name="featured" value={featured ? "on" : ""} />
          <div className={`relative w-8 h-4 border transition-colors ${featured ? "bg-accent/20 border-accent" : "bg-card border-border"}`}>
            <div className={`absolute top-0.5 left-0.5 size-3 transition-all ${featured ? "bg-accent translate-x-4" : "bg-muted-foreground"}`} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">featured</span>
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-accent/50 transition-colors"
          >
            cancel
          </Link>
          <button
            type="submit"
            name="status"
            value="draft"
            disabled={isPending || coverUploading}
            className="px-3 py-1.5 text-xs font-mono text-foreground border border-border hover:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "saving..." : "save draft"}
          </button>
          <button
            type="submit"
            name="status"
            value="published"
            disabled={isPending || coverUploading}
            className="px-4 py-1.5 text-xs font-mono border border-accent bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending
              ? isEditing && editMode.status === "published" ? "updating..." : "publishing..."
              : isEditing && editMode.status === "published" ? "update" : "publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
