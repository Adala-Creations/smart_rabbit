import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_SKIP_TS_CHECK === "true",
  },
};

export default nextConfig;
