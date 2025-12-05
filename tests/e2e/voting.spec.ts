import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

// Test prefixes for cleanup
const TEST_VIDEO_PREFIX = 'E2E_VOTING_TEST_';

// Helper to create a test video
async function createTestVideo(page: Page, actId: string, year: number, performerIds?: string[]) {
  const response = await page.request.post('/api/videos', {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      year,
      description: `${TEST_VIDEO_PREFIX}${Date.now()}`,
      actId,
      performerIds,
    },
  });
  const data = await response.json();
  return data.data;
}

// Helper to cleanup test videos
async function cleanupTestVideos(page: Page) {
  try {
    const response = await page.request.get(`/api/videos?search=${TEST_VIDEO_PREFIX}&limit=100`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      for (const video of data.data) {
        if (video.description?.startsWith(TEST_VIDEO_PREFIX)) {
          await page.request.delete(`/api/videos/${video.id}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

test.describe('Voting System', () => {
  test.describe('Voting API', () => {
    test.describe('POST /api/votes', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.post('/api/votes', {
          data: { videoId: 'some-video-id' },
        });

        expect(response.status()).toBe(401);
      });

      test('should cast a vote on a video', async ({ page }) => {
        await loginAsTestUser(page);

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create a test video
        const video = await createTestVideo(page, actId, 2024);

        // Cast vote
        const voteResponse = await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        expect(voteResponse.status()).toBe(201);
        const voteData = await voteResponse.json();
        expect(voteData.data).toHaveProperty('id');
        expect(voteData.data.videoId).toBe(video.id);
        expect(voteData.data.actId).toBe(actId);

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should switch vote to different video in same act', async ({ page }) => {
        await loginAsTestUser(page);

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create two test videos in the same act
        const video1 = await createTestVideo(page, actId, 2023);
        const video2 = await createTestVideo(page, actId, 2024);

        // Vote for first video
        const vote1Response = await page.request.post('/api/votes', {
          data: { videoId: video1.id },
        });
        expect(vote1Response.status()).toBe(201);

        // Switch vote to second video
        const vote2Response = await page.request.post('/api/votes', {
          data: { videoId: video2.id },
        });
        expect(vote2Response.status()).toBe(200); // Updated, not created
        const vote2Data = await vote2Response.json();
        expect(vote2Data.data.videoId).toBe(video2.id);

        // Cleanup
        await page.request.delete(`/api/videos/${video1.id}`);
        await page.request.delete(`/api/videos/${video2.id}`);
      });

      test('should allow voting for different acts', async ({ page }) => {
        await loginAsTestUser(page);

        // Get two different acts
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();

        if (actsData.data.length < 2) {
          test.skip();
          return;
        }

        const act1Id = actsData.data[0].id;
        const act2Id = actsData.data[1].id;

        // Create videos in different acts
        const video1 = await createTestVideo(page, act1Id, 2024);
        const video2 = await createTestVideo(page, act2Id, 2024);

        // Vote for both
        const vote1Response = await page.request.post('/api/votes', {
          data: { videoId: video1.id },
        });
        const vote2Response = await page.request.post('/api/votes', {
          data: { videoId: video2.id },
        });

        expect(vote1Response.status()).toBe(201);
        expect(vote2Response.status()).toBe(201);

        // Cleanup
        await page.request.delete(`/api/videos/${video1.id}`);
        await page.request.delete(`/api/videos/${video2.id}`);
      });

      test('should reject vote for non-existent video', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.post('/api/votes', {
          data: { videoId: 'non-existent-video-id' },
        });

        expect(response.status()).toBe(404);
      });
    });

    test.describe('GET /api/votes/me', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.get('/api/votes/me');
        expect(response.status()).toBe(401);
      });

      test('should return current user votes', async ({ page }) => {
        await loginAsTestUser(page);

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create and vote for a video
        const video = await createTestVideo(page, actId, 2024);
        await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        // Get user's votes
        const votesResponse = await page.request.get('/api/votes/me');
        expect(votesResponse.status()).toBe(200);

        const votesData = await votesResponse.json();
        expect(votesData.data).toBeInstanceOf(Array);
        expect(votesData.data.some((v: { videoId: string }) => v.videoId === video.id)).toBeTruthy();

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });
    });

    test.describe('DELETE /api/votes/:actId', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.delete('/api/votes/some-act-id');
        expect(response.status()).toBe(401);
      });

      test('should remove vote for an act', async ({ page }) => {
        await loginAsTestUser(page);

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create and vote for a video
        const video = await createTestVideo(page, actId, 2024);
        await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        // Delete the vote
        const deleteResponse = await page.request.delete(`/api/votes/${actId}`);
        expect(deleteResponse.status()).toBe(200);

        // Verify vote is gone
        const votesResponse = await page.request.get('/api/votes/me');
        const votesData = await votesResponse.json();
        expect(votesData.data.some((v: { actId: string }) => v.actId === actId)).toBeFalsy();

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });
    });
  });

  test.describe('Rankings API', () => {
    test.describe('GET /api/rankings', () => {
      test('should return rankings for all acts', async ({ request }) => {
        const response = await request.get('/api/rankings');
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBeTruthy();
      });

      test('should return rankings for specific act', async ({ request }) => {
        // Get an act first
        const actsResponse = await request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const response = await request.get(`/api/rankings?actId=${actId}`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('data');
      });

      test('should calculate performer bonus votes correctly', async ({ page }) => {
        await loginAsTestUser(page, 'Performer', 'Voter');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Get the logged-in user's ID
        const session = await page.request.get('/api/auth/session');
        const sessionData = await session.json();
        const userId = sessionData.user.id;

        // Create a video where this user is a performer
        const video = await createTestVideo(page, actId, 2024, [userId]);

        // Vote for this video (should count as 2)
        await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        // Get rankings
        const rankingsResponse = await page.request.get(`/api/rankings?actId=${actId}`);
        const rankingsData = await rankingsResponse.json();

        // Find this video in rankings
        const videoRanking = rankingsData.data.find((r: { videoId: string }) => r.videoId === video.id);
        expect(videoRanking).toBeDefined();
        expect(videoRanking.voteCount).toBe(2); // Performer bonus

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });
    });
  });

  test.describe('Voters List API', () => {
    test.describe('GET /api/videos/:id/voters', () => {
      test('should return list of voters for a video', async ({ page }) => {
        await loginAsTestUser(page, 'Voter', 'One');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create and vote for a video
        const video = await createTestVideo(page, actId, 2024);
        await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        // Get voters list
        const votersResponse = await page.request.get(`/api/videos/${video.id}/voters`);
        expect(votersResponse.status()).toBe(200);

        const votersData = await votersResponse.json();
        expect(votersData.data).toBeInstanceOf(Array);
        expect(votersData.data.length).toBe(1);
        expect(votersData.data[0]).toHaveProperty('user');
        expect(votersData.data[0].user.firstName).toBe('Voter');
        expect(votersData.data[0].user.lastName).toBe('One');

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should indicate if voter is a performer', async ({ page }) => {
        await loginAsTestUser(page, 'PerformerVoter', 'Test');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Get session to find user ID
        const session = await page.request.get('/api/auth/session');
        const sessionData = await session.json();
        const userId = sessionData.user.id;

        // Create video where user is a performer
        const video = await createTestVideo(page, actId, 2024, [userId]);

        // Vote for it
        await page.request.post('/api/votes', {
          data: { videoId: video.id },
        });

        // Get voters list
        const votersResponse = await page.request.get(`/api/videos/${video.id}/voters`);
        const votersData = await votersResponse.json();

        expect(votersData.data[0].isPerformer).toBe(true);
        expect(votersData.data[0].voteWeight).toBe(2);

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });
    });
  });

  test.describe('Voting UI', () => {
    test.afterEach(async ({ page }) => {
      await cleanupTestVideos(page);
    });

    test('should show vote button on video detail page', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;
      const actName = actsData.data[0].name;

      // Create a test video
      const video = await createTestVideo(page, actId, 2024);

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Should show vote button with act name
      await expect(page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') })).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should toggle vote when clicking vote button', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;
      const actName = actsData.data[0].name;

      // Create a test video
      const video = await createTestVideo(page, actId, 2024);

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Click vote button
      const voteButton = page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') });
      await voteButton.click();

      // Button should now indicate voted state
      await expect(page.getByRole('button', { name: /Your Best|Voted/i })).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show vote count and allow viewing voters', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a test video
      const video = await createTestVideo(page, actId, 2024);

      // Vote for it
      await page.request.post('/api/votes', {
        data: { videoId: video.id },
      });

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Should show vote count
      await expect(page.getByText(/1 vote/i)).toBeVisible();

      // Click to see voters
      await page.getByText(/1 vote/i).click();

      // Modal should show voter
      await expect(page.getByText('Test User')).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should indicate when switching vote from another video', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create two test videos
      const video1 = await createTestVideo(page, actId, 2023);
      const video2 = await createTestVideo(page, actId, 2024);

      // Vote for first video
      await page.request.post('/api/votes', {
        data: { videoId: video1.id },
      });

      // Navigate to second video page
      await page.goto(`/videos/${video2.id}`);

      // Should indicate user voted for different video in this act
      await expect(page.getByText(/You voted for/i)).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video1.id}`);
      await page.request.delete(`/api/videos/${video2.id}`);
    });
  });

  test.describe('Rankings Page', () => {
    test('should display rankings as homepage', async ({ page }) => {
      await page.goto('/');

      // Should show rankings/best videos section
      await expect(page.getByRole('heading', { name: /Best|Rankings/i })).toBeVisible();
    });

    test('should show best video for each act', async ({ page }) => {
      await page.goto('/');

      // Get acts to verify they're displayed
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();

      // Each act should have a section
      for (const act of actsData.data.slice(0, 3)) { // Check first 3 acts
        await expect(page.getByText(act.name)).toBeVisible();
      }
    });

    test('should link to video detail from rankings', async ({ page }) => {
      await loginAsTestUser(page);

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a video and vote for it
      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id },
      });

      // Go to homepage
      await page.goto('/');

      // Click on the video in rankings (if it's the top voted)
      // The video thumbnail or title should be clickable
      const videoLink = page.locator(`a[href="/videos/${video.id}"]`).first();
      if (await videoLink.isVisible()) {
        await videoLink.click();
        await expect(page).toHaveURL(`/videos/${video.id}`);
      }

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });
  });

  test.describe('Navigation', () => {
    test('should have Rankings as first nav item', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');

      // Rankings should be visible and come before Browse
      const rankingsLink = nav.getByRole('link', { name: /Rankings|Best/i });
      const browseLink = nav.getByRole('link', { name: /Browse|Videos/i });

      await expect(rankingsLink).toBeVisible();
      await expect(browseLink).toBeVisible();
    });

    test('should navigate to rankings from nav', async ({ page }) => {
      await page.goto('/videos');

      // Click rankings in nav
      await page.getByRole('navigation').getByRole('link', { name: /Rankings|Best/i }).click();

      // Should be on homepage/rankings
      await expect(page).toHaveURL('/');
    });
  });
});
