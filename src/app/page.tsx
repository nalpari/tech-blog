import { getPosts, POSTS_PER_PAGE } from "@/lib/queries";
import { PostGrid } from "@/components/post-grid";
import { ScrollToTop } from "@/components/scroll-to-top";

export default async function HomePage() {
  const fetched = await getPosts({ offset: 0, limit: POSTS_PER_PAGE + 1 });
  const hasMore = fetched.length > POSTS_PER_PAGE;
  const initialPosts = hasMore ? fetched.slice(0, POSTS_PER_PAGE) : fetched;

  return (
    <div className="pt-14">
      {/* Hero Section */}
      <section className="mx-auto max-w-[1200px] px-10 py-16 border-b border-border">
        <div className="flex items-center gap-4 justify-center animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-accent font-mono text-3xl font-bold">
              &gt;
            </span>
            <span className="text-foreground font-mono text-[28px] font-bold">
              techlog
            </span>
          </div>
          <p className="text-muted font-sans text-sm">
            {"// where engineers share professional knowledge and technical insights"}
          </p>
        </div>
      </section>

      {/* Posts Section */}
      <section className="mx-auto max-w-[1200px] px-10 py-10">
        <p className="text-muted font-mono text-xs mb-6">
          {"// latest_posts"}
        </p>

        {initialPosts.length > 0 ? (
          <PostGrid initialPosts={initialPosts} initialHasMore={hasMore} pageSize={POSTS_PER_PAGE} />
        ) : (
          <p className="text-center text-muted-foreground py-20 font-sans text-sm">
            {"// no posts published yet"}
          </p>
        )}
      </section>

      <ScrollToTop />
    </div>
  );
}
