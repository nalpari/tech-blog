import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createClient();

  // 원자적 증가를 위해 RPC 함수 호출
  const { data, error } = await supabase.rpc("increment_post_view_count", {
    post_slug: slug,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 },
    );
  }

  return NextResponse.json({ viewCount: data });
}
