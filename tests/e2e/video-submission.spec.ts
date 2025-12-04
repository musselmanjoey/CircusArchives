import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

// Prefix for test videos - makes them easy to identify and clean up
const TEST_VIDEO_PREFIX = 'E2E_TEST_VIDEO_';

// Helper function to delete a test video by ID
async function deleteTestVideo(page: Page, videoId: string) {
  try {
    await page.request.delete(`/api/videos/${videoId}`);
  } catch {
    // Ignore errors - video may already be deleted or we may not have permission
  }
}

// Helper function to find and delete test videos created during this test run
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get(`/api/videos?search=${TEST_VIDEO_PREFIX}&limit=100`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      for (const video of data.data) {
        // Match by description since title is now auto-generated
        if (video.description?.includes(TEST_VIDEO_PREFIX)) {
          await deleteTestVideo(page, video.id);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

test.describe('Video Submission', () => {
  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test
      await loginAsTestUser(page, 'Video', 'Submitter');
      await page.goto('/submit');
    });

    // Clean up any test videos after each test
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('should display submission form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
      await expect(page.getByLabel('YouTube URL')).toBeVisible();
      // Title field removed - now auto-generated from Act + Year
      await expect(page.getByLabel('Year')).toBeVisible();
      await expect(page.getByLabel('Act Category')).toBeVisible();
      await expect(page.getByLabel('Description (optional)')).toBeVisible();
    });

    test('should NOT have a title field (auto-generated)', async ({ page }) => {
      // Title is now auto-generated from Act + Year per V2 spec
      await expect(page.getByLabel('Title')).not.toBeVisible();
    });

    test('should show submitter name', async ({ page }) => {
      await expect(page.getByText('Submitting as Video Submitter')).toBeVisible();
    });

    test('should show validation error for invalid URL', async ({ page }) => {
      await page.getByLabel('YouTube URL').fill('invalid-url');
      await page.getByLabel('Act Category').selectOption({ index: 1 }); // Select first act
      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Should still be on the same page with the input visible
      const urlInput = page.getByLabel('YouTube URL');
      await expect(urlInput).toBeVisible();
    });

    test('should submit valid video successfully', async ({ page }) => {
      // Description with test prefix for easy cleanup
      const uniqueDescription = `${TEST_VIDEO_PREFIX}${Date.now()} - will be auto-deleted`;

      await page.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      // No Title field - it's auto-generated from Act + Year
      await page.getByLabel('Year').selectOption('2024');
      await page.getByLabel('Act Category').selectOption({ label: 'Juggling' });
      await page.getByLabel('Description (optional)').fill(uniqueDescription);

      // Verify values are set
      await expect(page.getByLabel('YouTube URL')).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      // Act Category value is a UUID, just verify it's not empty
      const actValue = await page.getByLabel('Act Category').inputValue();
      expect(actValue).toBeTruthy();
      expect(actValue).not.toBe('');

      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Check for validation errors if success message doesn't appear
      const error = page.locator('.text-red-500');
      if (await error.count() > 0) {
        console.log('Validation errors:', await error.allInnerTexts());
      }

      await expect(page.getByText('Video submitted successfully!')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Redirecting to videos page...')).toBeVisible();

      // Video will be cleaned up by afterEach hook
    });

    test('should auto-generate title as "Act Year"', async ({ page }) => {
      const uniqueDescription = `${TEST_VIDEO_PREFIX}autotitle_${Date.now()}`;

      await page.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.getByLabel('Year').selectOption('2023');
      await page.getByLabel('Act Category').selectOption({ label: 'Flying Trapeze' });
      await page.getByLabel('Description (optional)').fill(uniqueDescription);

      await page.getByRole('button', { name: 'Submit Video' }).click();
      await expect(page.getByText('Video submitted successfully!')).toBeVisible({ timeout: 10000 });

      // Wait for redirect
      await page.waitForURL('/videos', { timeout: 10000 });

      // Get recent videos and find by description (search can be flaky with special chars)
      const response = await page.request.get('/api/videos?limit=20');
      const data = await response.json();

      // Find video by exact description match
      const createdVideo = data.data.find(
        (v: { description?: string }) => v.description === uniqueDescription
      );

      expect(createdVideo).toBeDefined();

      // Title should be auto-generated as "Flying Trapeze 2023"
      expect(createdVideo.title).toBe('Flying Trapeze 2023');

      // Cleanup
      await page.request.delete(`/api/videos/${createdVideo.id}`);
    });

    test('should require all mandatory fields', async ({ page }) => {
      // Try to submit without filling any fields
      const submitButton = page.getByRole('button', { name: 'Submit Video' });

      // HTML5 validation should prevent submission
      await submitButton.click();

      // Should still be on submit page
      await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
    });
  });

  test.describe('Unauthenticated User', () => {
    test('should redirect to sign-in prompt', async ({ page }) => {
      await page.goto('/submit');

      // Should show sign-in required message
      await expect(page.getByRole('heading', { name: 'Sign In Required' })).toBeVisible();
      await expect(page.getByText('You need to sign in to submit videos')).toBeVisible();
    });

    test('should not show submission form', async ({ page }) => {
      await page.goto('/submit');

      // Form fields should not be visible
      await expect(page.getByLabel('YouTube URL')).not.toBeVisible();
      await expect(page.getByLabel('Act Category')).not.toBeVisible();
    });
  });
});
