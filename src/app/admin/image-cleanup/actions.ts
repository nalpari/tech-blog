"use server";

import { requireAdmin } from "@/lib/auth";
import { processPostImageCleanup } from "@/lib/post-image-cleanup";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function retryImageCleanup() {
  const supabase = await requireAdmin();
  if (!supabase) redirect("/");
  let failed = false;
  try {
    await processPostImageCleanup(supabase);
  } catch (error) {
    console.error("[retryImageCleanup] 정리 실패:", error);
    failed = true;
  }
  revalidatePath("/admin/image-cleanup");
  redirect(`/admin/image-cleanup?result=${failed ? "failed" : "processed"}`);
}
