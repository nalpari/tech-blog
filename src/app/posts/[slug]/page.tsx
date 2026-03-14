import Link from "next/link";
import { notFound } from "next/navigation";
import { posts, getPostBySlug, formatDate, getPostsByTag } from "@/lib/data";
import { TagBadge } from "@/components/tag-badge";
import { PostCard } from "@/components/post-card";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return params.then(({ slug }) => {
    const post = getPostBySlug(slug);
    if (!post) return { title: "Post Not Found" };
    return {
      title: post.title,
      description: post.excerpt,
    };
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getPostsByTag(post.tags[0])
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="pt-28 pb-20">
      {/* Back nav */}
      <div className="mx-auto max-w-[740px] px-6 mb-10 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to blog
        </Link>
      </div>

      {/* Article Header */}
      <header className="mx-auto max-w-[740px] px-6 mb-12 animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {post.tags.map((tag) => (
            <TagBadge key={tag} slug={tag} size="md" />
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight leading-[1.15] mb-6">
          {post.title}
        </h1>

        <p className="text-lg text-muted-foreground/80 leading-relaxed mb-8">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">JK</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Jae Kim
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="size-0.5 rounded-full bg-muted-foreground/30" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Gradient line */}
      <div className="mx-auto max-w-[740px] px-6 mb-12">
        <div className="h-px glow-line opacity-40" />
      </div>

      {/* Article Content */}
      <article className="mx-auto max-w-[740px] px-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="prose-blog">
          <p>
            The challenge of building a real-time collaborative editor is one of those problems that seems deceptively simple on the surface. Two people editing the same document — how hard could it be? As it turns out, incredibly hard. The moment you introduce concurrency, network latency, and the requirement for eventual consistency, you enter a world of fascinating algorithmic challenges.
          </p>

          <h2>The Problem Space</h2>

          <p>
            At its core, collaborative editing requires solving a fundamental distributed systems problem: how do you allow multiple users to modify the same data simultaneously while ensuring everyone eventually sees the same result? This is known as the <strong>convergence problem</strong>.
          </p>

          <p>
            Traditional approaches like locking (where only one user can edit at a time) don&apos;t work for modern real-time applications. Users expect to see changes as they happen, with no waiting and no conflicts. The solution lies in two competing approaches: <strong>Operational Transformation (OT)</strong> and <strong>Conflict-free Replicated Data Types (CRDTs)</strong>.
          </p>

          <h2>Why We Chose CRDTs Over OT</h2>

          <p>
            Operational Transformation has been the industry standard for years — it powers Google Docs, for instance. OT works by transforming operations against each other to resolve conflicts. While effective, it has several drawbacks:
          </p>

          <ul>
            <li>The transformation functions are notoriously difficult to implement correctly</li>
            <li>It requires a central server to order operations</li>
            <li>The complexity grows exponentially with the number of operation types</li>
            <li>Edge cases in transformation logic have caused bugs in production systems for decades</li>
          </ul>

          <p>
            CRDTs, on the other hand, are data structures that are <em>mathematically guaranteed</em> to converge. They don&apos;t need a central server and they don&apos;t require transformation logic. Each operation is self-contained and can be applied in any order.
          </p>

          <blockquote>
            &ldquo;CRDTs are to collaborative editing what functional programming is to concurrent programming — they eliminate entire categories of bugs by construction.&rdquo;
          </blockquote>

          <h2>The Architecture</h2>

          <p>
            Our editor is built on a layered architecture that separates the CRDT logic from the rendering layer. Here&apos;s a simplified overview:
          </p>

          <pre><code>{`// The core CRDT document structure
interface CRDTDocument {
  siteId: string;
  clock: VectorClock;
  nodes: Map<NodeId, CRDTNode>;

  insert(position: Position, content: string): Operation;
  delete(range: Range): Operation;
  apply(operation: Operation): void;
  merge(remote: CRDTDocument): void;
}

// Operations are broadcast to all peers
interface Operation {
  id: OperationId;
  siteId: string;
  timestamp: VectorClock;
  type: 'insert' | 'delete';
  position: Position;
  content?: string;
}`}</code></pre>

          <h2>Handling Network Partitions</h2>

          <p>
            One of the most interesting challenges we faced was handling network partitions gracefully. When a user goes offline, they should be able to continue editing. When they come back online, their changes need to be merged seamlessly with everyone else&apos;s changes.
          </p>

          <p>
            This is where the power of CRDTs really shines. Because each operation carries a vector clock, we can always determine the causal ordering of operations. Two operations that happened concurrently are both valid and can be applied in any order — the result is guaranteed to be the same.
          </p>

          <h3>The Sync Protocol</h3>

          <p>
            We implemented a lightweight sync protocol based on WebSocket connections with automatic reconnection and state reconciliation:
          </p>

          <pre><code>{`// Sync protocol pseudocode
async function syncWithPeer(peer: Peer) {
  // Exchange vector clocks to determine missing operations
  const remoteClock = await peer.getVectorClock();
  const missingOps = document.getOperationsSince(remoteClock);

  // Send our missing operations
  await peer.send(missingOps);

  // Receive and apply their missing operations
  const theirOps = await peer.getMissingSince(document.clock);
  for (const op of theirOps) {
    document.apply(op);
  }
}`}</code></pre>

          <h2>Performance Considerations</h2>

          <p>
            The naive CRDT implementation works well for small documents, but it struggles with large ones. Each character in the document is represented as a node in the CRDT, which means a 100,000-character document has 100,000 nodes. We addressed this through several optimizations:
          </p>

          <ul>
            <li><strong>Run-length encoding</strong>: Consecutive characters inserted by the same user are grouped into runs</li>
            <li><strong>Tombstone compaction</strong>: Deleted nodes are periodically cleaned up when all peers have acknowledged them</li>
            <li><strong>Lazy tree balancing</strong>: The underlying tree structure is rebalanced during idle periods</li>
            <li><strong>Incremental rendering</strong>: Only the affected portion of the document is re-rendered</li>
          </ul>

          <h2>What We Learned</h2>

          <p>
            Building this editor taught us several valuable lessons about distributed systems and real-time collaboration:
          </p>

          <p>
            First, <strong>test with chaos</strong>. We built a testing harness that simulates network partitions, message reordering, and duplicate delivery. This caught dozens of bugs that would have been nearly impossible to reproduce manually.
          </p>

          <p>
            Second, <strong>measure everything</strong>. We instrumented the editor to track operation latency, merge frequency, and document size over time. This data was invaluable for identifying performance bottlenecks and guiding optimization efforts.
          </p>

          <p>
            Third, <strong>start simple</strong>. Our first version used a basic sequence CRDT (RGA). Once that was working correctly, we gradually added complexity — rich text formatting, embedded objects, and presence indicators. Trying to build everything at once would have been a recipe for disaster.
          </p>

          <hr />

          <p>
            Real-time collaboration is one of those problems where the journey is as rewarding as the destination. If you&apos;re interested in exploring CRDTs further, I highly recommend the <code>yjs</code> and <code>automerge</code> libraries as starting points.
          </p>
        </div>
      </article>

      {/* Share & Tags footer */}
      <div className="mx-auto max-w-[740px] px-6 mt-16">
        <div className="h-px glow-line opacity-20 mb-8" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag} slug={tag} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50">Share</span>
            <button className="size-8 rounded-lg border border-border/40 hover:border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" x2="12" y1="2" y2="15"/>
              </svg>
            </button>
            <button className="size-8 rounded-lg border border-border/40 hover:border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 mt-24">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              Related Posts
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {relatedPosts.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
