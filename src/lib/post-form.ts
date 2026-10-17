import { isValidPostSlug, POST_SLUG_ERROR } from "./slug";

export function readPostForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const content = text("content");
  const fields = {
    title: text("title"),
    content,
    excerpt: text("excerpt") || null,
    slug: text("slug"),
    cover_image: text("coverImageUrl") || null,
    status: text("status") === "published" ? "published" : "draft",
    featured: formData.get("featured") === "on",
    read_time: `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`,
    tagIds: [...new Set(formData.getAll("tags").filter((tag): tag is string => typeof tag === "string"))],
  };
  const fieldErrors: Record<string, string> = {};
  if (!fields.title) fieldErrors.title = "제목을 입력해주세요.";
  if (!content) fieldErrors.content = "내용을 입력해주세요.";
  if (fields.slug && !isValidPostSlug(fields.slug)) fieldErrors.slug = POST_SLUG_ERROR;
  return { fields, fieldErrors };
}

export function postMutationError(error: { code: string; message: string } | null) {
  if (error?.code === "23505") {
    return { fieldErrors: { slug: "이미 사용 중인 슬러그입니다." } };
  }
  if (error?.code === "23503") {
    return { error: "선택한 태그가 변경되거나 삭제되었습니다. 새로고침 후 다시 선택해주세요. 글과 기존 태그는 변경되지 않았습니다." };
  }
  return { error: "글과 태그를 저장하지 못했습니다. 입력 내용을 유지한 채 다시 시도해주세요." };
}
