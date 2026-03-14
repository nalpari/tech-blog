import Link from "next/link";
import { notFound } from "next/navigation";
import { getTags, getTagBySlug, getPostsByTag } from "@/lib/queries";
import { PostCard } from "@/components/post-card";
import { TagBadge } from "@/components/tag-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Topic Not Found" };
  return {
    title: tag.name,
    description: tag.description,
  };
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tag, tagPosts, allTags] = await Promise.all([
    getTagBySlug(slug),
    getPostsByTag(slug),
    getTags(),
  ]);
  if (!tag) notFound();

  const otherTags = allTags.filter((t) => t.slug !== slug).slice(0, 6);

  return (
    <div className="pt-28 pb-20">
      {/* Back nav */}
      <div className="mx-auto max-w-[1200px] px-6 mb-10 animate-fade-in">
        <Link
          href="/tags"
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
          All topics
        </Link>
      </div>

      {/* Tag Header */}
      <section className="mx-auto max-w-[1200px] px-6 mb-16 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-2xl border border-border/30 glass-card p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-accent-secondary/[0.02]" />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
              Topic
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
              {tag.name}
            </h1>

            <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
              {tag.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground/50">
              <span className="font-mono">
                {tag.postCount} {tag.postCount === 1 ? "article" : "articles"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="mx-auto max-w-[1200px] px-6">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
            Articles
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {tagPosts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {tagPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground/60 text-sm">
              No articles published in this topic yet.
            </p>
          </div>
        )}
      </section>

      {/* Other Topics */}
      <section className="mx-auto max-w-[1200px] px-6 mt-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
            Other Topics
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="flex flex-wrap gap-2">
          {otherTags.map((t) => (
            <TagBadge key={t.slug} slug={t.slug} name={t.name} size="md" />
          ))}
        </div>
      </section>
    </div>
  );
}
