/**
 * YouTube Upload Helper
 *
 * Calls the Python upload script to upload videos to YouTube.
 * Only works in local development - in prod, use the queue processor.
 *
 * Test Mode: Set SKIP_YOUTUBE_UPLOAD=true to mock uploads for testing.
 * This will return a fake YouTube URL without actually uploading.
 *
 * NOTE: This module uses dynamic imports to avoid bundling Node.js modules
 * (fs, path, child_process) in production Vercel builds.
 */

import type { ShowType } from '@/types';

// Test mode flag - when true, skips actual YouTube upload and returns mock data
const TEST_MODE = process.env.SKIP_YOUTUBE_UPLOAD === 'true';

// Check if we're in production (Vercel Blob storage)
const isProduction = () => process.env.STORAGE_PROVIDER === 'vercel-blob';

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  youtubeUrl?: string;
  error?: string;
  testMode?: boolean; // Indicates if this was a mock upload
}

/**
 * Upload a video to YouTube using the Python script
 */
export async function uploadToYouTube(
  filePath: string,
  title: string,
  year: number,
  showType: ShowType,
  actNames: string[],
  description?: string | null,
  performerNames?: string[]
): Promise<YouTubeUploadResult> {
  // Only run in local dev (when STORAGE_PROVIDER is not vercel-blob)
  if (isProduction()) {
    return {
      success: false,
      error: 'YouTube upload not available in production - video queued for manual processing'
    };
  }

  // Dynamic imports to avoid bundling in production
  const fs = await import('fs');
  const path = await import('path');
  const { spawn } = await import('child_process');

  const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
  const UPLOAD_SCRIPT_PATH = path.join(process.cwd(), 'tools', 'youtube', 'scripts', 'upload.py');

  // Test mode - return mock success without actually uploading
  if (TEST_MODE) {
    // Still check file exists to validate the flow
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}`, testMode: true };
    }

    // Generate a mock video ID (prefixed with TEST_ for easy identification)
    const mockVideoId = `TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockUrl = `https://www.youtube.com/watch?v=${mockVideoId}`;

    console.log(`[YouTube Upload] TEST MODE - Mocking upload for: ${title}`);
    console.log(`[YouTube Upload] TEST MODE - Mock Video ID: ${mockVideoId}`);

    return {
      success: true,
      videoId: mockVideoId,
      youtubeUrl: mockUrl,
      testMode: true
    };
  }

  return new Promise((resolve) => {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      resolve({ success: false, error: `File not found: ${filePath}` });
      return;
    }

    // Check script exists
    if (!fs.existsSync(UPLOAD_SCRIPT_PATH)) {
      resolve({ success: false, error: `Upload script not found: ${UPLOAD_SCRIPT_PATH}` });
      return;
    }

    // Build the title - use act names if available
    const actPart = actNames.length > 0 ? actNames.join(' & ') : 'Performance';
    const showPart = showType === 'CALLAWAY' ? 'Callaway' : 'Home Show';
    const fullTitle = `${actPart} - FSU Flying High Circus ${showPart} ${year}`;

    // Build arguments for the Python script
    const args = [
      UPLOAD_SCRIPT_PATH,
      filePath,
      fullTitle,
      '--year', year.toString(),
      '--show', showType === 'CALLAWAY' ? 'Callaway Gardens' : 'Home Show',
      '-p', 'unlisted'  // Start as unlisted, can change later
    ];

    // Add act if we have one
    if (actNames.length > 0) {
      args.push('--act', actNames[0]);
    }

    // Add performers if provided
    if (performerNames && performerNames.length > 0) {
      args.push('--performers', performerNames.join(','));
    }

    // Add description/notes if provided
    if (description) {
      args.push('--notes', description);
    }

    console.log(`[YouTube Upload] Starting upload: ${title}`);
    console.log(`[YouTube Upload] File: ${filePath}`);
    console.log(`[YouTube Upload] Command: ${PYTHON_PATH} ${args.join(' ')}`);

    const proc = spawn(PYTHON_PATH, args, {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      console.log(`[YouTube] ${text.trim()}`);
    });

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      console.error(`[YouTube Error] ${text.trim()}`);
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        // Parse video ID from output
        // The script outputs: "Video ID: VIDEO_ID" and "URL: https://www.youtube.com/watch?v=VIDEO_ID"
        const videoIdMatch = stdout.match(/Video ID: ([a-zA-Z0-9_-]+)/);
        const urlMatch = stdout.match(/URL: (https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+)/);

        if (videoIdMatch && urlMatch) {
          console.log(`[YouTube Upload] Success! URL: ${urlMatch[1]}`);
          resolve({
            success: true,
            videoId: videoIdMatch[1],
            youtubeUrl: urlMatch[1]
          });
        } else {
          resolve({
            success: false,
            error: 'Upload succeeded but could not parse video ID from output'
          });
        }
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`
        });
      }
    });

    proc.on('error', (err: Error) => {
      resolve({
        success: false,
        error: `Failed to start upload process: ${err.message}`
      });
    });
  });
}
