import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 토큰 갱신만 한다. getSession()은 만료 임박 시에만 Auth 서버로 refresh하고
  // 평소엔 쿠키만 읽어 매 요청 Auth 왕복을 없앤다. proxy는 권한 판단을 하지 않으므로
  // 사용자 검증은 페이지·액션의 getUser()(src/lib/auth.ts)가 맡는다.
  await supabase.auth.getSession();

  return supabaseResponse;
}
