import Image from "next/image";
import Link from "next/link";
import { type Post, formatDate } from "@/lib/data";
import { ViewCount } from "@/components/view-counter";
import { LikeButton } from "@/components/like-button";

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">

      <article
        className="relative rounded-xl border border-border/40 hover:border-border/80 bg-card/30 hover:bg-card/60 transition-all duration-300 h-full overflow-hidden"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="relative w-full h-40 overflow-hidden">
          {post.coverImage ? (
            <>
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br ${post.coverGradient || "from-indigo-500/20 via-purple-500/10 to-transparent"}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/20">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-background">
              <LikeButton slug={post.slug} initialCount={post.likeCount} compact />
            </span>
          </div>
        </div>

        <div className="p-6">
          {post.featured && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-accent border border-accent/40">
                <span className="size-1 rounded-full bg-accent animate-pulse" />
                Featured
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/4 text-muted-foreground"
              >
                {tag.replaceAll("-", " ")}
              </span>
            ))}
          </div>

          <h3 className="text-[17px] font-semibold leading-snug text-foreground group-hover:text-accent transition-colors duration-200 tracking-tight mb-3 pr-8">
            {post.title}
          </h3>

          <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 line-clamp-2">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="size-0.5 rounded-full bg-muted-foreground/30" />
              <span>{post.readTime}</span>
              <span className="size-0.5 rounded-full bg-muted-foreground/30" />
              <ViewCount count={post.viewCount} />
            </div>

            <span className="text-xs text-accent/60 opacity-0 group-hover:opacity-100 transition-all duration-300">
              Read &rarr;
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function FeaturedPostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl border border-border/40 hover:border-border/80 transition-all duration-500">
        {post.coverImage ? (
          <>
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/20" />
          </>
        ) : (
          <>
            <div
              className={`absolute inset-0 bg-linear-to-br ${post.coverGradient || "from-indigo-500/10 via-purple-500/5 to-transparent"}`}
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
          </>
        )}

        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-background">
            <LikeButton slug={post.slug} initialCount={post.likeCount} compact />
          </span>
        </div>

        <div className="relative p-8 sm:p-10 pt-24 sm:pt-32">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-background text-accent border border-accent/40">
              <span className="size-1 rounded-full bg-accent animate-pulse" />
              Featured
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/4 text-muted-foreground backdrop-blur-sm"
              >
                {tag.replaceAll("-", " ")}
              </span>
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground group-hover:text-accent transition-colors duration-300 tracking-tight mb-4">
            {post.title}
          </h2>

          <p className="text-base text-muted-foreground/80 leading-relaxed mb-6 max-w-2xl">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground/50">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="size-0.5 rounded-full bg-muted-foreground/30" />
            <span>{post.readTime}</span>
            <span className="size-0.5 rounded-full bg-muted-foreground/30" />
            <ViewCount count={post.viewCount} />
          </div>
        </div>
      </article>
    </Link>
  );
}
