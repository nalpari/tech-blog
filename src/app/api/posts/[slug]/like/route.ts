import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LIKE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const likedKey = `liked-${slug}`;
  const isCurrentlyLiked = !!cookieStore.get(likedKey);
  const shouldLike = !isCurrentlyLiked;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_post_like", {
    post_slug: slug,
    should_like: shouldLike,
  });

  if (error) {
    console.error("[POST /api/posts/[slug]/like] Supabase RPC failed:", {
      slug,
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 },
    );
  }

  if (data == null || typeof data !== "number") {
    console.error("[POST /api/posts/[slug]/like] Unexpected RPC result:", {
      slug,
      data,
    });
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const response = NextResponse.json({ likeCount: data, liked: shouldLike });

  if (shouldLike) {
    response.cookies.set(likedKey, "1", {
      maxAge: LIKE_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
    });
  } else {
    response.cookies.delete(likedKey);
  }

  return response;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const liked = !!cookieStore.get(`liked-${slug}`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("like_count")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[GET /api/posts/[slug]/like] Supabase query failed:", {
      slug,
      code: error.code,
      message: error.message,
    });
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? "Post not found" : "Failed to fetch like count" },
      { status },
    );
  }

  return NextResponse.json({
    likeCount: data.like_count,
    liked,
  });
}
