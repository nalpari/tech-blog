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
  const displayName = name || slug.replace(/-/g, "_");

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : "text-xs px-2.5 py-1";

  const baseClasses = `inline-flex items-center font-mono border border-accent text-accent ${sizeClasses}`;

  if (!interactive) {
    return <span className={baseClasses}>{displayName}</span>;
  }

  return (
    <Link
      href={`/tags/${slug}`}
      className={`${baseClasses} hover:bg-accent hover:text-background transition-colors`}
    >
      {displayName}
    </Link>
  );
}
