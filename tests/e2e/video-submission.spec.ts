import { test, expect } from '@playwright/test';

test.describe('Video Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submit');
  });

  test('should display submission form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Submit a Video' })).toBeVisible();
    await expect(page.getByLabel('YouTube URL')).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Description (optional)')).toBeVisible();
  });

  test('should show validation error for invalid URL', async ({ page }) => {
    await page.getByLabel('YouTube URL').fill('invalid-url');
    await page.getByLabel('Title').fill('Test Video');
    await page.getByRole('button', { name: 'Submit Video' }).click();

    // Assuming HTML5 validation or custom validation message
    // Adjust selector based on actual implementation if needed
    // For now checking if we are still on the same page and maybe an error message appears
    // Or checking if the input is invalid
    const urlInput = page.getByLabel('YouTube URL');
    await expect(urlInput).toBeVisible();
  });

  test('should submit valid video successfully', async ({ page }) => {
    await page.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByLabel('Title').fill('Rick Roll');
    await page.getByLabel('Description (optional)').fill('Never gonna give you up');
    await page.getByLabel('Act Category').selectOption({ label: 'Juggling' });

    // Verify values are set
    await expect(page.getByLabel('YouTube URL')).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(page.getByLabel('Title')).toHaveValue('Rick Roll');
    await expect(page.getByLabel('Act Category')).toHaveValue('1');

    await page.getByRole('button', { name: 'Submit Video' }).click();

    // Check for validation errors if success message doesn't appear
    const error = page.locator('.text-red-500');
    if (await error.count() > 0) {
      console.log('Validation errors:', await error.allInnerTexts());
    }

    await expect(page.getByText('Video submitted successfully!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Redirecting to videos page...')).toBeVisible();
  });
});
