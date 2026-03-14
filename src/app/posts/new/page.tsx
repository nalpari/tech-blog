import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/post-editor";

export const metadata = {
  title: "새 포스트 작성 — Spectra",
};

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch available tags
  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-[740px] px-6 mb-10 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to blog
        </Link>
      </div>

      <div className="mx-auto max-w-[740px] px-6 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          새 포스트 작성
        </h1>
        <p className="text-sm text-muted-foreground/60 mb-10">
          마크다운으로 포스트를 작성하거나 .md 파일을 업로드하세요.
        </p>

        {tagError && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
            태그를 불러오지 못했습니다. 태그 없이 포스트를 작성할 수 있습니다.
          </div>
        )}

        <PostEditor tags={tags ?? []} />
      </div>
    </div>
  );
}
