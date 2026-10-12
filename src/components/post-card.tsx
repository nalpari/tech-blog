import Link from "next/link";
import { type PostSummary } from "@/lib/data";
import { kstYmd } from "@/lib/format";

// 태그 slug -> 표시 이름. 서버에서 만들어 내려주며, 없으면 slug를 그대로 쓴다.
export type TagInfo = Record<string, { name: string }>;

// 글 한 편은 목록의 한 행이다. 제목 링크가 행 전체를 덮어서 어디를 눌러도 글로 간다.
// short(MM.DD)는 연도 제목 아래에서 쓰고 md 이상에서 왼쪽 칼럼에 둔다.
// full(YYYY.MM.DD)은 왼쪽 칼럼에 들어가지 않으므로 항상 제목 위 한 줄이다.
export function PostCard({
  post,
  tagInfo,
  dateStyle = "full",
}: {
  post: PostSummary;
  tagInfo?: TagInfo;
  dateStyle?: "short" | "full";
}) {
  const ymd = kstYmd(post.date);
  const short = dateStyle === "short";

  return (
    <article className={`group relative ${short ? "md:grid md:grid-cols-[4.5rem_1fr] md:gap-x-6" : ""}`}>
      <time
        dateTime={post.date}
        className={`block text-[13px] tabular-nums text-muted ${short ? "mb-1.5 md:mb-0 md:pt-1" : "mb-1.5"}`}
      >
        {short ? ymd.slice(5) : ymd}
      </time>
      <div className="min-w-0">
        <h3 className="text-[20px] leading-snug font-semibold tracking-[-0.02em] break-keep text-balance text-foreground group-hover:text-accent transition-colors">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-offset-4"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted break-keep line-clamp-2 max-w-[62ch]">
            {post.excerpt}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
            {post.tags.map((tag) => (
              <span key={tag}>{tagInfo?.[tag]?.name ?? tag.replaceAll("-", " ")}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
