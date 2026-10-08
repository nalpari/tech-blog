import Link from "next/link";
import { notFound } from "next/navigation";
import { getTags, getTagBySlug, getPostsByTag } from "@/lib/queries";
import { tagInfoOf } from "@/lib/strata";
import { PostCard } from "@/components/post-card";

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
  const info = tagInfoOf(allTags);

  return (
    <div className="pt-14">
      <section className="mx-auto max-w-[1280px] px-[clamp(20px,2.6vw,48px)] pt-14 pb-10">
        <nav aria-label="현재 위치" className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground transition-colors">
            blog
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/tags" className="hover:text-foreground transition-colors">
            tags
          </Link>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
        {tag.description && (
          <p className="mt-3 text-sm text-muted max-w-2xl">{tag.description}</p>
        )}
        <p className="mt-3 font-mono text-xs tabular-nums text-muted-foreground">
          {tag.postCount}편
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-[clamp(20px,2.6vw,48px)] pb-10">
        <div className="flex gap-16">
          <div className="flex-1 min-w-0">
            {tagPosts.length > 0 ? (
              <div className="space-y-9">
                {tagPosts.map((post) => (
                  <PostCard key={post.slug} post={post} tagInfo={info} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted py-10">
                이 주제로 발행된 글이 아직 없습니다.
              </p>
            )}
          </div>

          {otherTags.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0" aria-label="다른 태그">
              <h2 className="text-xs text-muted-foreground mb-4">다른 태그</h2>
              <ul className="flex flex-col gap-2.5">
                {otherTags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tags/${t.slug}`}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
