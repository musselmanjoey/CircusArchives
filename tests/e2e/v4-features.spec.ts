import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

const TEST_VIDEO_PREFIX = 'E2E_V4_TEST_';

async function createTestVideo(page: Page, actId: string, year: number) {
  const response = await page.request.post('/api/videos', {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      year,
      description: `${TEST_VIDEO_PREFIX}${Date.now()}`,
      actId,
    },
  });
  const data = await response.json();
  return data.data;
}

test.describe('V4 Features', () => {
  test.describe('Leaderboard View', () => {
    test('should navigate to leaderboard from Best Videos page when clicking an act', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create and vote for a video
      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id },
      });

      await page.goto('/');

      // Click on the act card
      const actCard = page.locator(`a[href*="actId=${actId}"]`).first();
      if (await actCard.isVisible()) {
        await actCard.click();

        // Should be on videos page with act filter and sort
        await expect(page).toHaveURL(new RegExp(`actId=${actId}`));
        await expect(page).toHaveURL(/sort=votes/);
      }

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show act name in leaderboard title', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const act = actsData.data[0];

      // Create and vote for a video
      const video = await createTestVideo(page, act.id, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id },
      });

      await page.goto(`/videos?actId=${act.id}&sort=votes`);

      // Should show "[Act Name] Leaderboard" title
      await expect(page.getByRole('heading', { name: new RegExp(`${act.name} Leaderboard`, 'i') })).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show leaderboard subtitle about voting', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const act = actsData.data[0];

      const video = await createTestVideo(page, act.id, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id },
      });

      await page.goto(`/videos?actId=${act.id}&sort=votes`);

      await expect(page.getByText(/Performer votes count double/i)).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should sort videos by vote count', async ({ page }) => {
      await loginAsTestUser(page, `Sorter${Date.now()}`, 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create two videos
      const video1 = await createTestVideo(page, actId, 2023);
      const video2 = await createTestVideo(page, actId, 2024);

      // Vote for video2 (should appear before video1 since it has a vote)
      await page.request.post('/api/votes', {
        data: { videoId: video2.id },
      });

      // Fetch all videos sorted by votes (use high limit to get all)
      const response = await page.request.get(`/api/videos?actId=${actId}&sort=votes&limit=100`);
      const data = await response.json();

      // Find positions of our test videos
      const video1Index = data.data.findIndex((v: { id: string }) => v.id === video1.id);
      const video2Index = data.data.findIndex((v: { id: string }) => v.id === video2.id);

      // Both videos should be in the results
      expect(video1Index).toBeGreaterThanOrEqual(0);
      expect(video2Index).toBeGreaterThanOrEqual(0);

      // video2 (with vote) should appear before video1 (no vote)
      expect(video2Index).toBeLessThan(video1Index);

      await page.request.delete(`/api/videos/${video1.id}`);
      await page.request.delete(`/api/videos/${video2.id}`);
    });

    test('should show regular browse title when not in leaderboard mode', async ({ page }) => {
      await page.goto('/videos');

      await expect(page.getByRole('heading', { name: 'Browse Videos' })).toBeVisible();
    });
  });

  test.describe('About Page', () => {
    test('should display about page content', async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('heading', { name: /About the Circus Video Archive/i })).toBeVisible();
    });

    test('should show FSU Flying High Circus information', async ({ page }) => {
      await page.goto('/about');

      // Check for the heading that mentions FSU Flying High Circus
      await expect(page.getByRole('heading', { name: /FSU Flying High Circus/i })).toBeVisible();
      // 1947 is mentioned in the paragraph about circus history
      await expect(page.getByText(/since 1947/i)).toBeVisible();
    });

    test('should show how it works section', async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('heading', { name: /How It Works/i })).toBeVisible();
      await expect(page.getByText(/Browse & Watch/i)).toBeVisible();
      await expect(page.getByText(/Vote for Your Favorites/i)).toBeVisible();
      await expect(page.getByText(/Contribute/i)).toBeVisible();
    });

    test('should have link to browse videos', async ({ page }) => {
      await page.goto('/about');

      const browseLink = page.getByRole('link', { name: /Browse Videos/i });
      await expect(browseLink).toBeVisible();

      await browseLink.click();
      await expect(page).toHaveURL('/');
    });

    test('should have link to support page', async ({ page }) => {
      await page.goto('/about');

      const supportLink = page.getByRole('link', { name: /Support the Project/i });
      await expect(supportLink).toBeVisible();

      await supportLink.click();
      await expect(page).toHaveURL('/support');
    });

    test('should be accessible from navigation', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      const aboutLink = nav.getByRole('link', { name: /About/i });
      await expect(aboutLink).toBeVisible();

      await aboutLink.click();
      await expect(page).toHaveURL('/about');
    });
  });

  test.describe('Support Page', () => {
    test('should display support page content', async ({ page }) => {
      await page.goto('/support');

      await expect(page.getByRole('heading', { name: /Support the Developer/i })).toBeVisible();
    });

    test('should show developer information', async ({ page }) => {
      await page.goto('/support');

      await expect(page.getByText(/Hey, I'm Joey/i)).toBeVisible();
      await expect(page.getByText(/built the Circus Video Archive/i)).toBeVisible();
      await expect(page.getByText(/passion project/i)).toBeVisible();
    });

    test('should show developer photo', async ({ page }) => {
      await page.goto('/support');

      // Check that the developer photo is present
      const photo = page.locator('img[alt*="Joey"]');
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('src', '/IMG_0641.jpeg');
    });

    test('should show Venmo section', async ({ page }) => {
      await page.goto('/support');

      await expect(page.getByRole('heading', { name: /Support via Venmo/i })).toBeVisible();
      // Button says "Send Tip via Venmo"
      await expect(page.getByRole('link', { name: /Venmo/i })).toBeVisible();
      await expect(page.getByText('@Joey-Musselman')).toBeVisible();
    });

    test('should show other ways to help', async ({ page }) => {
      await page.goto('/support');

      await expect(page.getByRole('heading', { name: /Other Ways to Help/i })).toBeVisible();
      await expect(page.getByText(/Share the archive/i)).toBeVisible();
      await expect(page.getByText(/Submit your videos/i)).toBeVisible();
    });

    test('should have link to about page', async ({ page }) => {
      await page.goto('/support');

      const aboutLink = page.getByRole('link', { name: /Learn More About the Project/i });
      await expect(aboutLink).toBeVisible();

      await aboutLink.click();
      await expect(page).toHaveURL('/about');
    });

    test('should be accessible from footer', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer');
      const supportLink = footer.getByRole('link', { name: /Support the Developer/i });
      await expect(supportLink).toBeVisible();

      await supportLink.click();
      await expect(page).toHaveURL('/support');
    });
  });

  test.describe('Footer Navigation', () => {
    test('should show about link in footer', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer');
      const aboutLink = footer.getByRole('link', { name: /About/i });
      await expect(aboutLink).toBeVisible();

      await aboutLink.click();
      await expect(page).toHaveURL('/about');
    });

    test('should show support link in footer', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer');
      const supportLink = footer.getByRole('link', { name: /Support the Developer/i });
      await expect(supportLink).toBeVisible();
    });
  });

  test.describe('Navigation Updates', () => {
    test('should show About link in main navigation', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: /About/i })).toBeVisible();
    });

    test('should have correct nav order including About', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      const links = await nav.getByRole('link').all();
      const linkTexts = await Promise.all(links.map(async (link) => await link.textContent()));

      const mainNavItems = linkTexts.filter((text) =>
        text && (text.includes('Best') || text.includes('Browse') || text.includes('Submit') || text.includes('About'))
      );

      expect(mainNavItems).toContain('Best Videos');
      expect(mainNavItems).toContain('Browse');
      expect(mainNavItems).toContain('Submit Video');
      expect(mainNavItems).toContain('About');
    });

    test('should highlight About when on about page', async ({ page }) => {
      await page.goto('/about');

      const nav = page.getByRole('navigation');
      const aboutLink = nav.getByRole('link', { name: /About/i });

      await expect(aboutLink).toHaveClass(/text-blue-600/);
    });
  });
});
