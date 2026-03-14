import { getPosts, getFeaturedPosts } from "@/lib/queries";
import { FeaturedPostCard, PostCard } from "@/components/post-card";

export default async function HomePage() {
  const [featured, allPosts] = await Promise.all([
    getFeaturedPosts(),
    getPosts(),
  ]);
  const regularPosts = allPosts.filter((p) => !p.featured);

  return (
    <div className="pt-32 pb-20">
      {/* Hero Section */}
      <section className="mx-auto max-w-[1200px] px-6 mb-20">
        <div className="max-w-3xl animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 glow-line opacity-60" />
            <span className="text-xs font-medium uppercase tracking-widest text-accent/70">
              Engineering Blog
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Ideas at the{" "}
            <span className="font-serif italic font-normal text-accent">
              intersection
            </span>{" "}
            of code &amp; craft
          </h1>

          <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-xl">
            Deep dives into systems design, modern frameworks, and the
            engineering decisions that shape great software.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 mb-20">
          <div className="grid gap-6 md:grid-cols-2 stagger-children">
            {featured.map((post) => (
              <FeaturedPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="mx-auto max-w-[1200px] px-6 mb-12">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
            Latest Posts
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      </div>

      {/* Post Grid */}
      <section className="mx-auto max-w-[1200px] px-6">
        {regularPosts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {regularPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground/60 py-20 text-sm">
            No posts published yet.
          </p>
        )}
      </section>
    </div>
  );
}
