import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/data";
import { getPostBySlug, getPostsByTag } from "@/lib/queries";
import { TagBadge } from "@/components/tag-badge";
import { PostCard } from "@/components/post-card";
import { MarkdownContent } from "@/components/markdown-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = post.tags[0]
    ? (await getPostsByTag(post.tags[0]))
        .filter((p) => p.slug !== post.slug)
        .slice(0, 3)
    : [];

  return (
    <div className="pt-28 pb-20">
      {/* Back nav */}
      <div className="mx-auto max-w-[740px] px-6 mb-10 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to blog
        </Link>
      </div>

      {/* Article Header */}
      <header className="mx-auto max-w-[740px] px-6 mb-12 animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {post.tags.map((tag) => (
            <TagBadge key={tag} slug={tag} size="md" />
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight leading-[1.15] mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground/80 leading-relaxed mb-8">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.readTime && (
            <>
              <span className="size-0.5 rounded-full bg-muted-foreground/30" />
              <span>{post.readTime}</span>
            </>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="mx-auto max-w-[740px] px-6 mb-12 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-border/20">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 740px) 100vw, 740px"
              priority
            />
          </div>
        </div>
      )}

      {/* Gradient line */}
      <div className="mx-auto max-w-[740px] px-6 mb-12">
        <div className="h-px glow-line opacity-40" />
      </div>

      {/* Article Content */}
      {post.content && (
        <article
          className="mx-auto max-w-[740px] px-6 animate-fade-in-up prose-blog"
          style={{ animationDelay: "100ms" }}
        >
          <MarkdownContent content={post.content} />
        </article>
      )}

      {/* Share & Tags footer */}
      <div className="mx-auto max-w-[740px] px-6 mt-16">
        <div className="h-px glow-line opacity-20 mb-8" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} slug={tag} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50">Share</span>
            <button className="size-8 rounded-lg border border-border/40 hover:border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
              </svg>
            </button>
            <button className="size-8 rounded-lg border border-border/40 hover:border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 mt-24">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              Related Posts
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {relatedPosts.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
