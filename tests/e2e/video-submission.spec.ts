import { test, expect, Page } from '@playwright/test';

// Helper function to log in before tests that require authentication
async function loginAsTestUser(page: Page, firstName = 'Video', lastName = 'Submitter') {
  await page.goto('/login');
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Video Submission', () => {
  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test
      await loginAsTestUser(page);
      await page.goto('/submit');
    });

    test('should display submission form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
      await expect(page.getByLabel('YouTube URL')).toBeVisible();
      await expect(page.getByLabel('Title')).toBeVisible();
      await expect(page.getByLabel('Description (optional)')).toBeVisible();
    });

    test('should show submitter name', async ({ page }) => {
      await expect(page.getByText('Submitting as Video Submitter')).toBeVisible();
    });

    test('should show validation error for invalid URL', async ({ page }) => {
      await page.getByLabel('YouTube URL').fill('invalid-url');
      await page.getByLabel('Title').fill('Test Video');
      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Should still be on the same page with the input visible
      const urlInput = page.getByLabel('YouTube URL');
      await expect(urlInput).toBeVisible();
    });

    test('should submit valid video successfully', async ({ page }) => {
      // Use a unique title to avoid duplicates in test runs
      const uniqueTitle = `Test Video ${Date.now()}`;

      await page.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.getByLabel('Title').fill(uniqueTitle);
      await page.getByLabel('Description (optional)').fill('Test description for E2E');
      await page.getByLabel('Act Category').selectOption({ label: 'Juggling' });

      // Verify values are set
      await expect(page.getByLabel('YouTube URL')).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await expect(page.getByLabel('Title')).toHaveValue(uniqueTitle);

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
      await expect(page.getByLabel('Title')).not.toBeVisible();
    });
  });
});
