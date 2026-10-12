import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/post-editor";

export const metadata = {
  title: "new post",
};

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[740px] px-10 py-12">
        <h1 className="text-2xl font-bold tracking-[-0.02em] mb-2">
          new post
        </h1>
        <p className="text-sm text-muted mb-10">
          마크다운으로 포스트를 작성하거나 .md 파일을 업로드하세요
        </p>

        {tagError && (
          <div className="mb-6 p-3 rounded border border-accent-amber/30! bg-accent-amber/10 text-accent-amber text-sm">
            태그를 불러오지 못했습니다
          </div>
        )}

        <PostEditor tags={tags ?? []} />
      </div>
    </div>
  );
}
