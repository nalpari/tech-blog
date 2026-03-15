import Link from "next/link";
import { getTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "tags",
  description: "browse articles by topic",
};

export default async function TagsPage() {
  const tags = await getTags();
  const totalPosts = tags.reduce((acc, t) => acc + t.postCount, 0);

  return (
    <div className="pt-14">
      <section className="mx-auto max-w-[1200px] px-10 py-10">
        <p className="text-xs text-muted-foreground font-mono mb-8">
          {"// all_tags"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="group block"
            >
              <div className="p-5 border border-border hover:border-accent/30 bg-background transition-colors duration-200 h-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold text-foreground group-hover:text-accent transition-colors">
                    $ {tag.name.toLowerCase()}
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {tag.postCount}
                  </span>
                </div>

                <p className="text-[13px] font-sans text-muted leading-relaxed line-clamp-2 flex-1">
                  {tag.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-border flex items-center gap-8">
          {[
            { label: "tags", value: tags.length },
            { label: "posts", value: totalPosts },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-accent font-mono text-lg font-bold">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground font-sans">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
