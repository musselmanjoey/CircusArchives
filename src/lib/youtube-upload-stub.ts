/**
 * YouTube Upload Stub for Production Builds
 *
 * This is an empty stub that replaces youtube-upload.ts in Vercel production builds
 * to avoid bundling Node.js fs/path/child_process modules which exceed size limits.
 *
 * In production, videos are queued for manual processing and this module is never used.
 */

import type { ShowType } from '@/types';

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  youtubeUrl?: string;
  error?: string;
  testMode?: boolean;
}

export async function uploadToYouTube(
  _filePath: string,
  _title: string,
  _year: number,
  _showType: ShowType,
  _actNames: string[],
  _description?: string | null,
  _performerNames?: string[]
): Promise<YouTubeUploadResult> {
  return {
    success: false,
    error: 'YouTube upload not available in production - video queued for manual processing'
  };
}
