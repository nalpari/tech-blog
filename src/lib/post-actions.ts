"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { isValidPostSlug, POST_SLUG_ERROR } from "@/lib/slug";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { readPostForm, postMutationError } from "@/lib/post-form";

export type UpdatePostState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updatePost(
  _prev: UpdatePostState,
  formData: FormData,
): Promise<UpdatePostState> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "로그인이 필요합니다." };
    if (user.email !== ADMIN_EMAIL) return { error: "포스트 수정 권한이 없습니다." };

    const { fields, fieldErrors } = readPostForm(formData);
    if (Object.keys(fieldErrors).length) return { fieldErrors };
    const postId = String(formData.get("postId") ?? "");
    const { data: currentPost, error: fetchError } = await supabase
      .from("posts").select("slug").eq("id", postId).single();
    if (fetchError || !currentPost) {
      return { error: "수정할 포스트를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요." };
    }
    const slug = fields.slug || currentPost.slug;
    if (!isValidPostSlug(slug)) return { fieldErrors: { slug: POST_SLUG_ERROR } };

    // posts와 post_tags는 하나의 DB 트랜잭션이다. 실패 시 기존 본문·태그가 모두 보존된다.
    const { data: result, error } = await supabase.rpc("save_post_with_tags", {
      target_post_id: postId,
      post_data: { ...fields, slug },
      tag_ids: fields.tagIds,
    });
    if (error || !result) return postMutationError(error);

    // RPC 성공 응답은 COMMIT 뒤에 온다. DB가 잠근 행에서 읽은 이전 slug도 무효화한다.
    updateTag(POST_CACHE_TAG(result.previous_slug ?? currentPost.slug));
    updateTag(POST_CACHE_TAG(slug));
    revalidatePath(`/posts/${currentPost.slug}`);
    revalidatePath(`/posts/${slug}`);
    revalidatePath("/admin/posts");
    revalidatePath("/");
    redirect(fields.status === "published" ? `/posts/${slug}` : "/admin/posts");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "포스트 수정 중 오류가 발생했습니다. 입력 내용을 유지한 채 다시 시도해주세요." };
  }
}
