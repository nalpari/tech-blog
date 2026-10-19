"use server";

import { requireAdmin } from "@/lib/auth";
import { deletePostAndQueueImages, switchPostStatus } from "@/lib/post-mutations";

export async function togglePostStatus(postId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "권한이 없습니다." };
  return switchPostStatus(supabase, postId);
}

export async function deletePost(postId: string) {
  try {
    const supabase = await requireAdmin();
    if (!supabase) return { error: "권한이 없습니다." };
    return await deletePostAndQueueImages(supabase, postId);
  } catch {
    return { error: "삭제 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요." };
  }
}
