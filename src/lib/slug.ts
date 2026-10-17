export const MAX_POST_SLUG_LENGTH = 100;

// 생성·수정·상호작용 API가 같은 URL 계약을 사용한다.
export function isValidPostSlug(slug: string): boolean {
  return slug.length <= MAX_POST_SLUG_LENGTH && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export const POST_SLUG_ERROR = "슬러그는 100자 이하의 영문 소문자·숫자와 단어 사이 하이픈만 사용할 수 있습니다.";

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_POST_SLUG_LENGTH)
    .replace(/-+$/g, "");
}
