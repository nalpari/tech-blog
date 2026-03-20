"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const ADMIN_EMAIL = "yoo32767@gmail.com";

function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "로그인이 필요합니다." };
    }

    if (user.email !== ADMIN_EMAIL) {
      return { error: "포스트 수정 권한이 없습니다." };
    }

    const postId = formData.get("postId") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const slug = formData.get("slug") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const status = formData.get("status") as string;
    const featured = formData.get("featured") === "on";
    const tagIds = formData.getAll("tags") as string[];

    const fieldErrors: Record<string, string> = {};
    if (!title?.trim()) fieldErrors.title = "제목을 입력해주세요.";
    if (!content?.trim()) fieldErrors.content = "내용을 입력해주세요.";

    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors };
    }

    const readTime = estimateReadTime(content);

    // Check slug uniqueness (exclude current post)
    if (slug?.trim()) {
      const { data: existing, error: slugCheckError } = await supabase
        .from("posts")
        .select("id")
        .eq("slug", slug.trim())
        .neq("id", postId)
        .single();

      if (slugCheckError && slugCheckError.code !== "PGRST116") {
        return { error: "슬러그 중복 확인에 실패했습니다." };
      }

      if (existing) {
        return { fieldErrors: { slug: "이미 사용 중인 슬러그입니다." } };
      }
    }

    // Get current post to check publish state transition
    const { data: currentPost, error: fetchError } = await supabase
      .from("posts")
      .select("status, published_at, slug")
      .eq("id", postId)
      .single();

    if (fetchError || !currentPost) {
      return { error: "수정할 포스트를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요." };
    }

    const isNewlyPublished =
      status === "published" && currentPost.status !== "published";

    const finalSlug = slug?.trim() || currentPost.slug;

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        slug: finalSlug,
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        cover_image: coverImageUrl || null,
        status: status === "published" ? "published" : "draft",
        featured,
        read_time: readTime,
        published_at: isNewlyPublished
          ? new Date().toISOString()
          : currentPost.published_at,
      })
      .eq("id", postId);

    if (updateError) {
      return { error: `포스트 수정에 실패했습니다: ${updateError.message}` };
    }

    // Update tags: delete existing, insert new
    const { error: deleteTagError } = await supabase.from("post_tags").delete().eq("post_id", postId);

    if (deleteTagError) {
      return { error: "기존 태그 삭제에 실패했습니다. 다시 시도해주세요." };
    }

    if (tagIds.length > 0) {
      const postTags = tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("post_tags")
        .insert(postTags);

      if (tagError) {
        return { error: "태그 저장에 실패했습니다." };
      }
    }

    const finalStatus = status === "published" ? "published" : "draft";
    if (finalStatus === "published") {
      redirect(`/posts/${encodeURIComponent(finalSlug!)}`);
    } else {
      redirect("/admin/posts");
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "포스트 수정 중 예기치 않은 오류가 발생했습니다." };
  }
}
