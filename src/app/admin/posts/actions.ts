"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";

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
  const supabase = await assertAdmin();

  // 캐시 무효화에 slug가 필요하므로 삭제 전에 읽어둔다.
  // 여기서 실패하면 무효화 없이 삭제가 진행돼 지워진 글이 60초간 계속
  // 보이므로, 진행하지 않고 중단한다.
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", postId)
    .maybeSingle();

  if (fetchError || !post) {
    return { error: "삭제할 포스트를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요." };
  }

  try {
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

    return { success: true };
  } finally {
    // 어느 단계에서 멈추든 일부 쓰기는 이미 커밋됐을 수 있으므로 무효화한다.
    updateTag(POST_CACHE_TAG(post.slug));
    revalidatePath("/admin/posts");
    revalidatePath("/");
  }
}
