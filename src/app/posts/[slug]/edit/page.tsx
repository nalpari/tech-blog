import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/post-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `edit: ${slug}` };
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch post with tags
  const { data: post } = await supabase
    .from("posts")
    .select("*, post_tags(tag_id)")
    .eq("slug", slug)
    .single();

  if (!post) notFound();

  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");

  const existingTagIds = (post.post_tags as { tag_id: string }[]).map(
    (pt) => pt.tag_id,
  );

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[740px] px-10 py-12">
        <h1 className="text-2xl font-bold tracking-[-0.02em] mb-2">
          edit post
        </h1>
        <p className="text-sm text-muted mb-10">
          editing <span className="font-mono">{slug}</span>
        </p>

        <PostEditor
          tags={tags ?? []}
          editMode={{
            postId: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content ?? "",
            excerpt: post.excerpt ?? "",
            coverImage: post.cover_image ?? "",
            featured: post.featured,
            status: post.status,
            tagIds: existingTagIds,
          }}
        />
      </div>
    </div>
  );
}
