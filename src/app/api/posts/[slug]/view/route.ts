import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIEW_COOKIE_MAX_AGE = 86400; // 24시간

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  // 쿠키 기반 중복 조회 방지 (24시간)
  const cookieStore = await cookies();
  const viewedKey = `viewed-${slug}`;

  if (cookieStore.get(viewedKey)) {
    return NextResponse.json({ viewCount: null, deduplicated: true });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("increment_post_view_count", {
    post_slug: slug,
  });

  if (error) {
    console.error("[POST /api/posts/[slug]/view] Supabase RPC failed:", {
      slug,
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 },
    );
  }

  if (data == null || typeof data !== "number") {
    console.error("[POST /api/posts/[slug]/view] Unexpected RPC result:", {
      slug,
      data,
    });
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const response = NextResponse.json({ viewCount: data });
  response.cookies.set(viewedKey, "1", {
    maxAge: VIEW_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
