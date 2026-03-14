export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
  coverGradient?: string;
}

export interface Tag {
  slug: string;
  name: string;
  description: string;
  postCount: number;
}

export const tags: Tag[] = [
  {
    slug: "systems-design",
    name: "Systems Design",
    description:
      "Architectural patterns, distributed systems, and the art of designing software that scales.",
    postCount: 8,
  },
  {
    slug: "react",
    name: "React",
    description:
      "Modern React patterns, server components, and building exceptional user interfaces.",
    postCount: 12,
  },
  {
    slug: "typescript",
    name: "TypeScript",
    description:
      "Type-level programming, advanced patterns, and making JavaScript safer.",
    postCount: 15,
  },
  {
    slug: "performance",
    name: "Performance",
    description:
      "Optimization techniques, profiling strategies, and delivering fast experiences.",
    postCount: 6,
  },
  {
    slug: "devops",
    name: "DevOps",
    description:
      "CI/CD pipelines, infrastructure as code, and the bridge between development and operations.",
    postCount: 5,
  },
  {
    slug: "ai-ml",
    name: "AI & ML",
    description:
      "Machine learning in production, LLM integrations, and the future of intelligent software.",
    postCount: 9,
  },
  {
    slug: "rust",
    name: "Rust",
    description:
      "Memory safety, zero-cost abstractions, and systems programming for the modern era.",
    postCount: 4,
  },
  {
    slug: "databases",
    name: "Databases",
    description:
      "Query optimization, data modeling, and choosing the right storage for your workload.",
    postCount: 7,
  },
];

export const posts: Post[] = [
  {
    slug: "building-real-time-collaborative-editor",
    title: "Building a Real-Time Collaborative Editor from Scratch",
    excerpt:
      "A deep dive into CRDTs, operational transforms, and the architectural decisions behind building a multiplayer text editor that actually works.",
    date: "2026-03-12",
    readTime: "14 min read",
    tags: ["systems-design", "typescript"],
    featured: true,
    coverGradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
  },
  {
    slug: "react-server-components-mental-model",
    title: "The Mental Model You Need for React Server Components",
    excerpt:
      "RSC isn't just about performance. It's a fundamental shift in how we think about the boundary between server and client. Here's the framework I use.",
    date: "2026-03-08",
    readTime: "10 min read",
    tags: ["react", "typescript"],
    featured: true,
    coverGradient: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
  },
  {
    slug: "type-safe-api-layer",
    title: "Designing a Type-Safe API Layer with tRPC and Zod",
    excerpt:
      "End-to-end type safety isn't a dream anymore. Here's how we built an API layer that catches bugs before they reach production.",
    date: "2026-03-04",
    readTime: "8 min read",
    tags: ["typescript", "systems-design"],
  },
  {
    slug: "rust-for-typescript-developers",
    title: "Rust for TypeScript Developers: A Practical Guide",
    excerpt:
      "The ownership model, pattern matching, and zero-cost abstractions — explained through the lens of concepts you already know.",
    date: "2026-02-28",
    readTime: "16 min read",
    tags: ["rust", "typescript"],
  },
  {
    slug: "scaling-postgres-beyond-million-rows",
    title: "Scaling PostgreSQL Beyond a Million Rows per Second",
    excerpt:
      "Partitioning strategies, connection pooling, and the query patterns that took our database from struggling to soaring.",
    date: "2026-02-22",
    readTime: "12 min read",
    tags: ["databases", "performance"],
  },
  {
    slug: "llm-powered-code-review",
    title: "We Built an LLM-Powered Code Review Bot. Here's What We Learned.",
    excerpt:
      "The promises, pitfalls, and practical insights from deploying AI-assisted code review across a team of 40 engineers.",
    date: "2026-02-18",
    readTime: "11 min read",
    tags: ["ai-ml", "devops"],
  },
  {
    slug: "zero-downtime-deployments",
    title: "Zero-Downtime Deployments: The Complete Playbook",
    excerpt:
      "Blue-green, canary, rolling updates — and the one strategy most teams overlook. A comprehensive guide to deploying without fear.",
    date: "2026-02-12",
    readTime: "9 min read",
    tags: ["devops", "systems-design"],
  },
  {
    slug: "web-performance-budget",
    title: "Setting a Web Performance Budget That Actually Works",
    excerpt:
      "Why most performance budgets fail, and the metrics-driven approach we use to keep our apps fast as they grow.",
    date: "2026-02-06",
    readTime: "7 min read",
    tags: ["performance", "react"],
  },
  {
    slug: "event-driven-architecture-patterns",
    title: "Event-Driven Architecture: Patterns That Scale",
    excerpt:
      "From event sourcing to CQRS, the patterns we use to build systems that handle millions of events per day.",
    date: "2026-01-30",
    readTime: "13 min read",
    tags: ["systems-design", "databases"],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByTag(tagSlug: string): Post[] {
  return posts.filter((p) => p.tags.includes(tagSlug));
}

export function getTagBySlug(slug: string): Tag | undefined {
  return tags.find((t) => t.slug === slug);
}

export function getFeaturedPosts(): Post[] {
  return posts.filter((p) => p.featured);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
