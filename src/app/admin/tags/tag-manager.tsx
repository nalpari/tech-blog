"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, updateTag, deleteTag } from "./actions";

interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface TagManagerProps {
  initialTags: Tag[];
}

export function TagManager({ initialTags }: TagManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createTag(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowNew(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateTag(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 태그를 삭제하시겠습니까?\n연결된 포스트에서 이 태그가 제거됩니다.`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteTag(id);
    if (result.error) {
      setError(result.error);
    } else {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-sans">
          {error}
        </div>
      )}

      {/* New tag button */}
      {!showNew && (
        <button
          onClick={() => { setShowNew(true); setEditingId(null); }}
          className="text-xs font-mono text-accent border border-accent px-3 py-1.5 hover:bg-accent hover:text-background transition-colors cursor-pointer"
        >
          + new tag
        </button>
      )}

      {/* New tag form */}
      {showNew && (
        <TagForm
          onSubmit={handleCreate}
          onCancel={() => { setShowNew(false); setError(null); }}
          loading={loading}
        />
      )}

      {/* Tag list */}
      <div className="divide-y divide-border">
        {tags.map((tag) => (
          <div key={tag.id}>
            {editingId === tag.id ? (
              <TagForm
                tag={tag}
                onSubmit={handleUpdate}
                onCancel={() => { setEditingId(null); setError(null); }}
                loading={loading}
              />
            ) : (
              <div className="flex items-center justify-between py-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-foreground">
                      # {tag.name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      /{tag.slug}
                    </span>
                  </div>
                  {tag.description && (
                    <p className="text-xs font-sans text-muted mt-1 truncate">
                      {tag.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(tag.id); setShowNew(false); setError(null); }}
                    className="text-xs font-mono text-muted-foreground hover:text-accent px-2 py-1 border border-border hover:border-accent/50 transition-colors cursor-pointer"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    disabled={loading}
                    className="text-xs font-mono text-muted-foreground hover:text-red-400 px-2 py-1 border border-border hover:border-red-400/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tags.length === 0 && !showNew && (
          <p className="py-10 text-center text-sm font-sans text-muted-foreground">
            {"// 등록된 태그가 없습니다"}
          </p>
        )}
      </div>
    </div>
  );
}

function TagForm({
  tag,
  onSubmit,
  onCancel,
  loading,
}: {
  tag?: { id: string; name: string; slug: string; description: string | null };
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(tag?.name ?? "");
  const [slug, setSlug] = useState(tag?.slug ?? "");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [slugEdited, setSlugEdited] = useState(!!tag);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (tag) formData.set("id", tag.id);
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("description", description);
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="py-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted">name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="React"
            required
            className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted">slug</label>
          <input
            value={slug}
            onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }}
            placeholder="react"
            required
            className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-mono text-muted">description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="태그 설명 (선택)"
          className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-xs font-mono px-3 py-1.5 border border-accent bg-accent text-background hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {tag ? "update" : "create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-mono px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
