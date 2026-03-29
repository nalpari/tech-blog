import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./dashboard-content";

import { ADMIN_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Dashboard — Spectra Admin",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  // 게시글 목록 (view_count, like_count 포함)
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, view_count, like_count, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // 좋아요 이력 (누가 어떤 포스트를)
  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id, user_id, created_at, profiles(username, display_name, avatar_url), posts(title, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  // 조회 이력 (로그인 사용자만)
  const { data: views } = await supabase
    .from("post_views")
    .select("post_id, user_id, created_at, profiles(username, display_name, avatar_url), posts(title, slug)")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[1200px] px-10 py-12">
        <header className="mb-10 animate-fade-in-up">
          <p className="text-xs font-mono text-accent mb-2">{"// admin"}</p>
          <h1 className="text-2xl font-mono font-bold">dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            게시글 조회수 및 좋아요 통계
          </p>
        </header>

        <DashboardContent
          posts={posts ?? []}
          likes={likes ?? []}
          views={views ?? []}
        />
      </div>
    </div>
  );
}
