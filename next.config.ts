import type { NextConfig } from "next";

// Check if building on Vercel (production) - VERCEL env var is set during Vercel builds
const isVercelBuild = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  serverExternalPackages: ['fs', 'path', 'child_process'],

  // Turbopack configuration for Next.js 16+
  turbopack: isVercelBuild ? {
    resolveAlias: {
      // Replace local-only modules with empty stubs in Vercel builds
      // to avoid bundling Node.js fs/path/child_process modules (500MB+)
      '@/lib/storage/local': '@/lib/storage/local-stub',
      '@/lib/youtube-upload': '@/lib/youtube-upload-stub',
    },
  } : {},
};

export default nextConfig;
