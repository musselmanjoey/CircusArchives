import { test, expect, Page } from '@playwright/test';

// Prefix for test data
const TEST_VIDEO_PREFIX = 'E2E_EDIT_TEST_';

// Helper to log in
async function loginAsTestUser(page: Page, firstName = 'Edit', lastName = 'Tester') {
  await page.goto('/login');
  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper to create a test video and return its ID
async function createTestVideo(page: Page, actIndex = 1): Promise<string> {
  const actsResponse = await page.request.get('/api/acts');
  const actsData = await actsResponse.json();
  const actId = actsData.data[actIndex]?.id || actsData.data[0].id;

  const videoResponse = await page.request.post('/api/videos', {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      year: 2024,
      actId: actId,
      description: `${TEST_VIDEO_PREFIX}description`,
    },
  });

  const videoData = await videoResponse.json();
  return videoData.data.id;
}

// Helper to cleanup test videos
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get(`/api/videos?search=${TEST_VIDEO_PREFIX}&limit=100`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      for (const video of data.data) {
        await page.request.delete(`/api/videos/${video.id}`);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

test.describe('Video Edit', () => {
  test.describe('PATCH /api/videos/[id]', () => {
    test('should require authentication', async ({ request }) => {
      const response = await request.patch('/api/videos/some-id', {
        data: { year: 2020 },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent video', async ({ page }) => {
      await loginAsTestUser(page);

      const response = await page.request.patch('/api/videos/non-existent-id', {
        data: { year: 2020 },
      });

      expect(response.status()).toBe(404);
    });

    test('should return 403 when not owner', async ({ page }) => {
      // First user creates a video
      await loginAsTestUser(page, 'Owner', 'User');
      const videoId = await createTestVideo(page);

      // Log out and log in as different user
      await page.goto('/');
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await page.waitForURL('/', { timeout: 10000 });

      await loginAsTestUser(page, 'Other', 'User');

      // Try to edit the video
      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { year: 2020 },
      });

      expect(response.status()).toBe(403);

      // Cleanup - log back in as owner to delete
      await page.goto('/');
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await loginAsTestUser(page, 'Owner', 'User');
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should update year successfully', async ({ page }) => {
      await loginAsTestUser(page);
      const videoId = await createTestVideo(page);

      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { year: 2020 },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.year).toBe(2020);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should update act and auto-update title', async ({ page }) => {
      await loginAsTestUser(page);
      const videoId = await createTestVideo(page, 0);

      // Get a different act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const newActId = actsData.data[1].id;
      const newActName = actsData.data[1].name;

      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { actId: newActId },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.actId).toBe(newActId);
      expect(data.data.title).toContain(newActName);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should update description', async ({ page }) => {
      await loginAsTestUser(page);
      const videoId = await createTestVideo(page);

      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { description: 'Updated description text' },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.description).toBe('Updated description text');

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should update performers', async ({ page }) => {
      await loginAsTestUser(page);
      const videoId = await createTestVideo(page);

      // Create a performer
      const userResponse = await page.request.post('/api/users', {
        data: { firstName: 'EditTest', lastName: 'Performer' },
      });
      const userData = await userResponse.json();
      const performerId = userData.data.id;

      // Update video with performer
      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { performerIds: [performerId] },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.performers.length).toBe(1);
      expect(data.data.performers[0].userId).toBe(performerId);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should clear performers when empty array passed', async ({ page }) => {
      await loginAsTestUser(page);

      // Create a performer
      const userResponse = await page.request.post('/api/users', {
        data: { firstName: 'ClearTest', lastName: 'Performer' },
      });
      const userData = await userResponse.json();
      const performerId = userData.data.id;

      // Get act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create video with performer
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          year: 2024,
          actId: actId,
          performerIds: [performerId],
        },
      });
      const videoData = await videoResponse.json();
      const videoId = videoData.data.id;

      // Clear performers
      const response = await page.request.patch(`/api/videos/${videoId}`, {
        data: { performerIds: [] },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.performers.length).toBe(0);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });
  });

  test.describe('Edit Page Access', () => {
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('owner can access edit page', async ({ page }) => {
      await loginAsTestUser(page, 'EditAccess', 'Owner');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}/edit`);

      // Should see the edit form
      await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
      await expect(page.locator('#year')).toBeVisible();
    });

    test('non-owner cannot access edit page', async ({ page }) => {
      // Create video as first user
      await loginAsTestUser(page, 'EditOwner', 'One');
      const videoId = await createTestVideo(page);

      // Sign out and sign in as different user
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await page.waitForURL('/', { timeout: 10000 });
      await loginAsTestUser(page, 'EditOther', 'Two');

      // Try to access edit page
      await page.goto(`/videos/${videoId}/edit`);

      // Should see permission denied message
      await expect(page.getByText(/don't have permission|not authorized|unauthorized/i)).toBeVisible();

      // Cleanup - sign back in as owner
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await loginAsTestUser(page, 'EditOwner', 'One');
    });

    test('guest cannot access edit page', async ({ browser }) => {
      // Create a new context for isolation
      const context = await browser.newContext();
      const page = await context.newPage();

      // First create a video while logged in
      await loginAsTestUser(page, 'GuestTest', 'Owner');
      const videoId = await createTestVideo(page);

      // Close and create a NEW context (guaranteed clean, no cookies)
      await context.close();
      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();

      // Try to access edit page as guest (no session cookies)
      await guestPage.goto(`/videos/${videoId}/edit`, { waitUntil: 'networkidle' });

      // Should see sign in required heading
      await expect(
        guestPage.getByRole('heading', { name: 'Sign In Required' })
      ).toBeVisible({ timeout: 15000 });

      // Cleanup - sign back in with original page
      await guestContext.close();
      const cleanupContext = await browser.newContext();
      const cleanupPage = await cleanupContext.newPage();
      await loginAsTestUser(cleanupPage, 'GuestTest', 'Owner');
      await cleanupPage.request.delete(`/api/videos/${videoId}`);
      await cleanupContext.close();
    });
  });

  test.describe('Edit Form', () => {
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('form is pre-filled with current values', async ({ page }) => {
      await loginAsTestUser(page, 'Prefill', 'Test');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}/edit`);

      // Year should be pre-filled
      await expect(page.locator('#year')).toHaveValue('2024');

      // Description should be pre-filled
      await expect(page.locator('#description')).toHaveValue(`${TEST_VIDEO_PREFIX}description`);
    });

    test('can save changes and redirect', async ({ page }) => {
      await loginAsTestUser(page, 'SaveTest', 'User');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}/edit`);

      // Change year
      await page.locator('#year').selectOption('2020');

      // Change description
      await page.locator('#description').fill('New description from test');

      // Save
      await page.getByRole('button', { name: /save/i }).click();

      // Should redirect to video detail
      await expect(page).toHaveURL(`/videos/${videoId}`, { timeout: 10000 });

      // Verify changes are visible
      await expect(page.getByText('2020')).toBeVisible();
      await expect(page.getByText('New description from test')).toBeVisible();
    });

    test('cancel returns to video detail without saving', async ({ page }) => {
      await loginAsTestUser(page, 'CancelTest', 'User');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}/edit`);

      // Make a change
      await page.locator('#year').selectOption('2019');

      // Cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Should redirect to video detail
      await expect(page).toHaveURL(`/videos/${videoId}`, { timeout: 10000 });

      // Year should still be 2024 (original)
      await expect(page.getByText('2024')).toBeVisible();
    });
  });

  test.describe('Edit/Delete Buttons on Detail Page', () => {
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('owner sees edit and delete buttons', async ({ page }) => {
      await loginAsTestUser(page, 'ButtonOwner', 'Test');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}`);

      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
    });

    test('non-owner does not see edit/delete buttons', async ({ page }) => {
      // Create video as first user
      await loginAsTestUser(page, 'ButtonOwner', 'One');
      const videoId = await createTestVideo(page);

      // Sign out and sign in as different user
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await page.waitForURL('/', { timeout: 10000 });
      await loginAsTestUser(page, 'ButtonOther', 'Two');

      // View the video
      await page.goto(`/videos/${videoId}`);

      // Should NOT see edit/delete buttons
      await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();

      // Cleanup
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await loginAsTestUser(page, 'ButtonOwner', 'One');
    });

    test('guest does not see edit/delete buttons', async ({ page }) => {
      // Create video while logged in
      await loginAsTestUser(page, 'GuestButton', 'Test');
      const videoId = await createTestVideo(page);

      // Sign out
      await page.getByRole('button', { name: 'Sign Out' }).click();
      await page.waitForURL('/', { timeout: 10000 });

      // View video as guest
      await page.goto(`/videos/${videoId}`);

      // Should NOT see edit/delete buttons
      await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();

      // Cleanup
      await loginAsTestUser(page, 'GuestButton', 'Test');
    });

    test('delete button with confirmation works', async ({ page }) => {
      await loginAsTestUser(page, 'DeleteBtn', 'Test');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}`);

      // Set up dialog handler to accept
      page.on('dialog', (dialog) => dialog.accept());

      // Click delete
      await page.getByRole('button', { name: /delete/i }).click();

      // Should redirect to videos page
      await expect(page).toHaveURL('/videos', { timeout: 10000 });

      // Video should be gone
      const response = await page.request.get(`/api/videos/${videoId}`);
      expect(response.status()).toBe(404);
    });

    test('delete cancellation keeps video', async ({ page }) => {
      await loginAsTestUser(page, 'DeleteCancel', 'Test');
      const videoId = await createTestVideo(page);

      await page.goto(`/videos/${videoId}`);

      // Set up dialog handler to dismiss
      page.on('dialog', (dialog) => dialog.dismiss());

      // Click delete
      await page.getByRole('button', { name: /delete/i }).click();

      // Should still be on same page
      await expect(page).toHaveURL(`/videos/${videoId}`);

      // Video should still exist
      const response = await page.request.get(`/api/videos/${videoId}`);
      expect(response.status()).toBe(200);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });
  });
});
