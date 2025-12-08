/**
 * YouTube Upload Stub (Production Build)
 *
 * This is a minimal stub that replaces youtube-upload.ts in production builds.
 * It contains NO Node.js imports (fs, path, child_process) to avoid bundling issues.
 *
 * In production, videos are queued for manual processing and this code returns
 * an error indicating the upload was queued instead.
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
  // In production, videos are queued for manual processing
  return {
    success: false,
    error: 'YouTube upload not available in production - video queued for manual processing'
  };
}
