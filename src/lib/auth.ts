import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "yoo32767@gmail.com";

// 한 요청 안에서 여러 번 호출돼도 Auth 왕복은 1회만 발생하도록 메모이제이션한다.
// ponytail: getUser()는 매번 Auth 서버로 왕복한다. 프로젝트가 아직 legacy HS256
// 시크릿이라(JWKS 비어 있음) getClaims()로 바꿔도 로컬 검증이 안 돼 이득이 없다.
// JWT signing key를 비대칭(ECC/RSA)으로 마이그레이션하면 이 함수만 getClaims()로 교체.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const isAdmin = cache(async () => {
  const user = await getCurrentUser();
  return user?.email === ADMIN_EMAIL;
});
