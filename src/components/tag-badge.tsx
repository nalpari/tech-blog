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

  const sizeClasses = size === "sm" ? "text-[13px] px-2.5 py-1" : "text-sm px-3 py-1.5";
  const baseClasses = `inline-flex items-center rounded bg-surface text-muted ${sizeClasses}`;

  if (!interactive) {
    return <span className={baseClasses}>{displayName}</span>;
  }

  return (
    <Link
      href={`/tags/${slug}`}
      className={`${baseClasses} hover:bg-card-hover hover:text-foreground transition-colors`}
    >
      {displayName}
    </Link>
  );
}
