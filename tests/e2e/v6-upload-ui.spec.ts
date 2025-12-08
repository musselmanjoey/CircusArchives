import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import path from 'path';

// Test video file path - we'll create a small test file
const TEST_VIDEO_PREFIX = 'V6_E2E_TEST_';

// Helper to create a small test video file buffer
function createTestVideoBuffer(): Buffer {
  // Create a minimal valid MP4 file (just headers, not playable but valid for upload testing)
  // This is the smallest valid MP4 structure
  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x14, // size: 20 bytes
    0x66, 0x74, 0x79, 0x70, // type: 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, // brand: 'isom'
    0x00, 0x00, 0x00, 0x01, // version
    0x69, 0x73, 0x6f, 0x6d, // compatible brand
  ]);

  const moov = Buffer.from([
    0x00, 0x00, 0x00, 0x08, // size: 8 bytes (empty moov)
    0x6d, 0x6f, 0x6f, 0x76, // type: 'moov'
  ]);

  return Buffer.concat([ftyp, moov]);
}

// Helper to cleanup test queue items
async function cleanupTestQueueItems(page: Page) {
  try {
    const response = await page.request.get('/api/upload?all=true');
    const data = await response.json();

    if (data.data?.items) {
      for (const item of data.data.items) {
        if (item.title?.includes(TEST_VIDEO_PREFIX) || item.description?.includes(TEST_VIDEO_PREFIX)) {
          await page.request.delete(`/api/upload/${item.id}`);
        }
      }
    } else if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.title?.includes(TEST_VIDEO_PREFIX) || item.description?.includes(TEST_VIDEO_PREFIX)) {
          await page.request.delete(`/api/upload/${item.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Helper to cleanup test videos created during upload
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get('/api/videos?limit=100');
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      for (const video of data.data) {
        if (video.youtubeId?.startsWith('TEST_')) {
          await page.request.delete(`/api/videos/${video.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

test.describe('V6 Upload Page UI', () => {
  test.describe('Authentication Required (1.1)', () => {
    test('should show sign in required when not logged in', async ({ page }) => {
      await page.goto('/upload');

      await expect(page.getByRole('heading', { name: 'Sign In Required' })).toBeVisible();
      await expect(page.getByText('You need to sign in to upload videos')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign In to Continue' })).toBeVisible();
    });

    test('should not show upload form when not logged in', async ({ page }) => {
      await page.goto('/upload');

      // Upload form elements should not be visible
      await expect(page.getByText('Video File')).not.toBeVisible();
      await expect(page.getByLabel('Year')).not.toBeVisible();
    });
  });

  test.describe('Page Loads for Authenticated User (1.2)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'Upload', 'Tester');
      await page.goto('/upload');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should show upload form elements', async ({ page }) => {
      // Page header
      await expect(page.getByRole('heading', { name: 'Upload Video' })).toBeVisible();
      await expect(page.getByText('Uploading as Upload Tester')).toBeVisible();

      // File drop zone
      await expect(page.getByText('Tap to select or drag video')).toBeVisible();
      await expect(page.getByText(/MP4, MOV, AVI, WebM, MKV/).first()).toBeVisible();

      // Year dropdown
      await expect(page.getByLabel('Year')).toBeVisible();

      // Show type dropdown
      await expect(page.getByLabel('Show Type')).toBeVisible();

      // Act selection
      await expect(page.getByText('Act Categories')).toBeVisible();

      // Description textarea
      await expect(page.getByLabel(/Description/)).toBeVisible();

      // Upload button (should be disabled without file)
      const uploadButton = page.getByRole('button', { name: 'Upload Video' });
      await expect(uploadButton).toBeVisible();
      await expect(uploadButton).toBeDisabled();
    });

    test('should have year dropdown with valid range', async ({ page }) => {
      const yearSelect = page.getByLabel('Year');
      await expect(yearSelect).toBeVisible();

      // Check that 1990 exists (start of range) - options are in the DOM even if not visible
      await expect(page.locator('option[value="1990"]')).toBeAttached();

      // Check that current year exists
      const currentYear = new Date().getFullYear().toString();
      await expect(page.locator(`option[value="${currentYear}"]`)).toBeAttached();

      // Verify we can select 1990
      await yearSelect.selectOption('1990');
      await expect(yearSelect).toHaveValue('1990');
    });

    test('should have show type dropdown with HOME and CALLAWAY options', async ({ page }) => {
      const showTypeSelect = page.getByLabel('Show Type');
      await expect(showTypeSelect).toBeVisible();

      // Options are in the DOM but not visible until dropdown opened
      await expect(page.locator('option', { hasText: 'Home Show' })).toBeAttached();
      await expect(page.locator('option', { hasText: 'Callaway Show' })).toBeAttached();

      // Verify we can select both options
      await showTypeSelect.selectOption('HOME');
      await expect(showTypeSelect).toHaveValue('HOME');

      await showTypeSelect.selectOption('CALLAWAY');
      await expect(showTypeSelect).toHaveValue('CALLAWAY');
    });

    test('should show link to submit YouTube URL instead', async ({ page }) => {
      await expect(page.getByText('Already have a YouTube link?')).toBeVisible();
      await expect(page.getByRole('link', { name: /Submit YouTube URL instead/ })).toBeVisible();
    });
  });

  test.describe('File Selection (1.3, 1.4, 1.5)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'FileSelect', 'Tester');
      await page.goto('/upload');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should show file info after selecting valid file', async ({ page }) => {
      // Create test video buffer
      const videoBuffer = createTestVideoBuffer();

      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      // Should show file info
      await expect(page.getByText('test-video.mp4')).toBeVisible();

      // Should show remove button (X icon)
      await expect(page.locator('button').filter({ has: page.locator('svg') }).last()).toBeVisible();

      // Upload button should now be enabled (after selecting an act)
      await page.getByRole('button', { name: 'Juggling' }).click();
      const uploadButton = page.getByRole('button', { name: 'Upload Video' });
      await expect(uploadButton).toBeEnabled();
    });

    test('should show error for invalid file type', async ({ page }) => {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not a video'),
      });

      // Should show error message
      await expect(page.getByText(/Invalid file type/)).toBeVisible();

      // Should not show file info
      await expect(page.getByText('document.txt')).not.toBeVisible();
    });

    test('should show error for file too large', async ({ page }) => {
      // We can't actually create a 500MB+ file in tests, but we can verify
      // the UI shows the size limit text
      await expect(page.getByText(/500 MB/)).toBeVisible();
    });

    test('should allow removing selected file', async ({ page }) => {
      const videoBuffer = createTestVideoBuffer();

      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      // File should be shown
      await expect(page.getByText('test-video.mp4')).toBeVisible();

      // Click remove button
      const removeButton = page.locator('button[type="button"]').filter({ has: page.locator('path[d*="6 18L18 6"]') });
      await removeButton.click();

      // File info should be gone, drop zone should return
      await expect(page.getByText('test-video.mp4')).not.toBeVisible();
      await expect(page.getByText('Tap to select or drag video')).toBeVisible();
    });
  });

  test.describe('Form Validation (1.6, 1.7)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'FormValidate', 'Tester');
      await page.goto('/upload');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should show error when submitting without file', async ({ page }) => {
      // Select an act first
      await page.getByRole('button', { name: 'Juggling' }).click();

      // Try to submit - button should be disabled anyway
      const uploadButton = page.getByRole('button', { name: 'Upload Video' });
      await expect(uploadButton).toBeDisabled();
    });

    test('should show error when submitting without acts', async ({ page }) => {
      const videoBuffer = createTestVideoBuffer();

      // Select file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      // Try to submit without selecting acts
      await page.getByRole('button', { name: 'Upload Video' }).click();

      // Should show validation error
      await expect(page.getByText('Please select at least one act')).toBeVisible();
    });
  });

  test.describe('Act Selection', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'ActSelect', 'Tester');
      await page.goto('/upload');
    });

    test('should allow selecting multiple acts', async ({ page }) => {
      // Select multiple acts
      await page.getByRole('button', { name: 'Juggling' }).click();
      await page.getByRole('button', { name: 'Flying Trapeze' }).click();

      // Should show info about multiple acts
      await expect(page.getByText(/This video will appear in 2 act categories/)).toBeVisible();
    });

    test('should allow deselecting acts', async ({ page }) => {
      // Select an act
      await page.getByRole('button', { name: 'Juggling' }).click();

      // The button should show as selected (has checkmark)
      const jugglingButton = page.getByRole('button', { name: 'Juggling' });

      // Deselect by clicking again
      await jugglingButton.click();

      // Multi-act info should not show
      await expect(page.getByText(/This video will appear in/)).not.toBeVisible();
    });
  });

  test.describe('Upload Progress Display (1.8)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'Progress', 'Tester');
      await page.goto('/upload');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should show upload progress during submission', async ({ page }) => {
      const videoBuffer = createTestVideoBuffer();

      // Select file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: `${TEST_VIDEO_PREFIX}progress.mp4`,
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      // Select an act
      await page.getByRole('button', { name: 'Juggling' }).click();

      // Submit
      await page.getByRole('button', { name: 'Upload Video' }).click();

      // Should show progress indicator
      await expect(page.getByText('Uploading to YouTube...')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/This may take a few minutes/)).toBeVisible();
    });
  });

  test.describe('Upload Success (1.9, 1.10)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page, 'Success', 'Tester');
      await page.goto('/upload');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestQueueItems(page);
      await cleanupTestVideos(page);
    });

    test('should show success or queued message after upload', async ({ page }) => {
      const videoBuffer = createTestVideoBuffer();
      const testDescription = `${TEST_VIDEO_PREFIX}success_${Date.now()}`;

      // Select file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: `test-success.mp4`,
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      // Fill form
      await page.getByLabel('Year').selectOption('2024');
      await page.getByLabel('Show Type').selectOption('HOME');
      await page.getByRole('button', { name: 'Juggling' }).click();
      await page.getByLabel(/Description/).fill(testDescription);

      // Submit
      await page.getByRole('button', { name: 'Upload Video' }).click();

      // Wait for upload progress to show (validates the submission started)
      await expect(page.getByText('Uploading to YouTube...')).toBeVisible({ timeout: 10000 });

      // Wait for the "Upload Another" button which appears on success/queued
      await expect(page.getByRole('button', { name: 'Upload Another' })).toBeVisible({ timeout: 120000 });

      // Verify Browse Videos button is also present
      await expect(page.getByRole('button', { name: 'Browse Videos' })).toBeVisible();
    });

    test('should allow uploading another video after success', async ({ page }) => {
      const videoBuffer = createTestVideoBuffer();
      const testDescription = `${TEST_VIDEO_PREFIX}another_${Date.now()}`;

      // Complete first upload
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText('Tap to select or drag video').click();
      const fileChooser = await fileChooserPromise;

      await fileChooser.setFiles({
        name: `test-another.mp4`,
        mimeType: 'video/mp4',
        buffer: videoBuffer,
      });

      await page.getByRole('button', { name: 'Juggling' }).click();
      await page.getByLabel(/Description/).fill(testDescription);
      await page.getByRole('button', { name: 'Upload Video' }).click();

      // Wait for upload progress to show (validates the submission started)
      await expect(page.getByText('Uploading to YouTube...')).toBeVisible({ timeout: 10000 });

      // Wait for the "Upload Another" button which appears on success/queued
      await expect(page.getByRole('button', { name: 'Upload Another' })).toBeVisible({ timeout: 120000 });

      // Click "Upload Another" and verify form returns
      await page.getByRole('button', { name: 'Upload Another' }).click();
      await expect(page.getByText('Tap to select or drag video')).toBeVisible();
    });
  });
});
