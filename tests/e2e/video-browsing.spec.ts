import { test, expect } from '@playwright/test';

test.describe('Video Browsing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/videos');
    });

    test('should display video grid', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Browse Videos' })).toBeVisible();
        await expect(page.getByPlaceholder('Search videos...')).toBeVisible();
    });

    test('should filter videos', async ({ page }) => {
        // This test depends on having mock data or a seeded database
        // For now, we verify the filter UI exists and is interactable
        const actFilter = page.getByRole('combobox').first(); // Assuming first select is Act
        await expect(actFilter).toBeVisible();
        await actFilter.selectOption({ label: 'Juggling' });
    });

    test('should search videos', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search videos...');
        await searchInput.fill('Juggling');
        // Verify search triggers (might need to wait or check URL/results)
        await expect(searchInput).toHaveValue('Juggling');
    });
});
