import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "stcwgfbjyvlyshdvojgn.supabase.co" },
    ],
  },
};

export default nextConfig;
