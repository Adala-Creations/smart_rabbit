import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TS errors during production build
  },
};

export default nextConfig;
