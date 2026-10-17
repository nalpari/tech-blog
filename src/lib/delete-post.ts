import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";
import { processPostImageCleanup } from "@/lib/post-image-cleanup";

// 두 Server Action이 같은 원자 삭제·정리 경로를 사용한다.
export async function deletePostAndQueueImages(supabase: SupabaseClient<Database>, postId: string) {
  const { data: post, error } = await supabase.rpc("delete_post_with_cleanup", { target_post_id: postId });
  if (error || !post) return { error: "포스트를 삭제하지 못했습니다. 새로고침 후 다시 시도해주세요." };

  updateTag(POST_CACHE_TAG(post.slug));
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin/posts");
  revalidatePath("/");
  try {
    await processPostImageCleanup(supabase);
  } catch (error) {
    // 글 삭제는 이미 성공했다. 재시도해도 글 삭제를 반복하지 않도록 성공을 반환한다.
    console.error("[deletePost] 이미지 정리 대기:", error);
  }
  revalidatePath("/admin/image-cleanup");
  return { success: true };
}
