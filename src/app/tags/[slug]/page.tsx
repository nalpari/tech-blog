import Link from "next/link";
import { notFound } from "next/navigation";
import { getTags, getTagBySlug, getPostsByTag } from "@/lib/queries";
import { formatDate } from "@/lib/data";

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
    openGraph: {
      title: tag.name,
      description: tag.description ?? undefined,
    },
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

  const otherTags = allTags.filter((t) => t.slug !== slug);

  return (
    <div className="pt-14">
      {/* Tag Header */}
      <section className="mx-auto max-w-[1200px] px-10 py-8 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            blog
          </Link>
          <span>/</span>
          <Link
            href="/tags"
            className="hover:text-foreground transition-colors"
          >
            tags
          </Link>
          <span>/</span>
          <span className="text-accent">{slug}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl font-mono font-bold">
            <span className="text-accent">$</span> {tag.name.toLowerCase()}
          </h1>
        </div>

        <p className="text-sm font-sans text-muted mb-4 max-w-2xl">
          {`// ${tag.description?.toLowerCase()}`}
        </p>

        <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
          <span>{tag.postCount} items</span>
        </div>
      </section>

      {/* Two-column layout: Posts + Sidebar */}
      <section className="mx-auto max-w-[1200px] px-10 py-10">
        <div className="flex gap-10">
          {/* Posts list */}
          <div className="flex-1 min-w-0">
            {tagPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {tagPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group block py-5 first:pt-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 border border-accent text-accent">
                        {slug.replace(/-/g, "_")}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        ·
                      </span>
                      <span className="text-muted-foreground font-sans text-xs">
                        {formatDate(post.date).toLowerCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-mono font-bold text-foreground group-hover:text-accent transition-colors mb-2">
                      {post.title.toLowerCase()}
                    </h3>
                    <p className="text-[13px] font-sans text-muted leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-sans">
                      {post.readTime && <span>{post.readTime}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-sans text-sm py-10">
                {"// no articles published in this topic yet"}
              </p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 border-l border-border pl-8">
            <p className="text-xs text-muted-foreground font-mono mb-4">
              {"// related_tags"}
            </p>
            <div className="flex flex-col gap-2">
              {otherTags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tags/${t.slug}`}
                  className="text-sm font-mono text-muted hover:text-accent transition-colors"
                >
                  # {t.name.toLowerCase()}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
