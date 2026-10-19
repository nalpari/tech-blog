import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";
import { generateSlug, isValidPostSlug, POST_SLUG_ERROR } from "@/lib/slug";
import { readPostForm, postMutationError } from "@/lib/post-form";
import { processPostImageCleanup } from "@/lib/post-image-cleanup";

// 글을 바꾸는 모든 Server Action이 이 module을 거친다. 관리자 gate는 호출부가
// requireAdmin()으로 통과한 client를 넘기는 것으로 끝나고, 쓰기·캐시 무효화 규칙은 여기에만 있다.
type Client = SupabaseClient<Database>;

export type PostFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// 쓰기가 성공한 직후에만 부른다. revalidate는 호출 시점까지 생성된 항목만 버리므로
// 쓰기 전에 부르면 그 사이 다시 캐싱된 옛 값이 살아남는다.
export function invalidatePosts(slugs: string[]) {
  for (const slug of new Set(slugs)) {
    updateTag(POST_CACHE_TAG(slug));
    revalidatePath(`/posts/${slug}`);
  }
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

// postId가 null이면 새 글. 성공하면 saved에 이동할 slug와 발행 여부가 담긴다.
export async function savePost(
  supabase: Client,
  postId: string | null,
  formData: FormData,
): Promise<PostFormState & { saved?: { slug: string; published: boolean } }> {
  const { fields, fieldErrors } = readPostForm(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  let currentSlug: string | null = null;
  if (postId) {
    const { data, error } = await supabase.from("posts").select("slug").eq("id", postId).single();
    if (error || !data) {
      return { error: "수정할 포스트를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요." };
    }
    currentSlug = data.slug;
  }
  const slug = fields.slug || currentSlug || generateSlug(fields.title);
  if (!isValidPostSlug(slug)) return { fieldErrors: { slug: POST_SLUG_ERROR } };

  // posts와 post_tags는 하나의 DB 트랜잭션이다. 실패 시 기존 본문·태그가 모두 보존된다.
  const { data: result, error } = await supabase.rpc("save_post_with_tags", {
    target_post_id: postId,
    post_data: { ...fields, slug },
    tag_ids: fields.tagIds,
  });
  if (error || !result) return postMutationError(error);

  // RPC 성공 응답은 COMMIT 뒤에 온다. DB가 잠근 행에서 읽은 이전 slug도 무효화한다.
  invalidatePosts([slug, currentSlug, result.previous_slug].filter((s): s is string => !!s));
  return { saved: { slug, published: fields.status === "published" } };
}

// 발행 시각 규칙은 toggle_post_status RPC(SQL)에만 있다.
export async function switchPostStatus(supabase: Client, postId: string) {
  const { data: post, error } = await supabase.rpc("toggle_post_status", { target_post_id: postId });
  if (error || !post) return { error: "상태를 변경하지 못했습니다. 새로고침 후 다시 시도해주세요." };

  invalidatePosts([post.slug]);
  return { status: post.status };
}

export async function deletePostAndQueueImages(supabase: Client, postId: string) {
  const { data: post, error } = await supabase.rpc("delete_post_with_cleanup", { target_post_id: postId });
  if (error || !post) return { error: "포스트를 삭제하지 못했습니다. 새로고침 후 다시 시도해주세요." };

  invalidatePosts([post.slug]);
  try {
    await processPostImageCleanup(supabase);
  } catch (error) {
    // 글 삭제는 이미 성공했다. 재시도해도 글 삭제를 반복하지 않도록 성공을 반환한다.
    console.error("[deletePost] 이미지 정리 대기:", error);
  }
  revalidatePath("/admin/image-cleanup");
  return { success: true };
}
