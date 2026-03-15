"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const ADMIN_EMAIL = "yoo32767@gmail.com";

function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "로그인이 필요합니다." };
    }

    if (user.email !== ADMIN_EMAIL) {
      return { error: "포스트 작성 권한이 없습니다." };
    }

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const customSlug = formData.get("slug") as string;
    const coverImage = formData.get("coverImage") as string;
    const status = formData.get("status") as string;
    const featured = formData.get("featured") === "on";
    const tagIds = formData.getAll("tags") as string[];

    const fieldErrors: Record<string, string> = {};
    if (!title?.trim()) fieldErrors.title = "제목을 입력해주세요.";
    if (!content?.trim()) fieldErrors.content = "내용을 입력해주세요.";

    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors };
    }

    const slug = customSlug?.trim() || generateSlug(title);
    const readTime = estimateReadTime(content);

    // Check slug uniqueness — distinguish "not found" from DB errors
    const { data: existing, error: slugCheckError } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (slugCheckError && slugCheckError.code !== "PGRST116") {
      return { error: "슬러그 중복 확인에 실패했습니다. 다시 시도해주세요." };
    }

    if (existing) {
      return { fieldErrors: { slug: "이미 사용 중인 슬러그입니다." } };
    }

    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        cover_image: coverImage?.trim() || null,
        status: status === "published" ? "published" : "draft",
        featured,
        read_time: readTime,
        author_id: user.id,
        published_at:
          status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (insertError || !post) {
      return { error: `포스트 저장에 실패했습니다: ${insertError?.message}` };
    }

    if (tagIds.length > 0) {
      const postTags = tagIds.map((tagId) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("post_tags")
        .insert(postTags);

      if (tagError) {
        // Clean up orphaned post
        await supabase.from("posts").delete().eq("id", post.id);
        return { error: "태그 저장에 실패했습니다. 다시 시도해주세요." };
      }
    }

    if (status === "published") {
      redirect(`/posts/${encodeURIComponent(slug)}`);
    }

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "포스트 저장 중 예기치 않은 오류가 발생했습니다." };
  }
}
