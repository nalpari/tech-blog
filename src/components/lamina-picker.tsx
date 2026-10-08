"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lamina } from "@/lib/strata";

// 압축된 오래된 글 띠를 고를 수 있게 하는 투명한 층.
// 마우스는 움직이면 고르고 클릭하면 열며, 터치는 탭하면 나타나는 제목 링크를 눌러 연다.
// 키보드는 위아래 화살표로 고르고 Enter로 연다.
export function LaminaPicker({ items, top }: { items: Lamina[]; top: number }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const pointer = useRef<string>("mouse");
  const [active, setActive] = useState<number | null>(null);

  function pick(clientY: number) {
    const box = ref.current?.getBoundingClientRect();
    if (!box || box.height === 0) return;
    const y = top + ((clientY - box.top) / box.height) * (1 - top);
    let best = 0;
    for (let i = 1; i < items.length; i++) {
      if (Math.abs(items[i].y - y) < Math.abs(items[best].y - y)) best = i;
    }
    setActive(best);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => Math.min(Math.max((a ?? (step > 0 ? -1 : items.length)) + step, 0), items.length - 1));
    } else if (e.key === "Enter" && active !== null) {
      router.push(`/posts/${items[active].slug}`);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const item = active === null ? null : items[active];
  const at = item ? `${((item.y - top) / (1 - top)) * 100}%` : undefined;

  return (
    <div
      ref={ref}
      className="lamina-picker"
      style={{ top: `${top * 100}%` }}
      role="group"
      tabIndex={0}
      aria-label={`이전 글 ${items.length}편. 위아래 화살표로 고르고 Enter로 엽니다`}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
        pick(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") pick(e.clientY);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setActive(null);
      }}
      onClick={(e) => {
        if (pointer.current === "mouse" && item && !(e.target as HTMLElement).closest("a")) {
          router.push(`/posts/${item.slug}`);
        }
      }}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {item && (
        <>
          <span className="lamina-mark" style={{ top: at }} aria-hidden="true" />
          <Link
            href={`/posts/${item.slug}`}
            className="lamina-tip"
            style={{ top: at }}
            aria-live="polite"
          >
            <span>{item.title}</span>
            <time>{item.ymd}</time>
          </Link>
        </>
      )}
    </div>
  );
}
