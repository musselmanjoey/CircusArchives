import { Page } from '@playwright/test';
import type { ShowType } from '../../../src/types';

const TEST_VIDEO_PREFIX = 'E2E_TEST_VIDEO_';

/**
 * V5-compatible video creation helper
 * Creates a video with the new V5 API (actIds array + showType)
 */
export async function createTestVideo(
  page: Page,
  actId: string,
  year: number,
  options?: {
    performerIds?: string[];
    showType?: ShowType;
    description?: string;
    additionalActIds?: string[];
  }
) {
  const actIds = [actId, ...(options?.additionalActIds || [])];

  const response = await page.request.post('/api/videos', {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      year,
      description: options?.description || `${TEST_VIDEO_PREFIX}${Date.now()}`,
      actIds,
      showType: options?.showType || 'HOME',
      performerIds: options?.performerIds,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to create video: ${data.error || response.status}`);
  }

  return data.data;
}

/**
 * Helper to cleanup test videos
 */
export async function cleanupTestVideos(page: Page, prefix = TEST_VIDEO_PREFIX) {
  try {
    const response = await page.request.get(`/api/videos?search=${prefix}&limit=100`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      for (const video of data.data) {
        if (video.description?.includes(prefix)) {
          await page.request.delete(`/api/videos/${video.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Get first N act IDs from the API
 */
export async function getActIds(page: Page, count = 1): Promise<string[]> {
  const response = await page.request.get('/api/acts');
  const data = await response.json();
  return data.data.slice(0, count).map((act: { id: string }) => act.id);
}

/**
 * Get act by index (useful for getting different acts)
 */
export async function getActByIndex(page: Page, index = 0): Promise<{ id: string; name: string }> {
  const response = await page.request.get('/api/acts');
  const data = await response.json();
  return data.data[index] || data.data[0];
}
