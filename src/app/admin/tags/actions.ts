"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { requireAdmin } from "@/lib/auth";
import { invalidatePosts } from "@/lib/post-mutations";

// 포스트 상세 캐시는 태그 slug를 embed한 채 저장돼 있다. 태그 slug가 바뀌거나
// 태그가 사라지면 그 태그를 단 포스트의 캐시도 함께 버려야 죽은 /tags/<slug>
// 링크가 남지 않는다.
//
// 조회와 무효화를 나눠 둔 이유: 삭제는 post_tags가 cascade되기 전에 slug를
// 읽어야 하지만, 무효화 호출은 DB 쓰기가 끝난 뒤여야 한다. revalidate는 호출
// 시점 타임스탬프를 찍고 "그 시점까지 생성된 것"만 무효화하므로, 쓰기 전에
// 부르면 그 사이에 다시 캐싱된 옛 값이 그대로 살아남는다.
async function getPostSlugsOfTag(
  supabase: SupabaseClient<Database>,
  tagId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("post_tags")
    .select("posts(slug)")
    .eq("tag_id", tagId);

  // 여기서 실패하면 무효화가 0건이 되고 액션은 성공으로 보고된다.
  // 영향이 캐시 TTL(60초)로 제한되므로 던지지는 않되, 흔적은 남긴다.
  if (error) {
    console.error("[invalidatePostsOfTag] 대상 포스트 조회 실패:", tagId, error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => (row.posts as { slug: string } | null)?.slug)
    .filter((s): s is string => !!s);
}

export async function createTag(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "권한이 없습니다." };

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
  const supabase = await requireAdmin();
  if (!supabase) return { error: "권한이 없습니다." };

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

  invalidatePosts(await getPostSlugsOfTag(supabase, id));
  revalidatePath("/admin/tags");
  return { error: null };
}

export async function deleteTag(id: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "권한이 없습니다." };

  // slug는 cascade 전에 읽고, 무효화는 DELETE가 끝난 뒤에 한다.
  const slugs = await getPostSlugsOfTag(supabase, id);

  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  invalidatePosts(slugs);
  revalidatePath("/admin/tags");
  return { error: null };
}
