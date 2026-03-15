import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/data";
import { getPostBySlug, getPostsByTag } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { TagBadge } from "@/components/tag-badge";
import { PostCard } from "@/components/post-card";
import { MarkdownContent } from "@/components/markdown-content";
import { DeletePostButton } from "@/components/delete-post-button";

const ADMIN_EMAIL = "yoo32767@gmail.com";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const relatedPosts = post.tags[0]
    ? (await getPostsByTag(post.tags[0]))
        .filter((p) => p.slug !== post.slug)
        .slice(0, 3)
    : [];

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[1024px] px-10 py-12">
        {/* Article Header */}
        <header className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} slug={tag} size="sm" />
            ))}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/posts/${post.slug}/edit`}
                  className="text-xs font-mono text-muted-foreground hover:text-accent border border-border hover:border-accent/50 px-2.5 py-1 transition-colors"
                >
                  edit
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-mono font-bold leading-tight mb-4">
            {post.title.toLowerCase()}
          </h1>

          <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
            <time dateTime={post.date}>
              {formatDate(post.date).toLowerCase()}
            </time>
            {post.readTime && (
              <>
                <span className="text-muted-foreground">·</span>
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
          <article className="prose-blog animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <MarkdownContent content={post.content} />
          </article>
        )}

        {/* Tags footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono mb-3">
            {"// tags"}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} slug={tag} size="md" />
            ))}
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono mb-6">
              {"// related_posts"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {relatedPosts.map((p, i) => (
                <PostCard key={p.slug} post={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
