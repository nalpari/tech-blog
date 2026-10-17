"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { processPostImageCleanup } from "@/lib/post-image-cleanup";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function retryImageCleanup() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.email !== ADMIN_EMAIL) redirect("/");
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
