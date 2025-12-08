import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  serverExternalPackages: ['fs', 'path', 'child_process'],

  // Empty turbopack config to satisfy Next.js 16 requirement
  // The code directly uses stub modules instead of relying on aliases
  turbopack: {},
};

export default nextConfig;
