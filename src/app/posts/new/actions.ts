"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const customSlug = formData.get("slug") as string;
  const status = formData.get("status") as string;
  const featured = formData.get("featured") === "on";
  const tagIds = formData.getAll("tags") as string[];

  // Validation
  const fieldErrors: Record<string, string> = {};
  if (!title?.trim()) fieldErrors.title = "제목을 입력해주세요.";
  if (!content?.trim()) fieldErrors.content = "내용을 입력해주세요.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const slug = customSlug?.trim() || generateSlug(title);
  const readTime = estimateReadTime(content);

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { fieldErrors: { slug: "이미 사용 중인 슬러그입니다." } };
  }

  // Insert post
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      title: title.trim(),
      slug,
      content: content.trim(),
      excerpt: excerpt?.trim() || null,
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

  // Insert post_tags
  if (tagIds.length > 0) {
    const postTags = tagIds.map((tagId) => ({
      post_id: post.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("post_tags")
      .insert(postTags);

    if (tagError) {
      return { error: `태그 저장에 실패했습니다: ${tagError.message}` };
    }
  }

  if (status === "published") {
    redirect(`/posts/${slug}`);
  }

  redirect("/");
}
