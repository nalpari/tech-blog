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
  const displayName = name || slug.replace(/-/g, " ");

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : "text-xs px-2.5 py-1";

  const baseClasses = `inline-flex items-center rounded-md font-medium bg-white/[0.04] text-muted-foreground capitalize ${sizeClasses}`;

  if (!interactive) {
    return <span className={baseClasses}>{displayName}</span>;
  }

  return (
    <Link
      href={`/tags/${slug}`}
      className={`${baseClasses} hover:bg-white/[0.08] hover:text-foreground transition-all duration-200`}
    >
      {displayName}
    </Link>
  );
}
