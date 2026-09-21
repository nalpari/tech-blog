import type { Database } from "@/lib/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  date: string;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  coverImage: string | null;
  coverGradient: string | null;
  authorId: string;
  viewCount: number;
  likeCount: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
}

// 목록/카드는 본문이 필요 없다. 목록 쿼리가 content를 실어 나르지 않도록
// 요약 타입을 따로 둔다.
//
// `liked`가 Post가 아니라 여기에만 있는 이유: Post는 상세 조회 결과이고 그
// 값은 unstable_cache로 사용자 간에 공유된다. 사용자별 필드를 그 타입에 두면
// 언젠가 누가 채워 넣는 순간 한 사람의 좋아요 상태가 다른 사람에게 캐시로
// 배달된다. 구조적으로 불가능하게 만들어 둔다.
// 상세 페이지의 좋아요 상태는 getLikedPostIds로 따로 조회한다.
export type PostSummary = Omit<Post, "content"> & { liked: boolean };

type PostSummaryRow = Pick<
  PostRow,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "published_at"
  | "created_at"
  | "read_time"
  | "featured"
  | "cover_image"
  | "cover_gradient"
  | "author_id"
  | "view_count"
  | "like_count"
>;

function mapPostBase(
  row: PostSummaryRow,
  tagSlugs: string[],
): Omit<Post, "content"> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.published_at ?? row.created_at,
    readTime: row.read_time,
    tags: tagSlugs,
    featured: row.featured,
    coverImage: row.cover_image,
    coverGradient: row.cover_gradient,
    authorId: row.author_id,
    viewCount: row.view_count,
    likeCount: row.like_count,
  };
}

// liked는 withLiked()가 채운다. 여기서는 "아직 모른다"의 기본값으로 false.
export function mapPostSummary(
  row: PostSummaryRow,
  tagSlugs: string[] = [],
): PostSummary {
  return { ...mapPostBase(row, tagSlugs), liked: false };
}

export function mapPost(
  row: PostRow,
  tagSlugs: string[] = [],
): Post {
  return { ...mapPostBase(row, tagSlugs), content: row.content };
}

export function mapTag(row: TagRow, postCount: number = 0): Tag {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    postCount,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
