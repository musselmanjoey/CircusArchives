import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  serverExternalPackages: ['fs', 'path', 'child_process'],

  // Turbopack configuration for Next.js 16+
  // Always apply aliases - stubs check at runtime if they should throw or delegate
  turbopack: {
    resolveAlias: {
      // Replace local-only modules with stubs that don't import Node.js modules
      // This prevents bundling fs/path/child_process which exceed Vercel's 300MB limit
      '@/lib/storage/local': '@/lib/storage/local-stub',
      '@/lib/youtube-upload': '@/lib/youtube-upload-stub',
    },
  },
};

export default nextConfig;
