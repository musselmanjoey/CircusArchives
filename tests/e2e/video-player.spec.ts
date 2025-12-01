import { test, expect } from '@playwright/test';

test.describe('Video Player', () => {
    // Since we don't have a guaranteed video ID, we might need to navigate from the list
    // or mock the route. For now, let's try navigating from the list if possible,
    // or just check a hypothetical URL if we know the ID structure.

    test('should navigate to video details', async ({ page }) => {
        await page.goto('/videos');

        // If there are videos, click the first one
        // This requires at least one video to be present
        const firstVideo = page.locator('a[href^="/videos/"]').first();

        if (await firstVideo.count() > 0) {
            await firstVideo.click();
            await expect(page).toHaveURL(/\/videos\/\d+/);
            await expect(page.locator('iframe')).toBeVisible(); // YouTube embed
        } else {
            test.skip('No videos available to test player');
        }
    });
});
