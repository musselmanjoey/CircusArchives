import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('API Endpoints', () => {
  test.describe('Acts API', () => {
    test('GET /api/acts should return list of acts', async ({ request }) => {
      const response = await request.get('/api/acts');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();

      // Should have at least some acts from seed data
      if (data.data.length > 0) {
        const act = data.data[0];
        expect(act).toHaveProperty('id');
        expect(act).toHaveProperty('name');
      }
    });
  });

  test.describe('Videos API', () => {
    test('GET /api/videos should return list of videos', async ({ request }) => {
      const response = await request.get('/api/videos');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();
    });

    test('GET /api/videos should support year filter', async ({ request }) => {
      const response = await request.get('/api/videos?year=2023');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');

      // All returned videos should be from 2023
      for (const video of data.data) {
        expect(video.year).toBe(2023);
      }
    });

    test('GET /api/videos should support search query', async ({ request }) => {
      const response = await request.get('/api/videos?search=juggling');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
    });

    test('GET /api/videos should support actId filter', async ({ request }) => {
      // First get an act ID
      const actsResponse = await request.get('/api/acts');
      const actsData = await actsResponse.json();

      if (actsData.data && actsData.data.length > 0) {
        const actId = actsData.data[0].id;
        const response = await request.get(`/api/videos?actId=${actId}`);

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');

        // V5: All returned videos should have the actId in their acts array
        for (const video of data.data) {
          const hasAct = video.acts?.some((va: { actId: string }) => va.actId === actId) ||
                         video.act?.id === actId;
          expect(hasAct).toBeTruthy();
        }
      }
    });

    test('POST /api/videos should require authentication', async ({ request }) => {
      const response = await request.post('/api/videos', {
        data: {
          // Missing required fields
          title: 'Test Video',
        },
      });

      // Should fail due to missing authentication
      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401);
    });

    test('POST /api/videos should reject unauthenticated requests', async ({ request }) => {
      // Get a valid act ID first
      const actsResponse = await request.get('/api/acts');
      const actsData = await actsResponse.json();

      if (actsData.data && actsData.data.length > 0) {
        const actId = actsData.data[0].id;

        const response = await request.post('/api/videos', {
          data: {
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Test Video',
            year: 2023,
            actId: actId,
          },
        });

        // Should fail due to missing authentication
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Auth API', () => {
    test('GET /api/auth/providers should return available providers', async ({ request }) => {
      const response = await request.get('/api/auth/providers');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should have credentials provider configured
      expect(data).toHaveProperty('credentials');
    });

    test('GET /api/auth/session should return session info', async ({ request }) => {
      const response = await request.get('/api/auth/session');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      // Unauthenticated should return empty object or null user
      const data = await response.json();
      // NextAuth returns {} for no session
      expect(typeof data).toBe('object');
    });

    test('GET /api/auth/csrf should return CSRF token', async ({ request }) => {
      const response = await request.get('/api/auth/csrf');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
    });
  });

  test.describe('Video Detail API', () => {
    test('GET /api/videos/[id] should return 404 for non-existent video', async ({ request }) => {
      const response = await request.get('/api/videos/non-existent-id');

      expect(response.status()).toBe(404);
    });

    test('GET /api/videos/[id] should return video details for valid ID', async ({ request }) => {
      // First get a video ID
      const videosResponse = await request.get('/api/videos');
      const videosData = await videosResponse.json();

      if (videosData.data && videosData.data.length > 0) {
        const videoId = videosData.data[0].id;
        const response = await request.get(`/api/videos/${videoId}`);

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
        expect(data.data.id).toBe(videoId);
        expect(data.data).toHaveProperty('title');
        expect(data.data).toHaveProperty('youtubeUrl');
        expect(data.data).toHaveProperty('year');
      }
    });
  });

  test.describe('Video Delete API', () => {
    test('DELETE /api/videos/[id] should require authentication', async ({ request }) => {
      const response = await request.delete('/api/videos/some-video-id');

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });

    test('DELETE /api/videos/[id] should return 404 for non-existent video', async ({ page, request }) => {
      // Log in first to get authenticated session
      await loginAsTestUser(page, 'Delete', 'Tester');

      // Now try to delete a non-existent video (with authenticated context from page)
      const response = await page.request.delete('/api/videos/non-existent-video-id-12345');

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Video not found');
    });

    test('DELETE /api/videos/[id] should return 403 when deleting another user\'s video', async ({ page }) => {
      // First, get a video that exists (from seed data, uploaded by someone else)
      const videosResponse = await page.request.get('/api/videos');
      const videosData = await videosResponse.json();

      // Find a video with an uploaderId that's not ours (seed data videos)
      const videoToDelete = videosData.data?.find((v: { uploaderId: string | null }) => v.uploaderId !== null);

      if (videoToDelete) {
        // Log in as a different user
        await loginAsTestUser(page, 'Other', 'User');

        // Try to delete the video owned by someone else
        const response = await page.request.delete(`/api/videos/${videoToDelete.id}`);

        expect(response.status()).toBe(403);

        const data = await response.json();
        expect(data.error).toBe('Not authorized to delete this video');
      }
    });

    test('DELETE /api/videos/[id] should successfully delete own video', async ({ page }) => {
      // Log in
      await loginAsTestUser(page, 'Owner', 'Deleter');

      // Get an act for creating a video
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actName = actsData.data[0].name;

      // Create a video via the form (so we own it) - no title field, it's auto-generated
      const uniqueDescription = `DELETE_TEST_VIDEO_${Date.now()}`;
      await page.goto('/submit');
      await page.locator('#youtubeUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      // V5: Click act chip to select instead of dropdown
      await page.getByRole('button', { name: actName }).click();
      await page.getByLabel('Description (optional)').fill(uniqueDescription);
      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Wait for success
      await page.waitForSelector('text=Video submitted successfully!', { timeout: 10000 });

      // Get the video we just created
      const videosResponse = await page.request.get(`/api/videos?search=${uniqueDescription}`);
      const videosData = await videosResponse.json();
      const ourVideo = videosData.data[0];

      expect(ourVideo).toBeDefined();

      // Delete it
      const deleteResponse = await page.request.delete(`/api/videos/${ourVideo.id}`);

      expect(deleteResponse.status()).toBe(200);

      const deleteData = await deleteResponse.json();
      expect(deleteData.message).toBe('Video deleted successfully');

      // Verify it's gone
      const verifyResponse = await page.request.get(`/api/videos/${ourVideo.id}`);
      expect(verifyResponse.status()).toBe(404);
    });
  });
});
