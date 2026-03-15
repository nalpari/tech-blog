import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TagManager } from "./tag-manager";

const ADMIN_EMAIL = "yoo32767@gmail.com";

export const metadata = {
  title: "manage tags",
};

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[720px] px-10 py-12 animate-fade-in-up">
        <h1 className="text-xl font-mono font-bold mb-1">
          <span className="text-accent">&gt;</span> manage_tags
        </h1>
        <p className="text-sm font-sans text-muted mb-10">
          {"// 태그를 추가, 수정, 삭제할 수 있습니다"}
        </p>

        <TagManager initialTags={tags ?? []} />
      </div>
    </div>
  );
}
