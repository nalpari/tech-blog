export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-[1200px] px-10 py-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">
          {"// built with precision"}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          &gt; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
