import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { kstYmd } from "@/lib/strata";
import { isAdmin } from "@/lib/auth";
import { getLikedPostIds, getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { TagBadge } from "@/components/tag-badge";
import { PostCard } from "@/components/post-card";
import { MarkdownContent } from "@/components/markdown-content";
import { DeletePostButton } from "@/components/delete-post-button";
import { ViewCounter } from "@/components/view-counter";
import { LikeButton } from "@/components/like-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // PostPage와 동일한 인자로 호출해야 cache()가 적중해 쿼리가 1회로 합쳐진다.
  const post = await getPostBySlug(slug, await isAdmin());
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.date,
      ...(post.coverImage && {
        images: [{ url: post.coverImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      title: post.title,
      description: post.excerpt ?? undefined,
      ...(post.coverImage && {
        images: [post.coverImage],
      }),
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const isAdminUser = await isAdmin();
  const post = await getPostBySlug(slug, isAdminUser);

  if (!post) {
    // draft 포스트가 존재하는지 확인하여 적절한 안내 제공
    const supabase = await createClient();
    const { data: draftExists } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .eq("status", "draft")
      .single();

    if (draftExists) {
      return (
        <div className="pt-14">
          <div className="mx-auto max-w-[740px] px-10 py-24 text-center animate-fade-in-up">
            <p className="text-xs font-medium text-amber-400 mb-4">초안</p>
            <h1 className="text-xl font-bold mb-4">
              비공개 포스트입니다
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              이 포스트는 아직 발행되지 않았습니다. 관리자만 열람할 수 있습니다.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 text-xs font-medium text-accent border border-accent/40! hover:bg-accent/10 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      );
    }

    notFound();
  }

  const isDraft = post.status === "draft";

  // 관련 포스트 조회와 좋아요 상태 조회는 서로 의존하지 않으므로 병렬로 실행한다.
  const [relatedPosts, likedIds] = await Promise.all([
    post.tags[0] ? getRelatedPosts(post.tags[0], post.slug) : [],
    getLikedPostIds([post.id]),
  ]);

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[1024px] px-[clamp(20px,4vw,40px)] py-14">
        {/* Draft banner */}
        {isDraft && (
          <div className="mx-auto max-w-[720px] mb-8 px-4 py-3 border border-amber-400/30! bg-amber-400/5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-amber-400">
                초안입니다. 관리자만 볼 수 있습니다.
              </p>
              <Link
                href={`/posts/${post.slug}/edit`}
                className="shrink-0 text-xs font-medium text-amber-400 border border-amber-400/30! hover:bg-amber-400/10 px-2.5 py-1 transition-colors"
              >
                수정하고 발행
              </Link>
            </div>
          </div>
        )}

        {/* Article Header */}
        <header className="mx-auto max-w-[720px] mb-10 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <TagBadge key={tag} slug={tag} size="sm" />
              ))}
            </div>
            {isAdminUser && (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/posts/${post.slug}/edit`}
                  className="text-xs font-medium text-muted hover:text-accent border border-border-strong! hover:border-accent/60! px-2.5 py-1 transition-colors"
                >
                  수정
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-[1.2] tracking-tight text-balance">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <time dateTime={post.date} className="font-mono tabular-nums">
              {kstYmd(post.date)}
            </time>
            {post.readTime && <span>{post.readTime}</span>}
            <ViewCounter slug={post.slug} initialCount={post.viewCount} />
            <LikeButton slug={post.slug} initialCount={post.likeCount} initialLiked={likedIds.has(post.id)} />
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mx-auto max-w-[720px] mb-12 animate-fade-in">
            <Image
              src={post.coverImage}
              alt=""
              width={720}
              height={405}
              className="w-full h-auto rounded-[2px]"
              sizes="(max-width: 720px) 100vw, 720px"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        {post.content && (
          <article className="prose-blog mx-auto max-w-[720px]">
            <MarkdownContent content={post.content} />
          </article>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto max-w-[720px] mt-20 pt-10 border-t border-border" aria-labelledby="related-title">
            <h2 id="related-title" className="text-sm font-semibold text-muted mb-7">
              같은 주제의 글
            </h2>
            <div className="space-y-9">
              {relatedPosts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
