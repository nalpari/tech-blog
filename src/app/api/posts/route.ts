import { NextRequest, NextResponse } from "next/server";
import { getPosts, POSTS_PER_PAGE } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(POSTS_PER_PAGE, Math.max(1, Number(searchParams.get("limit")) || POSTS_PER_PAGE));

  const posts = await getPosts({ offset, limit: limit + 1 });
  const hasMore = posts.length > limit;

  return NextResponse.json({ posts: hasMore ? posts.slice(0, limit) : posts, hasMore });
}
