"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "yoo32767@gmail.com";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: "권한이 없습니다.", supabase: null };
  }
  return { error: null, supabase };
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

  revalidatePath("/admin/tags");
  return { error: null };
}

export async function deleteTag(id: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error };

  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/tags");
  return { error: null };
}
