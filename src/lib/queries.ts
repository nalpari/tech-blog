import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database.types";
import {
  mapPost,
  mapPostSummary,
  mapTag,
  type Post,
  type PostSummary,
  type Tag,
} from "@/lib/data";

export const POSTS_PER_PAGE = 6;

// posts.sort_date는 Supabase의 generated column으로
// COALESCE(published_at, created_at) 결과를 담는다.
// - mapPost()의 `date: published_at ?? created_at`와 의미가 일치해야 함
// - Insert/Update에 값을 넣어도 DB가 거부한다 (GENERATED ALWAYS)
// 정의 동기화가 깨지면 "카드 표시일 != 정렬일" 불일치가 재발한다.
const POSTS_ORDER_COLUMN = "sort_date" as const;
const POSTS_ORDER_OPTIONS = { ascending: false } as const;
// 동일 sort_date(일괄 발행 등) 시 작성일 역순으로 보조 정렬.
const POSTS_SECONDARY_ORDER_COLUMN = "created_at" as const;
// created_at까지 같을 때 페이지네이션 중복/누락 방지를 위한 결정적 최종 키.
const POSTS_TIE_BREAKER_COLUMN = "id" as const;

// 목록/카드는 content를 쓰지 않는다. select("*")로 본문까지 실어 나르지 않도록
// 요약 컬럼만 명시한다 (sort_date는 .order()에만 쓰이므로 select 불필요).
const POST_SUMMARY_SELECT =
  "id, slug, title, excerpt, published_at, created_at, read_time, featured, cover_image, cover_gradient, author_id, view_count, like_count, post_tags(tag_id, tags(slug))";

function tagSlugsOf(row: { post_tags: unknown }): string[] {
  return (row.post_tags as { tag_id: string; tags: { slug: string } | null }[])
    .map((pt) => pt.tags?.slug)
    .filter((s): s is string => !!s);
}

// 로그인 사용자가 좋아요한 post_id 집합. 비로그인이면 쿼리 없이 빈 집합.
export async function getLikedPostIds(postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const user = await getCurrentUser();
  if (!user) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  return new Set(data?.map((row) => row.post_id) ?? []);
}

// 카드가 마운트될 때마다 좋아요 상태를 fetch하지 않도록 서버에서 미리 채운다.
async function withLiked(posts: PostSummary[]): Promise<PostSummary[]> {
  const likedIds = await getLikedPostIds(posts.map((p) => p.id));
  if (likedIds.size === 0) return posts;
  return posts.map((p) => ({ ...p, liked: likedIds.has(p.id) }));
}

export async function getPosts(options?: { offset?: number; limit?: number }): Promise<PostSummary[]> {
  const supabase = await createClient();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? POSTS_PER_PAGE;

  const { data: posts } = await supabase
    .from("posts")
    .select(POST_SUMMARY_SELECT)
    .eq("status", "published")
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_SECONDARY_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS)
    .range(offset, offset + limit - 1);

  if (!posts) return [];

  return withLiked(posts.map((post) => mapPostSummary(post, tagSlugsOf(post))));
}

export async function getFeaturedPosts(): Promise<PostSummary[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(POST_SUMMARY_SELECT)
    .eq("status", "published")
    .eq("featured", true)
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_SECONDARY_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS);

  if (!posts) return [];

  return withLiked(posts.map((post) => mapPostSummary(post, tagSlugsOf(post))));
}

export const POST_CACHE_TAG = (slug: string) => `post:${slug}`;

type PostDetail = (Post & { status?: string }) | null;
type PostRowWithTags = Database["public"]["Tables"]["posts"]["Row"] & {
  post_tags: unknown;
};

function toPostDetail(post: PostRowWithTags | null): PostDetail {
  if (!post) return null;
  return { ...mapPost(post, tagSlugsOf(post)), status: post.status };
}

// 발행된 포스트는 요청 간에도 재사용한다. 쿠키를 읽지 않는 anon 클라이언트를
// 써야 unstable_cache 안에서 동작한다. 무효화는 POST_CACHE_TAG로.
// view_count/like_count는 이 캐시를 타므로 최대 60초까지 stale할 수 있다.
async function fetchPublishedPost(slug: string): Promise<PostDetail> {
  const { data, error } = await getPublicClient()
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  // 쿼리 실패를 null로 반환하면 unstable_cache가 그 null을 캐싱해
  // 일시적 DB 장애가 60초짜리 404로 굳는다. 던져서 캐싱을 막는다.
  // (행이 없을 때는 maybeSingle이 error 없이 data=null을 주므로 구분된다.)
  if (error) {
    throw new Error(`[getPostBySlug] query failed for "${slug}": ${error.message}`);
  }

  return toPostDetail(data);
}

// cache()는 인자를 참조/개수로 비교하므로 includeDraft는 반드시 원시값으로,
// 호출부는 항상 인자 2개를 넘겨야 요청 단위 캐시가 적중한다.
export const getPostBySlug = cache(async function getPostBySlug(
  slug: string,
  includeDraft: boolean,
): Promise<PostDetail> {
  // draft는 권한에 따라 결과가 달라지므로 캐시를 태우지 않는다.
  if (!includeDraft) {
    return unstable_cache(fetchPublishedPost, ["post-by-slug", slug], {
      tags: [POST_CACHE_TAG(slug)],
      revalidate: 60,
    })(slug);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id, tags(slug))")
    .eq("slug", slug)
    .maybeSingle();

  return toPostDetail(data);
});

// 태그에 속한 post_id 목록. tags를 inner join으로 붙여 왕복 1회로 끝낸다.
async function getPostIdsByTag(tagSlug: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("post_tags")
    .select("post_id, tags!inner(slug)")
    .eq("tags.slug", tagSlug);

  return rows?.map((r) => r.post_id) ?? [];
}

export async function getPostsByTag(tagSlug: string): Promise<PostSummary[]> {
  const postIds = await getPostIdsByTag(tagSlug);
  if (postIds.length === 0) return [];

  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(POST_SUMMARY_SELECT)
    .eq("status", "published")
    .in("id", postIds)
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_SECONDARY_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS);

  if (!posts) return [];

  return withLiked(posts.map((post) => mapPostSummary(post, tagSlugsOf(post))));
}

// 관련 포스트는 상위 N개만 필요하다. 태그 전체를 가져와 JS에서 자르지 않고
// DB에서 정렬·제외·limit까지 끝낸다.
export async function getRelatedPosts(
  tagSlug: string,
  excludeSlug: string,
  limit = 3,
): Promise<PostSummary[]> {
  const postIds = await getPostIdsByTag(tagSlug);
  if (postIds.length === 0) return [];

  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(POST_SUMMARY_SELECT)
    .eq("status", "published")
    .in("id", postIds)
    .neq("slug", excludeSlug)
    .order(POSTS_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_SECONDARY_ORDER_COLUMN, POSTS_ORDER_OPTIONS)
    .order(POSTS_TIE_BREAKER_COLUMN, POSTS_ORDER_OPTIONS)
    .limit(limit);

  if (!posts) return [];

  return withLiked(posts.map((post) => mapPostSummary(post, tagSlugsOf(post))));
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
