import Link from "next/link";
import { getTags } from "@/lib/queries";
import { tagInfoOf } from "@/lib/strata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "tags",
  description: "주제별로 글 모아보기",
};

export default async function TagsPage() {
  const tags = await getTags();
  const info = tagInfoOf(tags);

  return (
    <div className="pt-14">
      <section className="mx-auto max-w-[1280px] px-[clamp(20px,2.6vw,48px)] py-14">
        <h1 className="text-3xl font-bold tracking-tight">태그</h1>
        <p className="mt-3 text-sm text-muted">
          주제별로 쌓인 글을 모아봅니다. 색은 홈의 지층 색과 같은 규칙을 씁니다.
        </p>

        {tags.length === 0 ? (
          <p className="mt-16 text-sm text-muted">
            아직 만든 태그가 없습니다. 글에 태그를 달면 여기에 주제가 모입니다.
          </p>
        ) : (
          <ul className="mt-12 grid gap-x-16 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={tag.slug} className="group relative">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
                  <span className={`f${info[tag.slug].slot}`} aria-hidden="true">
                    <i className="swatch" />
                  </span>
                  <Link
                    href={`/tags/${tag.slug}`}
                    className="after:absolute after:inset-0 group-hover:text-accent transition-colors"
                  >
                    {tag.name}
                  </Link>
                  <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">
                    {tag.postCount}
                  </span>
                </h2>
                {tag.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2 max-w-[42ch]">
                    {tag.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
