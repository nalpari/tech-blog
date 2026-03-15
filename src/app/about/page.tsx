import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "about",
  description:
    "where engineers share professional knowledge and technical insights",
};

const team = [
  {
    name: "jae kim",
    role: "founder & lead author",
    bio: "staff engineer with 12 years of experience building distributed systems. previously at stripe and vercel.",
    initials: "jk",
  },
  {
    name: "alex chen",
    role: "frontend & design",
    bio: "design engineer obsessed with crafting interfaces that feel alive. react, motion, and pixel-perfection.",
    initials: "ac",
  },
  {
    name: "sarah park",
    role: "systems & infrastructure",
    bio: "infrastructure architect who thinks in distributed systems. kubernetes, terraform, and the pursuit of five nines.",
    initials: "sp",
  },
  {
    name: "marcus li",
    role: "ai & machine learning",
    bio: "ml engineer bridging the gap between research and production. building intelligent systems that actually work.",
    initials: "ml",
  },
];

const values = [
  {
    title: "depth_over_breadth",
    description:
      "we write the articles we wish existed when we were learning. deep dives that respect your time and intelligence.",
  },
  {
    title: "code_that_works",
    description:
      "every code example in our articles is tested and runs. no pseudo-code, no hand-waving.",
  },
  {
    title: "honest_engineering",
    description:
      "we share our failures alongside our successes. the real lessons come from the bugs that kept us up at night.",
  },
  {
    title: "open_by_default",
    description:
      "everything we build for this blog is open source. we believe in giving back to the community that taught us.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-14">
      <div className="mx-auto max-w-[1200px] px-10 py-12">
        {/* Header */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-2xl font-mono font-bold mb-4">
            <span className="text-accent">&gt;</span> about
          </h1>
          <p className="text-sm font-sans text-muted max-w-2xl leading-relaxed">
            {"// techlog is"} a tech blog by engineers, for engineers. we believe
            the best way to learn is through deep, honest exploration of the
            problems we actually face building software at scale.
          </p>
        </div>

        {/* Story */}
        <div className="mb-12 pb-12 border-b border-border">
          <p className="text-xs text-muted-foreground font-mono mb-4">
            {"// the_story"}
          </p>
          <div className="max-w-2xl space-y-4 text-sm font-sans text-muted leading-relaxed">
            <p>
              techlog started as a collection of internal engineering documents.
              we were a small team building real-time infrastructure, and we kept
              writing detailed post-mortems and architecture decision records.
            </p>
            <p>
              one day, a colleague suggested we publish them. &ldquo;these are
              more useful than most blog posts i read,&rdquo; she said.
              &ldquo;because they&apos;re honest about what went wrong.&rdquo;
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12 pb-12 border-b border-border">
          <p className="text-xs text-muted-foreground font-mono mb-6">
            {"// values"}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 stagger-children">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-5 border border-border"
              >
                <h3 className="text-sm font-mono font-bold text-accent mb-2">
                  $ {value.title}
                </h3>
                <p className="text-[13px] font-sans text-muted leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-6">
            {"// team"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-5 border border-border"
              >
                <div className="size-10 border border-accent flex items-center justify-center mb-3">
                  <span className="text-accent font-mono text-xs font-bold">
                    {member.initials}
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold text-foreground mb-0.5">
                  {member.name}
                </h3>
                <p className="text-xs text-accent font-mono mb-3">
                  {member.role}
                </p>
                <p className="text-[13px] font-sans text-muted leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
