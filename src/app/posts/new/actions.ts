"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { generateSlug, isValidPostSlug, POST_SLUG_ERROR } from "@/lib/slug";
import { readPostForm, postMutationError } from "@/lib/post-form";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type CreatePostState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createPost(
  _prev: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "로그인이 필요합니다." };
    if (user.email !== ADMIN_EMAIL) return { error: "포스트 작성 권한이 없습니다." };

    const { fields, fieldErrors } = readPostForm(formData);
    const slug = fields.slug || generateSlug(fields.title);
    if (!isValidPostSlug(slug)) fieldErrors.slug = POST_SLUG_ERROR;
    if (Object.keys(fieldErrors).length) return { fieldErrors };

    const { data: post, error } = await supabase.rpc("save_post_with_tags", {
      target_post_id: null,
      post_data: { ...fields, slug },
      tag_ids: fields.tagIds,
    });
    if (error || !post) return postMutationError(error);

    updateTag(POST_CACHE_TAG(slug));
    revalidatePath("/admin/posts");
    revalidatePath("/");
    redirect(fields.status === "published" ? `/posts/${slug}` : "/admin/posts");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "포스트 저장 중 오류가 발생했습니다. 입력 내용을 유지한 채 다시 시도해주세요." };
  }
}
