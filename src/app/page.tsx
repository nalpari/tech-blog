import { getPosts, getTags, POSTS_PER_PAGE } from "@/lib/queries";
import { tagInfoOf } from "@/lib/format";
import { PostGrid } from "@/components/post-grid";
import { ScrollToTop } from "@/components/scroll-to-top";

export default async function HomePage() {
  const [fetched, tags] = await Promise.all([
    getPosts({ offset: 0, limit: POSTS_PER_PAGE + 1 }),
    getTags(),
  ]);
  const hasMore = fetched.length > POSTS_PER_PAGE;
  const initialPosts = hasMore ? fetched.slice(0, POSTS_PER_PAGE) : fetched;

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[720px] px-[clamp(20px,4vw,40px)] pb-16">
        <h1 className="py-16 sm:py-20 text-[28px] sm:text-[36px] leading-[1.25] font-bold tracking-[-0.02em] break-keep text-balance">
          개발하며 배운 것을 쌓아두는 블로그
        </h1>

        {initialPosts.length === 0 ? (
          <p className="text-[15px] text-muted">
            아직 발행된 글이 없습니다. 첫 글을 발행하면 여기에 쌓입니다.
          </p>
        ) : (
          <section aria-label="글 목록">
            <PostGrid
              initialPosts={initialPosts}
              initialHasMore={hasMore}
              pageSize={POSTS_PER_PAGE}
              tagInfo={tagInfoOf(tags)}
            />
          </section>
        )}
      </div>

      <ScrollToTop />
    </div>
  );
}
