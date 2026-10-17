"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
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
  // 닫을 때 언마운트하여 재열기마다 검색 상태와 요청 수명을 새로 시작한다.
  return open ? <SearchDialog onClose={onClose} /> : null;
}

function SearchDialog({ onClose }: Pick<SearchModalProps, "onClose">) {
  const [query, setQuery] = useState("");
  const [titleResults, setTitleResults] = useState<SearchResult[]>([]);
  const [contentResults, setContentResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchLabelId = useId();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancelPendingSearch = useCallback(() => {
    requestIdRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  const closeDialog = () => {
    cancelPendingSearch();
    onClose();
  };

  const allResults = [
    ...titleResults.map((r) => ({ ...r, section: "title" as const })),
    ...contentResults.map((r) => ({ ...r, section: "content" as const })),
  ];

  // showModal이 배경을 inert로 만들고 포커스를 가둔다. 기존 스크롤 스타일과
  // 실행 버튼 포커스는 StrictMode 재실행과 언마운트에서도 복원한다.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      cancelPendingSearch();
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [cancelPendingSearch]);

  const search = async (searchQuery: string, requestId: number) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const isCurrentRequest = () => requestId === requestIdRef.current && !controller.signal.aborted;
    try {
      const supabase = createClient();
      const term = `%${searchQuery.trim()}%`;

      const [titleRes, contentRes] = await Promise.all([
        supabase
          .from("posts")
          .select("slug, title, excerpt, content, published_at")
          .eq("status", "published")
          .ilike("title", term)
          .order("published_at", { ascending: false })
          .limit(5)
          .abortSignal(controller.signal),
        supabase
          .from("posts")
          .select("slug, title, excerpt, content, published_at")
          .eq("status", "published")
          .ilike("content", term)
          .order("published_at", { ascending: false })
          .limit(5)
          .abortSignal(controller.signal),
      ]);

      if (!isCurrentRequest()) return;
      if (titleRes.error || contentRes.error) throw new Error("검색 요청 실패");

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
    } catch {
      if (isCurrentRequest()) setSearchError("검색하지 못했습니다. 다시 시도해주세요.");
    } finally {
      if (isCurrentRequest()) setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    cancelPendingSearch();
    setQuery(value);
    setTitleResults([]);
    setContentResults([]);
    setActiveIndex(-1);
    setSearchError(null);
    const hasQuery = value.trim().length >= 2;
    setIsSearching(hasQuery);
    if (hasQuery) {
      const requestId = requestIdRef.current;
      debounceRef.current = setTimeout(() => void search(value, requestId), 300);
    }
  };

  const navigateToPost = (slug: string) => {
    closeDialog();
    router.push(`/posts/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && allResults[activeIndex]) {
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
    <dialog
      ref={dialogRef}
      aria-labelledby={searchLabelId}
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-black/50"
      onCancel={(event) => { event.preventDefault(); closeDialog(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
    >
      {/* Modal */}
      <div className="relative mx-auto mt-[15vh] w-[calc(100%-2rem)] max-w-[600px] bg-background border border-border rounded-lg shadow-xl overflow-hidden">
        <h2 id={searchLabelId} className="sr-only">포스트 검색</h2>
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
            aria-label="검색어"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="포스트 검색..."
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
          />
          <button type="button" onClick={closeDialog} aria-label="검색 닫기" className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-surface">
            닫기 <kbd className="hidden font-sans text-[11px] sm:inline">ESC</kbd>
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto" aria-busy={isSearching}>
          {isSearching && (
            <div role="status" className="px-4 py-8 text-center text-muted text-sm">
              검색 중...
            </div>
          )}

          {searchError && (
            <div role="alert" className="px-4 py-8 text-center text-muted text-sm">
              <p>{searchError}</p>
              <button type="button" onClick={() => handleInputChange(query)} className="mt-3 rounded border border-border-strong! px-3 py-2 text-foreground hover:bg-surface">다시 시도</button>
            </div>
          )}

          {!isSearching && !searchError && hasQuery && !hasResults && (
            <div className="px-4 py-8 text-center text-muted text-sm">
              <span className="text-muted-foreground">&apos;{query}&apos;</span>에 대한 검색
              결과가 없습니다.
            </div>
          )}

          {!isSearching && hasResults && (
            <>
              {titleResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground">
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
                        className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors cursor-pointer ${
                          activeIndex === idx
                            ? "bg-surface"
                            : "hover:bg-surface"
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground leading-snug">
                          {highlightMatch(result.title, query)}
                        </span>
                        <span className="text-xs text-muted line-clamp-1">
                          {result.excerpt ?? ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.date ? formatDate(result.date) : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {contentResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground">
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
                        className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors cursor-pointer ${
                          activeIndex === idx
                            ? "bg-surface"
                            : "hover:bg-surface"
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground leading-snug">
                          {result.title}
                        </span>
                        <span className="text-xs text-muted line-clamp-2">
                          {highlightMatch(
                            getContentSnippet(result.content, query),
                            query,
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
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
            <div className="px-4 py-8 text-center text-muted text-sm">
              2글자 이상 입력하면 검색이 시작됩니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface font-sans text-[11px]">
                &uarr;
              </kbd>
              <kbd className="px-1 py-0.5 rounded bg-surface font-sans text-[11px]">
                &darr;
              </kbd>
              <span className="ml-0.5">탐색</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-surface font-sans text-[11px]">
                &crarr;
              </kbd>
              <span className="ml-0.5">이동</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface font-sans text-[11px]">
              ESC
            </kbd>
            <span className="ml-0.5">닫기</span>
          </span>
        </div>
      </div>
    </dialog>
  );
}
