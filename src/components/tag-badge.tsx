import Link from "next/link";

interface TagBadgeProps {
  slug: string;
  name?: string;
  size?: "sm" | "md";
  interactive?: boolean;
}

export function TagBadge({
  slug,
  name,
  size = "sm",
  interactive = true,
}: TagBadgeProps) {
  const displayName = name || slug.replaceAll("-", " ");

  const sizeClasses = size === "sm" ? "text-[12px] px-2 py-0.5" : "text-[13px] px-2.5 py-1";
  const baseClasses = `inline-flex items-center rounded-[2px] border border-border-strong! text-muted ${sizeClasses}`;

  if (!interactive) {
    return <span className={baseClasses}>{displayName}</span>;
  }

  return (
    <Link
      href={`/tags/${slug}`}
      className={`${baseClasses} hover:text-foreground hover:border-foreground/60! transition-colors`}
    >
      {displayName}
    </Link>
  );
}
