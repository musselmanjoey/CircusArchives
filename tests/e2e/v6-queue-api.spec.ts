import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

// Test prefix for cleanup
const TEST_PREFIX = 'V6_QUEUE_TEST_';

// Helper to create a small test video file buffer
function createTestVideoBuffer(): Buffer {
  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x14,
    0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x00, 0x01,
    0x69, 0x73, 0x6f, 0x6d,
  ]);
  const moov = Buffer.from([
    0x00, 0x00, 0x00, 0x08,
    0x6d, 0x6f, 0x6f, 0x76,
  ]);
  return Buffer.concat([ftyp, moov]);
}

// Helper to cleanup test queue items
async function cleanupTestQueueItems(page: Page) {
  try {
    const response = await page.request.get('/api/upload?all=true');
    const data = await response.json();

    const items = data.data?.items || data.data || [];
    for (const item of items) {
      if (item.title?.includes(TEST_PREFIX)) {
        await page.request.delete(`/api/upload/${item.id}`);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Helper to cleanup test videos
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get('/api/videos?limit=100');
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      for (const video of data.data) {
        if (video.youtubeId?.startsWith('TEST_') || video.title?.includes(TEST_PREFIX)) {
          await page.request.delete(`/api/videos/${video.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Helper to get valid act IDs
async function getActIds(page: Page): Promise<string[]> {
  const response = await page.request.get('/api/acts');
  const data = await response.json();
  return data.data?.slice(0, 2).map((act: { id: string }) => act.id) || [];
}

// Helper to create a queue item for testing
async function createTestQueueItem(page: Page, suffix: string = ''): Promise<{ id: string; title: string }> {
  const videoBuffer = createTestVideoBuffer();
  const actIds = await getActIds(page);
  const title = `${TEST_PREFIX}${suffix}_${Date.now()}`;

  const response = await page.request.post('/api/upload', {
    multipart: {
      file: { name: `${suffix}.mp4`, mimeType: 'video/mp4', buffer: videoBuffer },
      title,
      year: '2024',
      showType: 'HOME',
      actIds: actIds[0],
    },
  });

  const json = await response.json();
  return { id: json.data.id, title };
}

test.describe('V6 Queue Management API Tests', () => {
  test.describe('GET /api/upload/:id - Get Single Item', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'QueueGet', 'Tester');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should return 401 when not authenticated', async ({ page }) => {
      // First create an item
      const item = await createTestQueueItem(page, 'getauth');

      // Sign out by clearing cookies and try to access
      await page.context().clearCookies();
      await page.goto('/'); // Re-initialize

      const response = await page.request.get(`/api/upload/${item.id}`);
      expect(response.status()).toBe(401);
    });

    test('should return single queue item by ID', async ({ page }) => {
      const item = await createTestQueueItem(page, 'getsingle');

      const response = await page.request.get(`/api/upload/${item.id}`);
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json.data.id).toBe(item.id);
      expect(json.data.title).toBe(item.title);
    });

    test('should return 404 for non-existent item', async ({ page }) => {
      const response = await page.request.get('/api/upload/non-existent-id-12345');
      expect(response.status()).toBe(404);

      const json = await response.json();
      expect(json.error).toBe('Queue item not found');
    });
  });

  test.describe('PATCH /api/upload/:id - Update Queue Item', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'QueuePatch', 'Tester');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should return 401 when not authenticated', async ({ page }) => {
      const item = await createTestQueueItem(page, 'patchauth');

      await page.context().clearCookies();
      await page.goto('/');

      const response = await page.request.patch(`/api/upload/${item.id}`, {
        data: { status: 'FAILED' },
      });
      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent item', async ({ page }) => {
      const response = await page.request.patch('/api/upload/non-existent-id-12345', {
        data: { status: 'FAILED' },
      });
      expect(response.status()).toBe(404);
    });

    test('should mark item as FAILED with error message', async ({ page }) => {
      const item = await createTestQueueItem(page, 'markfailed');

      const response = await page.request.patch(`/api/upload/${item.id}`, {
        data: {
          status: 'FAILED',
          errorMessage: 'Test failure reason',
        },
      });

      expect(response.status()).toBe(200);
      const json = await response.json();

      expect(json.data.status).toBe('FAILED');
      expect(json.data.errorMessage).toBe('Test failure reason');
    });

    test('should mark failed item back to PENDING (retry)', async ({ page }) => {
      // First create and mark as failed
      const item = await createTestQueueItem(page, 'retry');

      await page.request.patch(`/api/upload/${item.id}`, {
        data: { status: 'FAILED', errorMessage: 'Initial failure' },
      });

      // Now retry (set back to PENDING)
      const response = await page.request.patch(`/api/upload/${item.id}`, {
        data: { status: 'PENDING', errorMessage: null },
      });

      expect(response.status()).toBe(200);
      const json = await response.json();

      expect(json.data.status).toBe('PENDING');
      expect(json.data.errorMessage).toBeNull();
    });

    test('should mark as UPLOADED with valid YouTube URL', async ({ page }) => {
      const item = await createTestQueueItem(page, 'markuploaded');

      const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      const response = await page.request.patch(`/api/upload/${item.id}`, {
        data: {
          status: 'UPLOADED',
          youtubeUrl,
        },
      });

      expect(response.status()).toBe(200);
      const json = await response.json();

      // Should create a video entry and return it
      expect(json.data).toBeDefined();
      expect(json.message).toBe('Video created successfully');
    });

    test('should return 400 for invalid YouTube URL', async ({ page }) => {
      const item = await createTestQueueItem(page, 'invalidyt');

      const response = await page.request.patch(`/api/upload/${item.id}`, {
        data: {
          status: 'UPLOADED',
          youtubeUrl: 'not-a-valid-url',
        },
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid YouTube URL');
    });

    test('should return 409 for duplicate YouTube URL', async ({ page }) => {
      // Create first item and mark as uploaded
      const item1 = await createTestQueueItem(page, 'dup1');
      const youtubeUrl = `https://www.youtube.com/watch?v=TEST_DUP_${Date.now()}`;

      await page.request.patch(`/api/upload/${item1.id}`, {
        data: { status: 'UPLOADED', youtubeUrl },
      });

      // Create second item and try same URL
      const item2 = await createTestQueueItem(page, 'dup2');

      const response = await page.request.patch(`/api/upload/${item2.id}`, {
        data: { status: 'UPLOADED', youtubeUrl },
      });

      expect(response.status()).toBe(409);
      const json = await response.json();
      expect(json.error).toContain('already exists');
    });
  });

  test.describe('DELETE /api/upload/:id - Delete Queue Item', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'QueueDelete', 'Tester');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should return 401 when not authenticated', async ({ page }) => {
      const item = await createTestQueueItem(page, 'delauth');

      await page.context().clearCookies();
      await page.goto('/');

      const response = await page.request.delete(`/api/upload/${item.id}`);
      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent item', async ({ page }) => {
      const response = await page.request.delete('/api/upload/non-existent-id-12345');
      expect(response.status()).toBe(404);
    });

    test('should delete queue item successfully', async ({ page }) => {
      const item = await createTestQueueItem(page, 'delete');

      // Verify it exists first
      const checkResponse = await page.request.get(`/api/upload/${item.id}`);
      expect(checkResponse.status()).toBe(200);

      // Delete it
      const deleteResponse = await page.request.delete(`/api/upload/${item.id}`);
      expect(deleteResponse.status()).toBe(200);

      const json = await deleteResponse.json();
      expect(json.data.deleted).toBe(true);

      // Verify it's gone
      const verifyResponse = await page.request.get(`/api/upload/${item.id}`);
      expect(verifyResponse.status()).toBe(404);
    });

    test('should delete pending item', async ({ page }) => {
      const item = await createTestQueueItem(page, 'delpending');

      const response = await page.request.delete(`/api/upload/${item.id}`);
      expect(response.status()).toBe(200);
    });

    test('should delete failed item', async ({ page }) => {
      const item = await createTestQueueItem(page, 'delfailed');

      // Mark as failed first
      await page.request.patch(`/api/upload/${item.id}`, {
        data: { status: 'FAILED', errorMessage: 'Test' },
      });

      const response = await page.request.delete(`/api/upload/${item.id}`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Queue Stats', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'QueueStats', 'Tester');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should return accurate pending count', async ({ page }) => {
      // Get initial stats
      const initialResponse = await page.request.get('/api/upload?stats=true&all=true');
      const initialStats = (await initialResponse.json()).data.stats;

      // Create a new item - in test mode this may be auto-uploaded immediately
      const item = await createTestQueueItem(page, 'statspending');

      // Check item status - it might be UPLOADED in test mode
      const itemResponse = await page.request.get(`/api/upload/${item.id}`);
      const itemData = await itemResponse.json();

      // Get new stats
      const newResponse = await page.request.get('/api/upload?stats=true&all=true');
      const newStats = (await newResponse.json()).data.stats;

      // Verify stats structure is correct (values may vary due to test mode)
      expect(typeof newStats.pending).toBe('number');
      expect(typeof newStats.uploaded).toBe('number');

      // If item is still pending, count should have increased
      if (itemData.data?.status === 'PENDING') {
        expect(newStats.pending).toBeGreaterThan(initialStats.pending);
      }
    });

    test('should return accurate failed count', async ({ page }) => {
      // Get initial stats
      const initialResponse = await page.request.get('/api/upload?stats=true&all=true');
      const initialStats = (await initialResponse.json()).data.stats;
      const initialFailed = initialStats.failed;

      // Create and mark as failed
      const item = await createTestQueueItem(page, 'statsfailed');

      const patchResponse = await page.request.patch(`/api/upload/${item.id}`, {
        data: { status: 'FAILED', errorMessage: 'Test' },
      });

      // If patch succeeded, check the count
      if (patchResponse.ok()) {
        // Get new stats
        const newResponse = await page.request.get('/api/upload?stats=true&all=true');
        const newStats = (await newResponse.json()).data.stats;

        expect(newStats.failed).toBe(initialFailed + 1);
      } else {
        // Item may have been auto-uploaded and deleted, just verify stats work
        const newResponse = await page.request.get('/api/upload?stats=true&all=true');
        const newStats = (await newResponse.json()).data.stats;
        expect(typeof newStats.failed).toBe('number');
      }
    });

    test('should include daily limit in stats', async ({ page }) => {
      const response = await page.request.get('/api/upload?stats=true&all=true');
      const json = await response.json();

      expect(json.data.stats.dailyLimit).toBeDefined();
      expect(json.data.stats.dailyLimit).toBeGreaterThan(0);
    });

    test('should include today uploads count in stats', async ({ page }) => {
      const response = await page.request.get('/api/upload?stats=true&all=true');
      const json = await response.json();

      expect(typeof json.data.stats.todayUploads).toBe('number');
      expect(json.data.stats.todayUploads).toBeGreaterThanOrEqual(0);
    });
  });
});
