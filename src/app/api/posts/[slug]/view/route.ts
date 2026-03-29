import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = await createClient();

  // 로그인 사용자면 user_id 전달, 아니면 null
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("increment_post_view_count", {
    post_slug: slug,
    viewer_id: user?.id ?? null,
  });

  if (error) {
    console.error("[POST /api/posts/[slug]/view] RPC failed:", {
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
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ viewCount: data });
}
