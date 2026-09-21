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
  // 현재 로그인 사용자가 좋아요를 눌렀는지. 목록 쿼리가 서버에서 채워 넣으며,
  // 비로그인이거나 아직 조회하지 않았으면 false다.
  liked: boolean;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
}

// 목록/카드는 본문이 필요 없다. 목록 쿼리가 content를 실어 나르지 않도록
// 요약 타입을 따로 두고, 상세용 Post는 여기에 content만 얹는다.
export type PostSummary = Omit<Post, "content">;

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

export function mapPostSummary(
  row: PostSummaryRow,
  tagSlugs: string[] = [],
): PostSummary {
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
    liked: false,
  };
}

export function mapPost(
  row: PostRow,
  tagSlugs: string[] = [],
): Post {
  return { ...mapPostSummary(row, tagSlugs), content: row.content };
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
