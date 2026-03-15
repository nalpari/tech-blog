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
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
}

export function mapPost(
  row: PostRow,
  tagSlugs: string[] = [],
): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    date: row.published_at ?? row.created_at,
    readTime: row.read_time,
    tags: tagSlugs,
    featured: row.featured,
    coverImage: row.cover_image,
    coverGradient: row.cover_gradient,
    authorId: row.author_id,
    viewCount: row.view_count,
  };
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
