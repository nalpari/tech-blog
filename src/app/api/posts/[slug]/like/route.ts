import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// POST: 좋아요 토글 (인증 필수)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data, error } = await supabase.rpc("toggle_post_like", {
    post_slug: slug,
    liker_id: user.id,
  });

  if (error) {
    console.error("[POST /api/posts/[slug]/like] RPC failed:", {
      slug,
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 },
    );
  }

  if (data == null) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
