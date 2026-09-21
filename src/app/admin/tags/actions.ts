"use server";

import { createClient } from "@/lib/supabase/server";
// 이 파일도 updateTag라는 Server Action을 export하므로 별칭으로 가져온다.
import { revalidatePath, updateTag as updateCacheTag } from "next/cache";
import { POST_CACHE_TAG } from "@/lib/queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const ADMIN_EMAIL = "yoo32767@gmail.com";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: "권한이 없습니다.", supabase: null };
  }
  return { error: null, supabase };
}

// 포스트 상세 캐시는 태그 slug를 embed한 채 저장돼 있다. 태그 slug가 바뀌거나
// 태그가 사라지면 그 태그를 단 포스트의 캐시도 함께 버려야 죽은 /tags/<slug>
// 링크가 남지 않는다. 삭제의 경우 cascade 전에 호출해야 한다.
async function invalidatePostsOfTag(
  supabase: SupabaseClient<Database>,
  tagId: string,
) {
  const { data } = await supabase
    .from("post_tags")
    .select("posts(slug)")
    .eq("tag_id", tagId);

  for (const row of data ?? []) {
    const slug = (row.posts as { slug: string } | null)?.slug;
    if (slug) updateCacheTag(POST_CACHE_TAG(slug));
  }
}

export async function createTag(formData: FormData) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error };

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name) return { error: "태그 이름을 입력해주세요." };
  if (!slug) return { error: "슬러그를 입력해주세요." };

  const { error: insertError } = await supabase
    .from("tags")
    .insert({ name, slug, description: description || null });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "이미 존재하는 슬러그입니다." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/admin/tags");
  return { error: null };
}

export async function updateTag(formData: FormData) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name) return { error: "태그 이름을 입력해주세요." };

  const { error: updateError } = await supabase
    .from("tags")
    .update({
      name,
      slug: slug || undefined,
      description: description || null,
    })
    .eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { error: "이미 존재하는 슬러그입니다." };
    }
    return { error: updateError.message };
  }

  await invalidatePostsOfTag(supabase, id);
  revalidatePath("/admin/tags");
  revalidatePath("/");
  return { error: null };
}

export async function deleteTag(id: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error };

  // post_tags가 cascade로 지워지기 전에 대상 포스트를 확보해 무효화한다.
  await invalidatePostsOfTag(supabase, id);

  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/tags");
  revalidatePath("/");
  return { error: null };
}
