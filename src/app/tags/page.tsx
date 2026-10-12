import Link from "next/link";
import { getTags } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "tags",
  description: "주제별로 글 모아보기",
};

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="pt-14">
      <section className="mx-auto max-w-[720px] px-[clamp(20px,4vw,40px)] py-16 sm:py-20">
        <h1 className="text-[28px] sm:text-[36px] leading-[1.25] font-bold tracking-[-0.02em]">태그</h1>
        <p className="mt-3 text-[15px] text-muted">주제별로 쌓인 글을 모아봅니다.</p>

        {tags.length === 0 ? (
          <p className="mt-16 text-[15px] text-muted">
            아직 만든 태그가 없습니다. 글에 태그를 달면 여기에 주제가 모입니다.
          </p>
        ) : (
          <ul className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {tags.map((tag) => (
              <li key={tag.slug} className="group relative">
                <h2 className="flex items-baseline gap-2 text-[18px] font-semibold tracking-[-0.01em]">
                  <Link
                    href={`/tags/${tag.slug}`}
                    className="after:absolute after:inset-0 group-hover:text-accent transition-colors"
                  >
                    {tag.name}
                  </Link>
                  <span className="text-sm font-normal tabular-nums text-muted">{tag.postCount}</span>
                </h2>
                {tag.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
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
