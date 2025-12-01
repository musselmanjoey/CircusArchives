import { test, expect } from '@playwright/test';

test.describe('Video Player', () => {
    test('should navigate to video details', async ({ page }) => {
        await page.goto('/videos');

        // Wait for loading to complete - either videos appear or "No videos found" message
        await page.waitForSelector('.grid, .text-center', { timeout: 10000 });

        // Wait a bit more for the async fetch to complete
        await page.waitForTimeout(1000);

        // Check if there are video links after content has loaded
        const firstVideo = page.locator('a[href^="/videos/"]').first();
        const videoCount = await firstVideo.count();

        if (videoCount > 0) {
            await firstVideo.click();
            // Video IDs are UUIDs, not numeric
            await expect(page).toHaveURL(/\/videos\/[a-f0-9-]+/);
            await expect(page.locator('iframe')).toBeVisible({ timeout: 10000 }); // YouTube embed
        } else {
            test.skip('No videos available to test player');
        }
    });
});
