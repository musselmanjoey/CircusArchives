import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  serverExternalPackages: ['fs', 'path', 'child_process'],

  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      // Replace modules with Node.js imports with stubs to reduce bundle size
      // These patterns use wildcards to match any path ending with the module name
      '**/storage/local': '@/lib/storage/local-stub',
      '**/youtube-upload': '@/lib/youtube-upload-stub',
    },
  },
};

export default nextConfig;
