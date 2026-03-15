"use client";

import { useIsFetching } from "@tanstack/react-query";

export function QueryLoadingIndicator() {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 h-0.5 overflow-hidden">
      <div className="h-full bg-accent animate-[slide_1s_ease-in-out_infinite]" style={{
        width: "30%",
        animation: "slide 1.2s ease-in-out infinite",
      }} />

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
