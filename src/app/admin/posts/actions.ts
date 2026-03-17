"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "yoo32767@gmail.com";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.email !== ADMIN_EMAIL) {
    throw new Error("권한이 없습니다.");
  }

  return supabase;
}

export async function togglePostStatus(postId: string) {
  const supabase = await assertAdmin();

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("status, published_at")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return { error: "포스트를 찾을 수 없습니다." };
  }

  const newStatus = post.status === "published" ? "draft" : "published";
  const isPublishing = newStatus === "published";

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      status: newStatus,
      published_at: isPublishing ? new Date().toISOString() : post.published_at,
    })
    .eq("id", postId);

  if (updateError) {
    return { error: `상태 변경에 실패했습니다: ${updateError.message}` };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/");
  return { status: newStatus };
}

export async function deletePost(postId: string) {
  const supabase = await assertAdmin();

  // Delete related records first
  const deletes = await Promise.all([
    supabase.from("post_tags").delete().eq("post_id", postId),
    supabase.from("post_likes").delete().eq("post_id", postId),
    supabase.from("post_views").delete().eq("post_id", postId),
    supabase.from("bookmarks").delete().eq("post_id", postId),
  ]);

  const relatedError = deletes.find((d) => d.error);
  if (relatedError?.error) {
    return { error: `관련 데이터 삭제에 실패했습니다: ${relatedError.error.message}` };
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    return { error: `포스트 삭제에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/");
  return { success: true };
}
