import Link from "next/link";
import { notFound } from "next/navigation";
import { getTags, getTagBySlug, getPostsByTag } from "@/lib/queries";
import { tagInfoOf } from "@/lib/format";
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
      <div className="mx-auto max-w-[720px] px-[clamp(20px,4vw,40px)] py-16 sm:py-20">
        <nav aria-label="현재 위치" className="flex items-center gap-2 text-[13px] text-muted mb-5">
          <Link href="/" className="hover:text-foreground transition-colors">
            blog
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/tags" className="hover:text-foreground transition-colors">
            tags
          </Link>
        </nav>

        <h1 className="text-[28px] sm:text-[36px] leading-[1.25] font-bold tracking-[-0.02em]">{tag.name}</h1>
        {tag.description && (
          <p className="mt-3 text-[15px] text-muted">{tag.description}</p>
        )}
        <p className="mt-2 text-[13px] tabular-nums text-muted">{tag.postCount}편</p>

        <div className="mt-12">
          {tagPosts.length > 0 ? (
            <div className="space-y-9">
              {tagPosts.map((post) => (
                <PostCard key={post.slug} post={post} tagInfo={info} />
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-muted py-10">
              이 주제로 발행된 글이 아직 없습니다.
            </p>
          )}
        </div>

        {otherTags.length > 0 && (
          <section aria-label="다른 태그" className="mt-16 border-t border-border pt-8">
            <h2 className="text-sm font-semibold text-muted mb-4">다른 태그</h2>
            <div className="flex flex-wrap gap-2">
              {otherTags.map((t) => (
                <TagBadge key={t.slug} slug={t.slug} name={t.name} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
