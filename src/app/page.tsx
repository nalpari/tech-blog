import { getPosts, POSTS_PER_PAGE } from "@/lib/queries";
import { PostGrid } from "@/components/post-grid";

export default async function HomePage() {
  const initialPosts = await getPosts({ offset: 0, limit: POSTS_PER_PAGE });

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
          <PostGrid initialPosts={initialPosts} pageSize={POSTS_PER_PAGE} />
        ) : (
          <p className="text-center text-muted-foreground py-20 font-sans text-sm">
            {"// no posts published yet"}
          </p>
        )}
      </section>
    </div>
  );
}
