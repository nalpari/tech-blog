"use server";

import { requireAdmin } from "@/lib/auth";
import { savePost, type PostFormState } from "@/lib/post-mutations";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type CreatePostState = PostFormState;

export async function createPost(
  _prev: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  try {
    const supabase = await requireAdmin();
    if (!supabase) return { error: "포스트 작성 권한이 없습니다." };

    const { saved, ...state } = await savePost(supabase, null, formData);
    if (!saved) return state;
    redirect(saved.published ? `/posts/${saved.slug}` : "/admin/posts");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "포스트 저장 중 오류가 발생했습니다. 입력 내용을 유지한 채 다시 시도해주세요." };
  }
}
