"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const ADMIN_EMAIL = "yoo32767@gmail.com";

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return { error: "삭제 권한이 없습니다." };
    }

    // 본문에서 Supabase Storage 이미지 URL 추출 후 삭제
    const { data: post } = await supabase
      .from("posts")
      .select("content")
      .eq("id", postId)
      .single();

    if (post?.content) {
      const STORAGE_HOST = "stcwgfbjyvlyshdvojgn.supabase.co";
      const imgRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
      const paths: string[] = [];

      let match;
      while ((match = imgRegex.exec(post.content)) !== null) {
        const url = match[1];
        if (url.includes(STORAGE_HOST) && url.includes("/post-images/")) {
          const path = url.split("/post-images/").pop();
          if (path) paths.push(path);
        }
      }

      if (paths.length > 0) {
        await supabase.storage.from("post-images").remove(paths);
      }
    }

    // post_tags are cascaded on delete
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      return { error: `삭제 실패: ${deleteError.message}` };
    }

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "삭제 중 오류가 발생했습니다." };
  }
}
