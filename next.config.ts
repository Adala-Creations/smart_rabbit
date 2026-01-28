import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // ✅ Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
