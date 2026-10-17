import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { postImagePaths } from "@/lib/post-images";

// 큐는 DB 삭제 트랜잭션에서 생성된다. 이 함수는 커밋 이후에만 실행한다.
export async function processPostImageCleanup(supabase: SupabaseClient<Database>) {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!storageUrl) throw new Error("Storage 주소가 설정되지 않았습니다.");
  const { data: jobs, error } = await supabase.from("post_image_cleanup_jobs")
    .select("*").order("attempts").order("created_at").limit(20);
  if (error) throw new Error("이미지 정리 대기 목록을 읽지 못했습니다.");
  if (!jobs?.length) return;

  // 실패를 빈 참조 목록으로 대체하면 공유 이미지를 지우므로 반드시 중단한다.
  const { data: references, error: referenceError } = await supabase.rpc("get_post_image_references");
  if (referenceError || !Array.isArray(references)) throw new Error("공유 이미지 참조를 확인하지 못했습니다.");
  const referencedPaths = new Set<string>();
  for (const reference of references) {
    if (!reference || typeof reference !== "object" || Array.isArray(reference) ||
        !("content" in reference) || !("cover_image" in reference) ||
        (reference.content !== null && typeof reference.content !== "string") ||
        (reference.cover_image !== null && typeof reference.cover_image !== "string")) {
      throw new Error("공유 이미지 참조 응답이 올바르지 않습니다.");
    }
    for (const path of postImagePaths(
      `${reference.content ?? ""}\n${reference.cover_image ?? ""}`, storageUrl,
    )) referencedPaths.add(path);
  }

  for (const job of jobs) {
    let message: string | null = null;
    try {
      const paths = postImagePaths(`${job.content ?? ""}\n${job.cover_image ?? ""}`, storageUrl);
      const unused = paths.filter((path) => !referencedPaths.has(path));
      if (unused.length) {
        const { error: storageError } = await supabase.storage.from("post-images").remove(unused);
        if (storageError) throw new Error("Storage 삭제에 실패했습니다. 다시 시도해주세요.");
      }
      if (paths.some((path) => referencedPaths.has(path))) {
        message = "다른 글에서 사용 중인 이미지를 보존했습니다. 마지막 참조 삭제 후 재시도해주세요.";
      } else {
        const { error: deleteError } = await supabase.from("post_image_cleanup_jobs").delete().eq("id", job.id);
        if (deleteError) throw new Error("정리 완료 기록을 저장하지 못했습니다. 다시 시도해주세요.");
        continue;
      }
    } catch (error) {
      message = error instanceof Error ? error.message : "이미지 정리에 실패했습니다.";
    }
    const { error: recordError } = await supabase.from("post_image_cleanup_jobs")
      .update({ attempts: job.attempts + 1, last_error: message }).eq("id", job.id);
    if (recordError) throw new Error("이미지 정리 상태를 저장하지 못했습니다. 대기 작업은 유지됩니다.");
  }
}
