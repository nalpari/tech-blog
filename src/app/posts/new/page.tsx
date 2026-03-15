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
      <div className="mx-auto max-w-[740px] px-10 py-12 animate-fade-in-up">
        <h1 className="text-xl font-mono font-bold mb-1">
          <span className="text-accent">&gt;</span> new_post
        </h1>
        <p className="text-sm font-sans text-muted mb-10">
          {"// 마크다운으로 포스트를 작성하거나 .md 파일을 업로드하세요"}
        </p>

        {tagError && (
          <div className="mb-6 p-3 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-sans">
            {"// 태그를 불러오지 못했습니다"}
          </div>
        )}

        <PostEditor tags={tags ?? []} />
      </div>
    </div>
  );
}
