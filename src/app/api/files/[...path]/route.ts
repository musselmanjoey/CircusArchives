import { NextRequest, NextResponse } from 'next/server';

/**
 * Local file serving route stub.
 *
 * This route is intentionally minimal to avoid bundling Node.js fs modules
 * which would exceed Vercel's 300MB function size limit.
 *
 * In PRODUCTION: Files are served directly via Vercel Blob URLs - this route returns 404.
 * In LOCAL DEV: Use the standalone file server or access files via the storage path directly.
 */

export const runtime = 'edge';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(
  _request: NextRequest,
  _context: RouteContext
): Promise<NextResponse> {
  // This route is disabled - files should be accessed via their direct URLs
  // - Production: Vercel Blob URLs (https://...blob.vercel-storage.com/...)
  // - Local dev: Direct file access or standalone dev server
  return NextResponse.json(
    {
      error: 'Direct file serving is not available.',
      hint: 'In production, files are served via Vercel Blob URLs. In local development, configure LOCAL_STORAGE_PATH.'
    },
    { status: 404 }
  );
}
