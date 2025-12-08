/**
 * YouTube Upload Helper
 *
 * Calls the Python upload script to upload videos to YouTube.
 * Only works in local development - in prod, use the queue processor.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { ShowType } from '@/types';

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const UPLOAD_SCRIPT_PATH = path.join(process.cwd(), 'tools', 'youtube', 'scripts', 'upload.py');

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  youtubeUrl?: string;
  error?: string;
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
  if (process.env.STORAGE_PROVIDER === 'vercel-blob') {
    return {
      success: false,
      error: 'YouTube upload not available in production - video queued for manual processing'
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

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      console.log(`[YouTube] ${text.trim()}`);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      console.error(`[YouTube Error] ${text.trim()}`);
    });

    proc.on('close', (code) => {
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

    proc.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to start upload process: ${err.message}`
      });
    });
  });
}
