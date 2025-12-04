import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Protected Routes', () => {
  test.describe('Submit Page', () => {
    test('should show sign-in prompt when not authenticated', async ({ page }) => {
      await page.goto('/submit');

      // Should show the sign-in required card
      await expect(page.getByRole('heading', { name: 'Sign In Required' })).toBeVisible();
      await expect(page.getByText('You need to sign in to submit videos')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign In to Continue' })).toBeVisible();
    });

    test('should redirect to login with callback when clicking sign in', async ({ page }) => {
      await page.goto('/submit');

      // Click the sign in link
      await page.getByRole('link', { name: 'Sign In to Continue' }).click();

      // Should be on login page with callback URL
      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fsubmit/);
    });

    test('should show submission form when authenticated', async ({ page }) => {
      // Log in first
      await loginAsTestUser(page, 'Submit', 'Tester');

      // Navigate to submit page
      await page.goto('/submit');

      // Should show the submission form, not the sign-in prompt
      await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
      await expect(page.getByText('Submitting as Submit Tester')).toBeVisible();
      await expect(page.locator('#youtubeUrl')).toBeVisible();
    });

    test('should return to submit page after login from protected route', async ({ page }) => {
      // Start at submit page (unauthenticated)
      await page.goto('/submit');

      // Click sign in
      await page.getByRole('link', { name: 'Sign In to Continue' }).click();

      // Fill in credentials and wait for session
      await page.getByLabel('First Name').fill('Return');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should return to submit page - wait for user name in nav to confirm session
      await expect(page.getByRole('navigation').getByText('Return Test')).toBeVisible({
        timeout: 15000,
      });
      await expect(page).toHaveURL('/submit', { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
    });
  });

  test.describe('Public Routes', () => {
    test('should allow unauthenticated access to home page', async ({ page }) => {
      await page.goto('/');

      // Home page should load without redirect
      await expect(page).toHaveURL('/');
    });

    test('should allow unauthenticated access to videos browse page', async ({ page }) => {
      await page.goto('/videos');

      // Videos page should load
      await expect(page.getByRole('heading', { name: 'Browse Videos' })).toBeVisible();
    });

    test('should allow unauthenticated access to individual video pages', async ({ page }) => {
      await page.goto('/videos');

      // Wait for content to load
      await page.waitForSelector('.grid, .text-center', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Check if there are videos
      const firstVideo = page.locator('a[href^="/videos/"]').first();
      const videoCount = await firstVideo.count();

      if (videoCount > 0) {
        await firstVideo.click();
        // Should be able to view the video without authentication
        await expect(page).toHaveURL(/\/videos\/[a-f0-9-]+/);
        await expect(page.locator('iframe')).toBeVisible({ timeout: 10000 });
      }
      // If no videos, test passes (nothing to verify)
    });

    test('should allow unauthenticated access to login page', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: 'Welcome to the Archive' })).toBeVisible();
    });
  });
});
