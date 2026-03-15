"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({ size = "md", className }: LoadingProps) {
  const containerSizes = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  return (
    <div className={cn("relative", containerSizes[size], className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute size-3 bg-accent"
            style={{
              animation: `morph-${i} 2s infinite ease-in-out`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes morph-0 {
          0%, 100% { transform: translate(-8px, -8px) rotate(0deg); }
          25% { transform: translate(8px, -8px) rotate(90deg); }
          50% { transform: translate(8px, 8px) rotate(180deg); }
          75% { transform: translate(-8px, 8px) rotate(270deg); }
        }
        @keyframes morph-1 {
          0%, 100% { transform: translate(8px, -8px) rotate(0deg); }
          25% { transform: translate(8px, 8px) rotate(90deg); }
          50% { transform: translate(-8px, 8px) rotate(180deg); }
          75% { transform: translate(-8px, -8px) rotate(270deg); }
        }
        @keyframes morph-2 {
          0%, 100% { transform: translate(8px, 8px) rotate(0deg); }
          25% { transform: translate(-8px, 8px) rotate(90deg); }
          50% { transform: translate(-8px, -8px) rotate(180deg); }
          75% { transform: translate(8px, -8px) rotate(270deg); }
        }
        @keyframes morph-3 {
          0%, 100% { transform: translate(-8px, 8px) rotate(0deg); }
          25% { transform: translate(-8px, -8px) rotate(90deg); }
          50% { transform: translate(8px, -8px) rotate(180deg); }
          75% { transform: translate(8px, 8px) rotate(270deg); }
        }
      `}</style>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loading size="md" />
      <p className="text-xs font-mono text-muted-foreground animate-pulse">
        {"// loading..."}
      </p>
    </div>
  );
}
