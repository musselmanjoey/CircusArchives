import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Only enable this route for local storage
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads');

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
  // Only serve files in local storage mode
  if (STORAGE_PROVIDER !== 'local') {
    return NextResponse.json({ error: 'File serving disabled' }, { status: 404 });
  }

  try {
    const { path: pathSegments } = await context.params;
    const filePath = path.join(LOCAL_STORAGE_PATH, ...pathSegments);

    // Security: Ensure the resolved path is within the storage directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(LOCAL_STORAGE_PATH);

    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = await stat(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
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
        'Content-Disposition': `inline; filename="${path.basename(resolvedPath)}"`,
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
