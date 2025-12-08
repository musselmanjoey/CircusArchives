import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/lib/auth';

/**
 * Client upload token handler for Vercel Blob
 * This allows files to be uploaded directly from the browser to Vercel Blob,
 * bypassing the 4.5MB serverless function limit.
 *
 * See: https://vercel.com/docs/vercel-blob/client-upload
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload before generating token
        // pathname is the requested file path

        // Only allow video files in uploads directory
        if (!pathname.startsWith('uploads/')) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            'video/x-matroska',
            'video/mpeg',
            'video/3gpp',
            'video/x-m4v',
          ],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2GB
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called after the file is uploaded to Vercel Blob
        // Note: This won't work on localhost - only in production
        console.log('[Blob Upload] Completed:', blob.url);
        console.log('[Blob Upload] Token payload:', tokenPayload);

        // We don't create the queue entry here - that's done in a separate API call
        // after the client receives the blob URL
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[Blob Upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
