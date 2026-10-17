import { NextRequest, NextResponse } from "next/server";
import { getPosts, POSTS_PER_PAGE } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const rawLimit = Number(searchParams.get("limit") ?? POSTS_PER_PAGE);
  if (!Number.isSafeInteger(rawOffset) || rawOffset < 0 ||
      !Number.isSafeInteger(rawLimit) || rawLimit < 1) {
    return NextResponse.json({ error: "잘못된 페이지 요청입니다." }, { status: 400 });
  }
  const offset = rawOffset;
  const limit = Math.min(POSTS_PER_PAGE, rawLimit);

  try {
    const posts = await getPosts({ offset, limit: limit + 1 });
    const hasMore = posts.length > limit;
    return NextResponse.json({ posts: hasMore ? posts.slice(0, limit) : posts, hasMore });
  } catch (error) {
    console.error("[GET /api/posts] 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "글 목록을 불러오지 못했습니다. 다시 시도해주세요." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
