import Link from "next/link";
import { type PostSummary } from "@/lib/data";
import { kstYmd } from "@/lib/strata";
import { ViewCount } from "@/components/view-counter";
import { LikeButton } from "@/components/like-button";

// 태그 slug -> 표시 이름과 지층 색 슬롯. 서버에서 만들어 내려주며, 없으면 slug를 그대로 쓴다.
export type TagInfo = Record<string, { name: string; slot: number }>;

// 글 한 편은 로그의 한 줄이다. 제목 링크가 행 전체를 덮어서 어디를 눌러도 글로 간다.
export function PostCard({
  post,
  tagInfo,
  marker = false,
}: {
  post: PostSummary;
  tagInfo?: TagInfo;
  // 월별 로그에서 왼쪽 코어 기둥에 자기 지층군 구간을 칠한다.
  marker?: boolean;
}) {
  const primary = post.tags[0] ? tagInfo?.[post.tags[0]]?.slot : undefined;

  return (
    <article className="group relative">
      {marker && <i className={`log-core f${primary ?? 5}`} aria-hidden="true" />}
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors text-balance">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-offset-4"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2 max-w-[62ch]">
            {post.excerpt}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <time dateTime={post.date} className="font-mono tabular-nums">
            {kstYmd(post.date)}
          </time>
          {post.tags.map((tag) => {
            const info = tagInfo?.[tag];
            return (
              <span key={tag} className={`inline-flex items-center gap-1.5 f${info?.slot ?? 5}`}>
                <i className="swatch" aria-hidden="true" />
                {info?.name ?? tag.replaceAll("-", " ")}
              </span>
            );
          })}
        </div>
        <div className="mt-1.5 flex items-center gap-x-4 text-xs text-muted-foreground">
          {post.readTime && <span>{post.readTime}</span>}
          <ViewCount count={post.viewCount} />
          <span className="relative z-10">
            <LikeButton
              slug={post.slug}
              initialCount={post.likeCount}
              initialLiked={post.liked}
              compact
            />
          </span>
        </div>
      </div>
    </article>
  );
}
