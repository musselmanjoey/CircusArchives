import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  // This is needed because the local storage and YouTube upload modules use
  // fs, path, and child_process which are large and only used in local dev
  serverExternalPackages: ['fs', 'path', 'child_process'],
};

export default nextConfig;
