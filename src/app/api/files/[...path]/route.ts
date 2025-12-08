import { NextRequest, NextResponse } from 'next/server';

// Only enable this route for local storage - in production with Vercel Blob, files are served directly
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// Early exit for production - don't import fs modules at all
const isProduction = STORAGE_PROVIDER === 'vercel-blob';

// MIME types for video files
const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
};

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // Only serve files in local storage mode - early return for production
  if (isProduction || STORAGE_PROVIDER !== 'local') {
    return NextResponse.json({ error: 'File serving disabled in production' }, { status: 404 });
  }

  // Dynamic imports to avoid bundling fs modules in production
  const { readFile, stat } = await import('fs/promises');
  const { existsSync } = await import('fs');
  const pathModule = await import('path');

  const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || pathModule.join(process.cwd(), 'uploads');

  try {
    const { path: pathSegments } = await context.params;
    const filePath = pathModule.join(LOCAL_STORAGE_PATH, ...pathSegments);

    // Security: Ensure the resolved path is within the storage directory
    const resolvedPath = pathModule.resolve(filePath);
    const resolvedBase = pathModule.resolve(LOCAL_STORAGE_PATH);

    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = await stat(resolvedPath);
    const ext = pathModule.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support range requests for video streaming
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = end - start + 1;

      // Read the specific chunk
      const { createReadStream } = await import('fs');
      const stream = createReadStream(resolvedPath, { start, end });

      // Convert Node stream to Web stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
        },
      });
    }

    // Full file read for non-range requests
    const fileBuffer = await readFile(resolvedPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${pathModule.basename(resolvedPath)}"`,
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
