"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { deletePostAndQueueImages } from "@/lib/delete-post";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.email !== ADMIN_EMAIL) {
      return { error: "삭제 권한이 없습니다." };
    }
    const result = await deletePostAndQueueImages(supabase, postId);
    if (result.error) return result;
    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "삭제 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요." };
  }
}
