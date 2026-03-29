import { createClient } from "@/lib/supabase/client";

const BUCKET = "post-images";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadImage(file: File, pathPrefix = ""): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (jpg, png, gif, webp)");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기는 10MB 이하여야 합니다.");
  }

  const supabase = createClient();

  const ext = file.name.split(".").pop() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${pathPrefix}${timestamp}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`업로드 실패: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
  };
}
