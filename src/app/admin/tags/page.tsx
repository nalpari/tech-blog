import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { TagManager } from "./tag-manager";

export const metadata = {
  title: "manage tags",
};

export default async function AdminTagsPage() {
  const supabase = await requireAdmin();
  if (!supabase) redirect("/");

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[720px] px-10 py-12">
        <h1 className="text-2xl font-bold tracking-[-0.02em] mb-2">
          manage tags
        </h1>
        <p className="text-sm text-muted mb-10">
          태그를 추가, 수정, 삭제할 수 있습니다
        </p>

        <TagManager initialTags={tags ?? []} />
      </div>
    </div>
  );
}
