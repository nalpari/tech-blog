"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/data";

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  date: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [titleResults, setTitleResults] = useState<SearchResult[]>([]);
  const [contentResults, setContentResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const allResults = [
    ...titleResults.map((r) => ({ ...r, section: "title" as const })),
    ...contentResults.map((r) => ({ ...r, section: "content" as const })),
  ];

  // 모달 열릴 때 포커스 및 상태 초기화
  useEffect(() => {
    if (open) {
      setQuery("");
      setTitleResults([]);
      setContentResults([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // body 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setTitleResults([]);
      setContentResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();
    const term = `%${searchQuery.trim()}%`;

    const [titleRes, contentRes] = await Promise.all([
      supabase
        .from("posts")
        .select("slug, title, excerpt, content, published_at")
        .eq("status", "published")
        .ilike("title", term)
        .order("published_at", { ascending: false })
        .limit(5),
      supabase
        .from("posts")
        .select("slug, title, excerpt, content, published_at")
        .eq("status", "published")
        .ilike("content", term)
        .order("published_at", { ascending: false })
        .limit(5),
    ]);

    const mapRow = (row: {
      slug: string;
      title: string;
      excerpt: string | null;
      content: string | null;
      published_at: string | null;
    }): SearchResult => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      date: row.published_at ?? "",
    });

    const titleHits = (titleRes.data ?? []).map(mapRow);
    const contentHits = (contentRes.data ?? [])
      .map(mapRow)
      .filter((c) => !titleHits.some((t) => t.slug === c.slug));

    setTitleResults(titleHits);
    setContentResults(contentHits);
    setActiveIndex(-1);
    setIsSearching(false);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const navigateToPost = (slug: string) => {
    onClose();
    router.push(`/posts/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToPost(allResults[activeIndex].slug);
    }
  };

  // 활성 항목 스크롤 추적
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  const hasQuery = query.trim().length >= 2;
  const hasResults = allResults.length > 0;

  function highlightMatch(text: string, q: string): React.ReactNode {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-accent font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    );
  }

  function getContentSnippet(content: string | null, q: string): string {
    if (!content) return "";
    const plain = content.replace(/[#*`>\-\[\]()!]/g, "").replace(/\n+/g, " ");
    const idx = plain.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return plain.slice(0, 100) + "...";
    const start = Math.max(0, idx - 40);
    const end = Math.min(plain.length, idx + q.length + 60);
    return (start > 0 ? "..." : "") + plain.slice(start, end) + (end < plain.length ? "..." : "");
  }

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] mx-4 bg-card border border-border shadow-2xl animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg
            className="size-5 text-muted shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="포스트 검색..."
            className="flex-1 bg-transparent text-foreground text-sm font-mono placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground border border-border bg-background">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-8 text-center text-muted text-sm font-mono">
              검색 중...
            </div>
          )}

          {!isSearching && hasQuery && !hasResults && (
            <div className="px-4 py-8 text-center text-muted text-sm font-mono">
              <span className="text-muted-foreground">&apos;{query}&apos;</span>에 대한 검색
              결과가 없습니다.
            </div>
          )}

          {!isSearching && hasResults && (
            <>
              {titleResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider bg-background/50 border-b border-border">
                    타이틀 검색 결과
                  </div>
                  {titleResults.map((result) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={result.slug}
                        data-search-item
                        onClick={() => navigateToPost(result.slug)}
                        className={`w-full text-left px-4 py-3 flex flex-col gap-1 border-b border-border-light transition-colors cursor-pointer ${
                          activeIndex === idx
                            ? "bg-card-hover"
                            : "hover:bg-card-hover"
                        }`}
                      >
                        <span className="text-sm text-foreground font-mono leading-snug">
                          {highlightMatch(result.title, query)}
                        </span>
                        <span className="text-xs text-muted line-clamp-1">
                          {result.excerpt ?? ""}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {result.date ? formatDate(result.date) : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {contentResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider bg-background/50 border-b border-border">
                    본문 검색 결과
                  </div>
                  {contentResults.map((result) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={result.slug}
                        data-search-item
                        onClick={() => navigateToPost(result.slug)}
                        className={`w-full text-left px-4 py-3 flex flex-col gap-1 border-b border-border-light transition-colors cursor-pointer ${
                          activeIndex === idx
                            ? "bg-card-hover"
                            : "hover:bg-card-hover"
                        }`}
                      >
                        <span className="text-sm text-foreground font-mono leading-snug">
                          {result.title}
                        </span>
                        <span className="text-xs text-muted line-clamp-2">
                          {highlightMatch(
                            getContentSnippet(result.content, query),
                            query,
                          )}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {result.date ? formatDate(result.date) : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!isSearching && !hasQuery && (
            <div className="px-4 py-8 text-center text-muted text-sm font-mono">
              2글자 이상 입력하면 검색이 시작됩니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border bg-background text-[10px]">
                &uarr;
              </kbd>
              <kbd className="px-1 py-0.5 border border-border bg-background text-[10px]">
                &darr;
              </kbd>
              <span className="ml-0.5">탐색</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border bg-background text-[10px]">
                &crarr;
              </kbd>
              <span className="ml-0.5">이동</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 border border-border bg-background text-[10px]">
              ESC
            </kbd>
            <span className="ml-0.5">닫기</span>
          </span>
        </div>
      </div>
    </div>
  );
}
