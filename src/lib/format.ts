import type { Tag } from "@/lib/data";

const KST = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 2026-05-18T01:59:06Z -> "2026.05.18" (KST 기준, 서버 시간대와 무관)
export function kstYmd(iso: string): string {
  return KST.format(new Date(iso)).replaceAll("-", ".");
}

// 태그 slug -> 표시 이름.
export function tagInfoOf(tags: Tag[]): Record<string, { name: string }> {
  return Object.fromEntries(tags.map((t) => [t.slug, { name: t.name }]));
}
