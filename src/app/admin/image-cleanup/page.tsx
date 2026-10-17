import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { retryImageCleanup } from "./actions";

export const metadata = { title: "이미지 정리 — techlog" };

export default async function ImageCleanupPage({ searchParams }: {
  searchParams: Promise<{ result?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.email !== ADMIN_EMAIL) redirect("/");
  const [{ result }, { data: jobs, count, error }] = await Promise.all([
    searchParams,
    supabase.from("post_image_cleanup_jobs")
      .select("id, attempts, last_error", { count: "exact" })
      .order("attempts").order("created_at").limit(20),
  ]);

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-[720px] px-6 py-12">
        <Link href="/admin/posts" className="text-sm text-accent hover:underline">글 관리로 돌아가기</Link>
        <h1 className="mt-6 text-2xl font-bold">삭제한 글의 이미지 정리</h1>
        <p className="mt-3 text-sm text-muted">
          글 삭제가 끝난 뒤 사용하지 않는 이미지를 정리합니다. 다른 글에서 사용하는 이미지는 보존하며,
          마지막 참조가 사라진 뒤 재시도하면 정리됩니다. 한 번에 최대 20건을 처리합니다.
        </p>
        {error ? (
          <p role="alert" className="mt-6 text-sm">대기 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.</p>
        ) : (
          <>
            <p className="mt-6 text-sm tabular-nums">대기 중인 글 {count ?? 0}건</p>
            {result === "failed" && <p role="alert" className="mt-3 text-sm">정리에 실패했습니다. 대기 작업은 유지됩니다. 다시 시도해주세요.</p>}
            {result === "processed" && <p role="status" className="mt-3 text-sm">이번 정리를 마쳤습니다. 남은 작업은 아래 상태를 확인해주세요.</p>}
            {!!jobs?.length && (
              <>
                <form action={retryImageCleanup} className="mt-5">
                  <button className="rounded border border-border-strong! px-4 py-2 text-sm hover:bg-surface cursor-pointer">이미지 정리 재시도</button>
                </form>
                <ul className="mt-6 space-y-3 text-sm text-muted">
                  {jobs.map((job) => <li key={job.id}>시도 {job.attempts}회 · {job.last_error ?? "정리 대기 중"}</li>)}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
