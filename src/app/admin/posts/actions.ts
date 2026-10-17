"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";

import { ADMIN_EMAIL } from "@/lib/auth";
import { deletePostAndQueueImages } from "@/lib/delete-post";

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
    .select("slug, status, published_at")
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

  updateTag(POST_CACHE_TAG(post.slug));
  revalidatePath("/admin/posts");
  revalidatePath("/");
  return { status: newStatus };
}

export async function deletePost(postId: string) {
  try {
    const supabase = await assertAdmin();
    return await deletePostAndQueueImages(supabase, postId);
  } catch {
    return { error: "삭제 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요." };
  }
}
