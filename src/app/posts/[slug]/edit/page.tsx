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
      <div className="mx-auto max-w-[740px] px-10 py-12 animate-fade-in-up">
        <h1 className="text-xl font-mono font-bold mb-1">
          <span className="text-accent">&gt;</span> edit_post
        </h1>
        <p className="text-sm font-sans text-muted mb-10">
          {`// editing: ${slug}`}
        </p>

        <PostEditor
          tags={tags ?? []}
          editMode={{
            postId: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content ?? "",
            excerpt: post.excerpt ?? "",
            featured: post.featured,
            status: post.status,
            tagIds: existingTagIds,
          }}
        />
      </div>
    </div>
  );
}
