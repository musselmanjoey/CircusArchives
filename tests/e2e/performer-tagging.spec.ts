import { test, expect, Page } from '@playwright/test';

// Prefix for test data - makes cleanup easy
const TEST_VIDEO_PREFIX = 'E2E_PERFORMER_TEST_';
const TEST_PERFORMER_PREFIX = 'E2EPerformer';

// Helper function to log in
async function loginAsTestUser(page: Page, firstName = 'Performer', lastName = 'Tester') {
  await page.goto('/login');
  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper function to clean up test videos
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get(`/api/videos?search=${TEST_VIDEO_PREFIX}&limit=100`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      for (const video of data.data) {
        if (video.title.startsWith(TEST_VIDEO_PREFIX)) {
          await page.request.delete(`/api/videos/${video.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

test.describe('Performer Tagging', () => {
  test.describe('Users API', () => {
    test.describe('GET /api/users', () => {
      test('should return users without query parameter', async ({ request }) => {
        const response = await request.get('/api/users');

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBeTruthy();
      });

      test('should filter users by first name', async ({ request }) => {
        const response = await request.get('/api/users?q=Performer');

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
        // Results should contain the search term (if any users match)
      });

      test('should be case insensitive', async ({ page, request }) => {
        // First, create a user to search for
        await loginAsTestUser(page, 'SearchTest', 'User');

        // Search with different cases
        const lowercase = await request.get('/api/users?q=searchtest');
        const uppercase = await request.get('/api/users?q=SEARCHTEST');
        const mixed = await request.get('/api/users?q=SeArChTeSt');

        expect(lowercase.ok()).toBeTruthy();
        expect(uppercase.ok()).toBeTruthy();
        expect(mixed.ok()).toBeTruthy();

        const lowercaseData = await lowercase.json();
        const uppercaseData = await uppercase.json();
        const mixedData = await mixed.json();

        // All should return results (the user we created)
        expect(lowercaseData.data.length).toBeGreaterThan(0);
        expect(uppercaseData.data.length).toBeGreaterThan(0);
        expect(mixedData.data.length).toBeGreaterThan(0);
      });

      test('should return empty array for no matches', async ({ request }) => {
        const response = await request.get('/api/users?q=zzzznonexistentuser12345');

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
        expect(data.data).toEqual([]);
      });
    });

    test.describe('POST /api/users', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.post('/api/users', {
          data: {
            firstName: 'Test',
            lastName: 'User',
          },
        });

        expect(response.status()).toBe(401);
      });

      test('should create new user when authenticated', async ({ page }) => {
        await loginAsTestUser(page);

        const uniqueName = `${TEST_PERFORMER_PREFIX}${Date.now()}`;
        const response = await page.request.post('/api/users', {
          data: {
            firstName: uniqueName,
            lastName: 'TestUser',
          },
        });

        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data.data).toHaveProperty('id');
        expect(data.data.firstName).toBe(uniqueName);
        expect(data.data.lastName).toBe('TestUser');
      });

      test('should return existing user if name already exists', async ({ page }) => {
        await loginAsTestUser(page, 'Existing', 'UserTest');

        // Try to create a user with the same name as our logged-in user
        const response = await page.request.post('/api/users', {
          data: {
            firstName: 'Existing',
            lastName: 'UserTest',
          },
        });

        // Should return 200 (existing user) instead of 201 (created)
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data).toHaveProperty('id');
        expect(data.data.firstName).toBe('Existing');
        expect(data.data.lastName).toBe('UserTest');
      });

      test('should require firstName', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.post('/api/users', {
          data: {
            lastName: 'OnlyLast',
          },
        });

        expect(response.status()).toBe(400);
      });

      test('should require lastName', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.post('/api/users', {
          data: {
            firstName: 'OnlyFirst',
          },
        });

        expect(response.status()).toBe(400);
      });
    });
  });

  test.describe('Video with Performers API', () => {
    test('should create video with performers', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a performer to tag
      const performerName = `${TEST_PERFORMER_PREFIX}${Date.now()}`;
      const userResponse = await page.request.post('/api/users', {
        data: { firstName: performerName, lastName: 'Tagged' },
      });
      const userData = await userResponse.json();
      const performerId = userData.data.id;

      // Create video with performer
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}${Date.now()}`,
          year: 2024,
          actId: actId,
          performerIds: [performerId],
        },
      });

      expect(videoResponse.status()).toBe(201);

      const videoData = await videoResponse.json();
      expect(videoData.data).toHaveProperty('performers');
      expect(videoData.data.performers.length).toBe(1);
      expect(videoData.data.performers[0].user.firstName).toBe(performerName);

      // Cleanup
      await page.request.delete(`/api/videos/${videoData.data.id}`);
    });

    test('should create video without performers', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create video without performers
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}${Date.now()}`,
          year: 2024,
          actId: actId,
        },
      });

      expect(videoResponse.status()).toBe(201);

      const videoData = await videoResponse.json();
      // Performers should be empty or undefined
      expect(videoData.data.performers?.length ?? 0).toBe(0);

      // Cleanup
      await page.request.delete(`/api/videos/${videoData.data.id}`);
    });

    test('should create video with empty performers array', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create video with empty performers
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}${Date.now()}`,
          year: 2024,
          actId: actId,
          performerIds: [],
        },
      });

      expect(videoResponse.status()).toBe(201);

      // Cleanup
      const videoData = await videoResponse.json();
      await page.request.delete(`/api/videos/${videoData.data.id}`);
    });

    test('should include performers in video detail response', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a performer
      const performerName = `${TEST_PERFORMER_PREFIX}Detail${Date.now()}`;
      const userResponse = await page.request.post('/api/users', {
        data: { firstName: performerName, lastName: 'DetailTest' },
      });
      const userData = await userResponse.json();
      const performerId = userData.data.id;

      // Create video with performer
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}${Date.now()}`,
          year: 2024,
          actId: actId,
          performerIds: [performerId],
        },
      });
      const videoData = await videoResponse.json();
      const videoId = videoData.data.id;

      // Fetch video detail
      const detailResponse = await page.request.get(`/api/videos/${videoId}`);
      expect(detailResponse.ok()).toBeTruthy();

      const detailData = await detailResponse.json();
      expect(detailData.data).toHaveProperty('performers');
      expect(detailData.data.performers.length).toBe(1);
      expect(detailData.data.performers[0]).toHaveProperty('user');
      expect(detailData.data.performers[0].user.firstName).toBe(performerName);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });
  });

  test.describe('Performer Selector UI', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto('/submit');
    });

    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('should display performers field on submit page', async ({ page }) => {
      // Look for the performers field
      await expect(page.getByText('Performers (optional)')).toBeVisible();
      await expect(page.getByPlaceholder('Search for performers...')).toBeVisible();
    });

    test('should show search results when typing', async ({ page }) => {
      // Type in the performer search
      const searchInput = page.getByPlaceholder('Search for performers...');
      await searchInput.fill('Test');

      // Wait for debounce and results
      await page.waitForTimeout(500);

      // Should show dropdown with results or "no results" message
      const dropdown = page.locator('[class*="absolute"]').filter({ hasText: /(performer|Add new|No performers)/i });
      await expect(dropdown).toBeVisible({ timeout: 5000 });
    });

    test('should show "Add new performer" option when no results', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search for performers...');
      await searchInput.fill('zzzznonexistentname12345');

      // Wait for search
      await page.waitForTimeout(500);

      // Should show "Add new performer" option
      await expect(page.getByText(/Add.*new.*performer/i)).toBeVisible({ timeout: 5000 });
    });

    test('should select performer from dropdown', async ({ page }) => {
      // First ensure there's a user to find
      const timestamp = Date.now();
      await page.request.post('/api/users', {
        data: { firstName: `Selectable${timestamp}`, lastName: 'Performer' },
      });

      const searchInput = page.getByPlaceholder('Search for performers...');
      await searchInput.fill(`Selectable${timestamp}`);

      // Wait for results
      await page.waitForTimeout(500);

      // Click on the result in the dropdown
      await page.locator('button').filter({ hasText: `Selectable${timestamp} Performer` }).click();

      // Should show as a chip/tag with bg-blue-100 class (from PerformerSelector.tsx)
      await expect(page.locator('.bg-blue-100').filter({ hasText: `Selectable${timestamp} Performer` })).toBeVisible();
    });

    test('should remove selected performer', async ({ page }) => {
      // Add a performer first
      const timestamp = Date.now();
      await page.request.post('/api/users', {
        data: { firstName: `Removable${timestamp}`, lastName: 'Performer' },
      });

      const searchInput = page.getByPlaceholder('Search for performers...');
      await searchInput.fill(`Removable${timestamp}`);
      await page.waitForTimeout(500);
      await page.locator('button').filter({ hasText: `Removable${timestamp} Performer` }).click();

      // Verify it's selected (bg-blue-100 is the chip class)
      const chip = page.locator('.bg-blue-100').filter({ hasText: `Removable${timestamp} Performer` });
      await expect(chip).toBeVisible();

      // Click the X/remove button inside the chip
      await chip.locator('button').click();

      // Should no longer be visible
      await expect(chip).not.toBeVisible();
    });

    test('should add new performer via form', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search for performers...');
      await searchInput.fill('zzzzBrandNewPerformer12345');
      await page.waitForTimeout(500);

      // Click "Add new performer"
      await page.getByText('+ Add new performer').click();

      // Fill in the new performer form
      const timestamp = Date.now();
      await page.locator('input[placeholder="First name"]').fill(`BrandNew${timestamp}`);
      await page.locator('input[placeholder="Last name"]').fill('Performer');

      // Click Add button
      await page.getByRole('button', { name: 'Add' }).click();

      // Should show as a chip (bg-blue-100)
      await expect(page.locator('.bg-blue-100').filter({ hasText: `BrandNew${timestamp} Performer` })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Video Detail Page Performers', () => {
    test('should display performers on video detail page', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a performer
      const performerName = `${TEST_PERFORMER_PREFIX}Display${Date.now()}`;
      const userResponse = await page.request.post('/api/users', {
        data: { firstName: performerName, lastName: 'Shown' },
      });
      const userData = await userResponse.json();
      const performerId = userData.data.id;

      // Create video with performer
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}Display${Date.now()}`,
          year: 2024,
          actId: actId,
          performerIds: [performerId],
        },
      });
      const videoData = await videoResponse.json();
      const videoId = videoData.data.id;

      // Navigate to video detail page
      await page.goto(`/videos/${videoId}`);

      // Should show "Performers" section
      await expect(page.getByText('Performers')).toBeVisible();

      // Should show the performer name
      await expect(page.getByText(`${performerName} Shown`)).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should not show performers section when video has no performers', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create video without performers
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}NoPerformers${Date.now()}`,
          year: 2024,
          actId: actId,
        },
      });
      const videoData = await videoResponse.json();
      const videoId = videoData.data.id;

      // Navigate to video detail page
      await page.goto(`/videos/${videoId}`);

      // Wait for page to load
      await expect(page.locator('iframe')).toBeVisible({ timeout: 10000 });

      // Should NOT show purple performer chips (bg-purple-100 class)
      // The "Performers" heading only shows when performers exist per the code:
      // {video.performers && video.performers.length > 0 && (...)}
      const performerChips = page.locator('.bg-purple-100');
      await expect(performerChips).toHaveCount(0);

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });

    test('should display multiple performers', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act ID
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create multiple performers
      const timestamp = Date.now();
      const performer1Response = await page.request.post('/api/users', {
        data: { firstName: `${TEST_PERFORMER_PREFIX}Multi1`, lastName: `Test${timestamp}` },
      });
      const performer2Response = await page.request.post('/api/users', {
        data: { firstName: `${TEST_PERFORMER_PREFIX}Multi2`, lastName: `Test${timestamp}` },
      });
      const performer3Response = await page.request.post('/api/users', {
        data: { firstName: `${TEST_PERFORMER_PREFIX}Multi3`, lastName: `Test${timestamp}` },
      });

      const performer1 = await performer1Response.json();
      const performer2 = await performer2Response.json();
      const performer3 = await performer3Response.json();

      // Create video with all three performers
      const videoResponse = await page.request.post('/api/videos', {
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: `${TEST_VIDEO_PREFIX}MultiPerformer${timestamp}`,
          year: 2024,
          actId: actId,
          performerIds: [performer1.data.id, performer2.data.id, performer3.data.id],
        },
      });
      const videoData = await videoResponse.json();
      const videoId = videoData.data.id;

      // Navigate to video detail page
      await page.goto(`/videos/${videoId}`);

      // Should show all three performers
      await expect(page.getByText(`${TEST_PERFORMER_PREFIX}Multi1 Test${timestamp}`)).toBeVisible();
      await expect(page.getByText(`${TEST_PERFORMER_PREFIX}Multi2 Test${timestamp}`)).toBeVisible();
      await expect(page.getByText(`${TEST_PERFORMER_PREFIX}Multi3 Test${timestamp}`)).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${videoId}`);
    });
  });

  test.describe('Full E2E Scenarios', () => {
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('should submit video with existing performer via UI', async ({ page }) => {
      await loginAsTestUser(page);

      // Create a performer to select
      const performerName = `${TEST_PERFORMER_PREFIX}UI${Date.now()}`;
      await page.request.post('/api/users', {
        data: { firstName: performerName, lastName: 'UITest' },
      });

      // Go to submit page
      await page.goto('/submit');

      // Fill in video details
      await page.locator('#youtubeUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.locator('#title').fill(`${TEST_VIDEO_PREFIX}UISubmit${Date.now()}`);

      // Get act options and select first one
      const actSelect = page.locator('#actId');
      await actSelect.selectOption({ index: 1 });

      // Search and select performer
      const performerSearch = page.getByPlaceholder('Search for performers...');
      await performerSearch.fill(performerName);
      await page.waitForTimeout(500);
      await page.getByText(`${performerName} UITest`).click();

      // Submit form
      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Wait for success
      await expect(page.getByText('Video submitted successfully!')).toBeVisible({ timeout: 10000 });
    });

    test('should submit video with new performer via UI', async ({ page }) => {
      await loginAsTestUser(page);

      // Go to submit page
      await page.goto('/submit');

      // Fill in video details
      await page.locator('#youtubeUrl').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const videoTitle = `${TEST_VIDEO_PREFIX}NewPerf${Date.now()}`;
      await page.locator('#title').fill(videoTitle);

      // Select act
      const actSelect = page.locator('#actId');
      await actSelect.selectOption({ index: 1 });

      // Search for non-existent performer
      const performerSearch = page.getByPlaceholder('Search for performers...');
      await performerSearch.fill('zzzzNonExistentUnique12345');
      await page.waitForTimeout(500);

      // Click "Add new performer"
      await page.getByText('+ Add new performer').click();

      // Fill new performer details
      const newFirstName = `NewPerf${Date.now()}`;
      await page.locator('input[placeholder="First name"]').fill(newFirstName);
      await page.locator('input[placeholder="Last name"]').fill('Created');

      // Add the performer
      await page.getByRole('button', { name: 'Add' }).click();

      // Wait for performer to be added (bg-blue-100 is the chip class)
      await expect(page.locator('.bg-blue-100').filter({ hasText: `${newFirstName} Created` })).toBeVisible({ timeout: 5000 });

      // Submit form
      await page.getByRole('button', { name: 'Submit Video' }).click();

      // Wait for success
      await expect(page.getByText('Video submitted successfully!')).toBeVisible({ timeout: 10000 });
    });
  });
});
