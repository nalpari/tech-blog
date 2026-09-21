import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

// unstable_cache 콜백 안에서는 cookies()에 접근할 수 없다.
// 캐시되는 published 조회 전용으로 세션 없는 anon 클라이언트를 쓴다.
// RLS posts_select가 status = 'published'를 anon에게 허용하므로 안전하다.
//
// 모듈 로드 시점이 아니라 첫 호출에 생성한다. 최상위에서 만들면 env가 없는
// CI/프리뷰에서 이 모듈을 import하는 것만으로 빌드가 죽는다.
export function getPublicClient(): SupabaseClient<Database> {
  if (!client) {
    client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
