import Link from "next/link";
import { type Post, formatDate } from "@/lib/data";

export function PostCard({ post }: { post: Post; index?: number }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="p-6 border border-border hover:border-accent/30 bg-background transition-colors duration-200 h-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {post.tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono px-2 py-0.5 border border-accent text-accent"
            >
              {tag.replace(/-/g, "_")}
            </span>
          ))}
          <span className="text-muted-foreground font-mono text-xs">·</span>
          <span className="text-muted-foreground font-sans text-xs">
            {post.readTime}
          </span>
        </div>

        <h3 className="text-[15px] font-mono font-bold leading-snug text-foreground group-hover:text-accent transition-colors">
          {post.title.toLowerCase()}
        </h3>

        <p className="text-[13px] font-sans text-muted leading-relaxed line-clamp-2 flex-1">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
          <time dateTime={post.date}>{formatDate(post.date).toLowerCase()}</time>
        </div>
      </article>
    </Link>
  );
}

export function FeaturedPostCard({ post }: { post: Post }) {
  return <PostCard post={post} />;
}
