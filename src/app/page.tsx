import { getArchiveBeds, getPosts, getTags, POSTS_PER_PAGE } from "@/lib/queries";
import { TITLED_BEDS, tagInfoOf } from "@/lib/strata";
import { PostGrid } from "@/components/post-grid";
import { ScrollToTop } from "@/components/scroll-to-top";
import { StrataHero } from "@/components/strata-hero";

export default async function HomePage() {
  // 기둥은 발행 글 전체(가벼운 컬럼만), 목록은 제목이 붙은 큰 층 다음 글부터 이어진다.
  const [archive, fetched, tags] = await Promise.all([
    getArchiveBeds(),
    getPosts({ offset: TITLED_BEDS, limit: POSTS_PER_PAGE + 1 }),
    getTags(),
  ]);
  const hasMore = fetched.length > POSTS_PER_PAGE;
  const initialPosts = hasMore ? fetched.slice(0, POSTS_PER_PAGE) : fetched;

  return (
    <div>
      <div className="hero-root">
        <StrataHero posts={archive} tags={tags} />
      </div>

      {archive.length === 0 && (
        <p className="mx-auto max-w-[62ch] px-6 py-24 text-center text-sm text-muted">
          아직 발행된 글이 없습니다. 첫 글을 발행하면 여기에 첫 지층이 쌓입니다.
        </p>
      )}

      {initialPosts.length > 0 && (
        <section
          aria-label="이전 글"
          className="mx-auto max-w-[900px] px-[clamp(20px,2.6vw,48px)] pt-16"
        >
          <PostGrid
            initialPosts={initialPosts}
            initialHasMore={hasMore}
            pageSize={POSTS_PER_PAGE}
            tagInfo={tagInfoOf(tags)}
            startOffset={TITLED_BEDS}
          />
        </section>
      )}

      <ScrollToTop />
    </div>
  );
}
