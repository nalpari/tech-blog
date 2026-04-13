import { createClient } from "@/lib/supabase/server";
import { mapPost, mapTag, type Post, type Tag } from "@/lib/data";

export const POSTS_PER_PAGE = 6;

// posts.sort_date는 Supabase의 generated column으로
// COALESCE(published_at, created_at) 결과를 담는다.
// - mapPost()의 `date: published_at ?? created_at`와 의미가 일치해야 함
// - Insert/Update에 값을 넣어도 DB가 거부한다 (GENERATED ALWAYS)
// 정의 동기화가 깨지면 "카드 표시일 != 정렬일" 불일치가 재발한다.
const POSTS_ORDER_COLUMN = "sort_date" as const;
const POSTS_ORDER_OPTIONS = { ascending: false } as const;
// 동일 sort_date 시 페이지네이션 중복/누락 방지를 위한 결정적 2차 키.
const POSTS_TIE_BREAKER_COLUMN = "id" as const;

export async function getPosts(options?: { offset?: number; limit?: number }): Promise<Post[]> {
  const supabase = await createClient();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? POSTS_PER_PAGE;

  const { data: posts } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("status", "published")
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS)
    .range(offset, offset + limit - 1);

  if (!posts) return [];

  return posts.map((post) => {
    const tagSlugs = (post.post_tags as { tag_id: string; tags: { slug: string } | null }[])
      .map((pt) => pt.tags?.slug)
      .filter((s): s is string => !!s);
    return mapPost(post, tagSlugs);
  });
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("status", "published")
    .eq("featured", true)
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS);

  if (!posts) return [];

  return posts.map((post) => {
    const tagSlugs = (post.post_tags as { tag_id: string; tags: { slug: string } | null }[])
      .map((pt) => pt.tags?.slug)
      .filter((s): s is string => !!s);
    return mapPost(post, tagSlugs);
  });
}

export async function getPostBySlug(
  slug: string,
  options?: { includeDraft?: boolean },
): Promise<(Post & { status?: string }) | null> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("slug", slug);

  if (!options?.includeDraft) {
    query = query.eq("status", "published");
  }

  const { data: post } = await query.single();

  if (!post) return null;

  const tagSlugs = (post.post_tags as { tag_id: string; tags: { slug: string } | null }[])
    .map((pt) => pt.tags?.slug)
    .filter((s): s is string => !!s);

  return { ...mapPost(post, tagSlugs), status: post.status };
}

export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const supabase = await createClient();

  // 해당 태그의 post_id 목록 조회
  const { data: tagData } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", tagSlug)
    .single();

  if (!tagData) return [];

  const { data: postTagRows } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tagData.id);

  if (!postTagRows || postTagRows.length === 0) return [];

  const postIds = postTagRows.map((pt) => pt.post_id);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("status", "published")
    .in("id", postIds)
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS);

  if (!posts) return [];

  return posts.map((post) => {
    const tagSlugs = (post.post_tags as { tag_id: string; tags: { slug: string } | null }[])
      .map((pt) => pt.tags?.slug)
      .filter((s): s is string => !!s);
    return mapPost(post, tagSlugs);
  });
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (!tags) return [];

  // 태그별 발행 포스트 수 집계
  const { data: counts } = await supabase
    .from("post_tags")
    .select("tag_id, posts!inner(status)")
    .eq("posts.status", "published");

  const countMap = new Map<string, number>();
  if (counts) {
    for (const row of counts) {
      countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1);
    }
  }

  return tags.map((tag) => mapTag(tag, countMap.get(tag.id) ?? 0));
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tag) return null;

  // 해당 태그의 발행 포스트 수
  const { count } = await supabase
    .from("post_tags")
    .select("*, posts!inner(status)", { count: "exact", head: true })
    .eq("tag_id", tag.id)
    .eq("posts.status", "published");

  return mapTag(tag, count ?? 0);
}
