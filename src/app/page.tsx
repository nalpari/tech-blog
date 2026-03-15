import { getPosts } from "@/lib/queries";
import { PostCard } from "@/components/post-card";

export default async function HomePage() {
  const allPosts = await getPosts();

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

        {allPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {allPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-20 font-sans text-sm">
            {"// no posts published yet"}
          </p>
        )}
      </section>
    </div>
  );
}
