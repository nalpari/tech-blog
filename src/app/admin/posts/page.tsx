import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostsManageContent } from "./posts-manage-content";

import { ADMIN_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Manage Posts — Spectra Admin",
};

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, status, featured, view_count, like_count, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[1200px] px-10 py-12">
        <header className="mb-10 animate-fade-in-up">
          <p className="text-xs font-mono text-accent mb-2">{"// admin"}</p>
          <h1 className="text-2xl font-mono font-bold">manage posts</h1>
          <p className="text-sm text-muted-foreground mt-2">
            포스트 상태 관리 및 편집
          </p>
        </header>

        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <PostsManageContent posts={posts ?? []} />
        </div>
      </div>
    </div>
  );
}
