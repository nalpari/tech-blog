import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Spectra — a tech blog dedicated to exploring the art and science of building software.",
};

const team = [
  {
    name: "Jae Kim",
    role: "Founder & Lead Author",
    bio: "Staff engineer with 12 years of experience building distributed systems. Previously at Stripe and Vercel.",
    gradient: "from-indigo-400 to-violet-500",
    initials: "JK",
  },
  {
    name: "Alex Chen",
    role: "Frontend & Design",
    bio: "Design engineer obsessed with crafting interfaces that feel alive. React, motion, and pixel-perfection.",
    gradient: "from-violet-400 to-fuchsia-500",
    initials: "AC",
  },
  {
    name: "Sarah Park",
    role: "Systems & Infrastructure",
    bio: "Infrastructure architect who thinks in distributed systems. Kubernetes, Terraform, and the pursuit of five nines.",
    gradient: "from-fuchsia-400 to-pink-500",
    initials: "SP",
  },
  {
    name: "Marcus Li",
    role: "AI & Machine Learning",
    bio: "ML engineer bridging the gap between research and production. Building intelligent systems that actually work.",
    gradient: "from-cyan-400 to-indigo-500",
    initials: "ML",
  },
];

const values = [
  {
    title: "Depth Over Breadth",
    description:
      "We write the articles we wish existed when we were learning. Deep dives that respect your time and intelligence.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "Code That Works",
    description:
      "Every code example in our articles is tested and runs. No pseudo-code, no hand-waving, no 'left as an exercise.'",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Honest Engineering",
    description:
      "We share our failures alongside our successes. The real lessons come from the bugs that kept us up at night.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Open By Default",
    description:
      "Everything we build for this blog is open source. We believe in giving back to the community that taught us.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" x2="22" y1="12" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 mb-24">
        <div className="max-w-3xl animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 glow-line opacity-60" />
            <span className="text-xs font-medium uppercase tracking-widest text-accent/70">
              About Us
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            We write about the{" "}
            <span className="font-serif italic font-normal text-accent">
              hard parts
            </span>
          </h1>

          <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-2xl">
            Spectra is a tech blog by engineers, for engineers. We believe the
            best way to learn is through deep, honest exploration of the
            problems we actually face building software at scale.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="mx-auto max-w-[1200px] px-6 mb-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold tracking-tight mb-5">
              The story
            </h2>
            <div className="space-y-4 text-muted-foreground/80 leading-relaxed">
              <p>
                Spectra started as a collection of internal engineering
                documents. We were a small team building real-time
                infrastructure, and we kept writing detailed post-mortems and
                architecture decision records.
              </p>
              <p>
                One day, a colleague suggested we publish them. &ldquo;These are
                more useful than most blog posts I read,&rdquo; she said.
                &ldquo;Because they&apos;re honest about what went wrong.&rdquo;
              </p>
              <p>
                That insight became our founding principle: write the articles
                that would have helped us when we were stuck at 3 AM, debugging
                a production issue with no idea where to start.
              </p>
            </div>
          </div>

          <div
            className="relative animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/30 glass-card p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent" />
              <div className="relative space-y-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold gradient-text">2024</span>
                  <span className="text-sm text-muted-foreground/50">
                    Founded
                  </span>
                </div>
                <div className="h-px bg-border/30" />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">66+</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Articles published
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">120K</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Monthly readers
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">4</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Contributing authors
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">8</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Topics covered
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-[1200px] px-6 mb-24">
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              What We Believe
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {values.map((value, i) => (
            <div
              key={value.title}
              className="group p-6 rounded-xl border border-border/40 hover:border-border/80 bg-card/30 hover:bg-card/60 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="size-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/15 transition-colors">
                {value.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2 tracking-tight">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-[1200px] px-6 mb-24">
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              The Team
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="group p-6 rounded-xl border border-border/40 hover:border-border/80 bg-card/30 hover:bg-card/60 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`size-12 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10`}
              >
                <span className="text-white text-sm font-semibold">
                  {member.initials}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5 tracking-tight">
                {member.name}
              </h3>
              <p className="text-xs text-accent/70 font-medium mb-3">
                {member.role}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-[1200px] px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/30 glass-card p-10 sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-violet-500/[0.03]" />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Want to contribute?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We&apos;re always looking for experienced engineers who want to
                share their knowledge. If you have a story about building
                something hard, we want to hear it.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <a
                href="mailto:hello@spectra.dev"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Get in touch
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border/60 hover:border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 bg-white/[0.02] hover:bg-white/[0.04]"
              >
                Read the blog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
