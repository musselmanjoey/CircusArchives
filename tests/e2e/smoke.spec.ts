import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 *
 * These tests verify that critical functionality works after deployment.
 * They should be fast and test the most important user paths.
 * Run these tests against production to verify deploys.
 */

test.describe('Smoke Tests', () => {
  test.describe('Critical Pages Load', () => {
    test('home page loads', async ({ page }) => {
      const response = await page.goto('/');

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Circus/i);
    });

    test('videos page loads', async ({ page }) => {
      const response = await page.goto('/videos');

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Browse Videos' })).toBeVisible();
    });

    test('login page loads', async ({ page }) => {
      const response = await page.goto('/login');

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Welcome to the Archive' })).toBeVisible();
    });

    test('submit page loads (shows auth prompt)', async ({ page }) => {
      const response = await page.goto('/submit');

      expect(response?.status()).toBe(200);
      // Should show either the form (if authenticated) or the auth prompt
      const heading = page.getByRole('heading', { name: /(Submit a Video|Sign In Required)/ });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('API Health', () => {
    test('acts API responds', async ({ request }) => {
      const response = await request.get('/api/acts');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
    });

    test('videos API responds', async ({ request }) => {
      const response = await request.get('/api/videos');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
    });

    test('auth providers API responds', async ({ request }) => {
      const response = await request.get('/api/auth/providers');

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Core User Flows', () => {
    test('can browse and filter videos', async ({ page }) => {
      await page.goto('/videos');

      // Search bar should be functional
      const searchInput = page.getByPlaceholder('Search videos...');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');

      // Act filter should be functional
      const actFilter = page.getByRole('combobox').first();
      await expect(actFilter).toBeVisible();
    });

    test('can complete login flow', async ({ page }) => {
      await page.goto('/login');

      // Fill in credentials using label selectors
      await page.getByLabel('First Name').fill('Smoke');
      await page.getByLabel('Last Name').fill('Test');

      // Submit should be enabled
      const submitButton = page.getByRole('button', { name: 'Continue' });
      await expect(submitButton).toBeEnabled();

      // Submit and wait for session to be established
      await submitButton.click();

      // Verify logged in state (proves session is active)
      await expect(page.getByRole('navigation').getByText('Smoke Test')).toBeVisible({
        timeout: 15000,
      });

      // Should be on home page
      await expect(page).toHaveURL('/');
    });

    test('navigation works correctly', async ({ page }) => {
      await page.goto('/');

      // Navigate to videos - use exact match to avoid "Browse Videos"
      await page.getByRole('navigation').getByRole('link', { name: 'Browse', exact: true }).click();
      await expect(page).toHaveURL('/videos');

      // Navigate to submit
      await page.getByRole('navigation').getByRole('link', { name: 'Submit Video' }).click();
      await expect(page).toHaveURL('/submit');
    });
  });

  test.describe('Error Handling', () => {
    test('404 page works for invalid routes', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');

      // Next.js returns 404 for invalid routes
      expect(response?.status()).toBe(404);
    });

    test('API returns 404 for non-existent video', async ({ request }) => {
      const response = await request.get('/api/videos/non-existent-id-12345');

      expect(response.status()).toBe(404);
    });
  });

  test.describe('Performance', () => {
    test('home page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('videos page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/videos');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
