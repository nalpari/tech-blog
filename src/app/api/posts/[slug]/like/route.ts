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

// GET: 좋아요 상태 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = await createClient();

  // 게시글 like_count 조회
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, like_count")
    .eq("slug", slug)
    .single();

  if (error || !post) {
    const status = error?.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { error: "Post not found" },
      { status },
    );
  }

  // 로그인 사용자의 좋아요 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = !!likeRow;
  }

  return NextResponse.json({
    likeCount: post.like_count,
    liked,
  });
}
