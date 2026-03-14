import Link from "next/link";
import { getTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Browse articles by topic — from systems design to modern frontend frameworks.",
};

export default async function TagsPage() {
  const tags = await getTags();
  const totalPosts = tags.reduce((acc, t) => acc + t.postCount, 0);

  return (
    <div className="pt-32 pb-20">
      {/* Header */}
      <section className="mx-auto max-w-[1200px] px-6 mb-16">
        <div className="max-w-2xl animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 glow-line opacity-60" />
            <span className="text-xs font-medium uppercase tracking-widest text-accent/70">
              Explore
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
            Browse by{" "}
            <span className="font-serif italic font-normal text-accent">
              topic
            </span>
          </h1>

          <p className="text-lg text-muted-foreground/80 leading-relaxed">
            Dive into our collection of articles organized by the technologies
            and concepts we cover most.
          </p>
        </div>
      </section>

      {/* Tags Grid */}
      <section className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {tags.map((tag, i) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="group block"
            >
              <div
                className="relative p-6 rounded-xl border border-border/40 hover:border-border/80 bg-card/30 hover:bg-card/60 transition-all duration-300 h-full"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors duration-200 tracking-tight">
                      {tag.name}
                    </h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground/30 group-hover:text-accent/50 group-hover:translate-x-0.5 transition-all duration-200"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>

                  <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4 line-clamp-2">
                    {tag.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground/40">
                      {tag.postCount} {tag.postCount === 1 ? "post" : "posts"}
                    </span>
                    <div className="flex-1 h-px bg-border/20" />
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-accent/40 to-accent-secondary/30"
                      style={{
                        width: `${Math.min(tag.postCount * 8, 64)}px`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-[1200px] px-6 mt-20">
        <div className="relative overflow-hidden rounded-2xl border border-border/30 glass-card p-10 sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-violet-500/[0.02]" />

          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { label: "Topics", value: tags.length.toString() },
              { label: "Total Posts", value: totalPosts.toString() },
              { label: "Authors", value: "4" },
              { label: "Since", value: "2024" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight gradient-text mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
