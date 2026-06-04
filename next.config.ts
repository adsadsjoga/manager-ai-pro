import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
