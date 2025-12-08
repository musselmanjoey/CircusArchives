import type { NextConfig } from "next";

// Check if building on Vercel (production) - VERCEL env var is set during Vercel builds
const isVercelBuild = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  // Externalize Node.js modules to prevent bundling in serverless functions
  serverExternalPackages: ['fs', 'path', 'child_process'],

  webpack: (config, { isServer }) => {
    // In Vercel production builds, replace local storage and youtube-upload
    // modules with empty stubs to avoid bundling Node.js modules (500MB+)
    if (isServer && isVercelBuild) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace local storage module with an empty module
        '@/lib/storage/local': false,
        // Replace youtube-upload with an empty module
        '@/lib/youtube-upload': false,
      };
    }
    return config;
  },
};

export default nextConfig;
