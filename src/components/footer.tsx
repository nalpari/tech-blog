import { Wordmark } from "@/components/wordmark";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-[clamp(20px,2.6vw,48px)] py-8">
        <span className="text-muted-foreground">
          <Wordmark compact />
        </span>
        <p className="text-xs text-muted-foreground">
          개발하며 배운 것을 쌓아둡니다. &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
