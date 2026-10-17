// 커버·Markdown·HTML 이미지에서 같은 Storage 객체를 경로 단위로 비교한다.
// 호스트와 버킷을 모두 확인하므로 외부 URL이나 쿼리 문자열을 삭제 경로로 쓰지 않는다.
export function postImagePaths(text: string | null, supabaseUrl: string): string[] {
  const origin = new URL(supabaseUrl).origin;
  const paths = new Set<string>();
  for (const match of (text ?? "").matchAll(/https?:\/\/[^\s<>"')]+/g)) {
    try {
      const url = new URL(match[0].replace(/&amp;/g, "&"));
      if (url.origin !== origin) continue;
      const pathMatch = url.pathname.match(/^\/storage\/v1\/(?:object\/(?:public|sign)|render\/image\/public)\/post-images\/(.+)$/);
      if (!pathMatch) continue;
      const path = decodeURIComponent(pathMatch[1]);
      if (path.split("/").some((part) => !part || part === "." || part === "..") || path.includes("\\")) continue;
      paths.add(path);
    } catch {
      // 잘못된 URL은 Storage API에 보내지 않는다.
    }
  }
  return [...paths];
}
