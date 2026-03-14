import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-foreground font-semibold tracking-tight text-sm">
                Spectra
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Exploring the cutting edge of software engineering, systems
              design, and the art of building great products.
            </p>
          </div>

          <div className="flex gap-16">
            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Navigate
              </h4>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="/tags"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Topics
                </Link>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Connect
              </h4>
              <div className="flex flex-col gap-2.5">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  X / Twitter
                </a>
                <a
                  href="/rss.xml"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  RSS Feed
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Spectra. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Built with Next.js &middot; Deployed on Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
