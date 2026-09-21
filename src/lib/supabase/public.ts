import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// unstable_cache 콜백 안에서는 cookies()에 접근할 수 없다.
// 캐시되는 published 조회 전용으로 세션 없는 anon 클라이언트를 쓴다.
// RLS posts_select가 status = 'published'를 anon에게 허용하므로 안전하다.
export const publicClient = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
