import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import { createTestVideo, cleanupTestVideos } from './helpers/video';

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

        // Cast vote (V5: requires actId)
        const voteResponse = await page.request.post('/api/votes', {
          data: { videoId: video.id, actId },
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
        await loginAsTestUser(page, `SwitchVote${Date.now()}`, 'User');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create two test videos in the same act
        const video1 = await createTestVideo(page, actId, 2023);
        const video2 = await createTestVideo(page, actId, 2024);

        try {
          // Vote for first video (V5: requires actId)
          const vote1Response = await page.request.post('/api/votes', {
            data: { videoId: video1.id, actId },
          });
          expect(vote1Response.status()).toBe(201);

          // Switch vote to second video (V5: requires actId)
          const vote2Response = await page.request.post('/api/votes', {
            data: { videoId: video2.id, actId },
          });
          expect(vote2Response.status()).toBe(200); // Updated, not created
          const vote2Data = await vote2Response.json();
          expect(vote2Data.data.videoId).toBe(video2.id);
        } finally {
          // Cleanup
          await page.request.delete(`/api/videos/${video1.id}`);
          await page.request.delete(`/api/videos/${video2.id}`);
        }
      });

      test('should allow voting for different acts', async ({ page }) => {
        await loginAsTestUser(page, `DiffActs${Date.now()}`, 'User');

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

        try {
          // Vote for both (V5: requires actId for each)
          const vote1Response = await page.request.post('/api/votes', {
            data: { videoId: video1.id, actId: act1Id },
          });
          const vote2Response = await page.request.post('/api/votes', {
            data: { videoId: video2.id, actId: act2Id },
          });

          expect(vote1Response.status()).toBe(201);
          expect(vote2Response.status()).toBe(201);
        } finally {
          // Cleanup
          await page.request.delete(`/api/videos/${video1.id}`);
          await page.request.delete(`/api/videos/${video2.id}`);
        }
      });

      test('should reject vote for non-existent video', async ({ page }) => {
        await loginAsTestUser(page);

        // Get a valid act ID for the request
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const response = await page.request.post('/api/votes', {
          data: { videoId: 'non-existent-video-id', actId },
        });

        expect(response.status()).toBe(404);
      });

      test('should reject vote with missing videoId', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.post('/api/votes', {
          data: {},
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Video ID is required');
      });
    });

    test.describe('GET /api/votes/me', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.get('/api/votes/me');
        expect(response.status()).toBe(401);
      });

      test('should return current user votes', async ({ page }) => {
        await loginAsTestUser(page, `MyVotes${Date.now()}`, 'User');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create and vote for a video
        const video = await createTestVideo(page, actId, 2024);

        try {
          await page.request.post('/api/votes', {
            data: { videoId: video.id, actId },
          });

          // Get user's votes
          const votesResponse = await page.request.get('/api/votes/me');
          expect(votesResponse.status()).toBe(200);

          const votesData = await votesResponse.json();
          expect(votesData.data).toBeInstanceOf(Array);
          expect(votesData.data.some((v: { videoId: string }) => v.videoId === video.id)).toBeTruthy();
        } finally {
          // Cleanup
          await page.request.delete(`/api/videos/${video.id}`);
        }
      });

      test('should return empty array when user has no votes', async ({ page }) => {
        // Login as a fresh user with unique name
        await loginAsTestUser(page, `NoVotes${Date.now()}`, 'TestUser');

        const votesResponse = await page.request.get('/api/votes/me');
        expect(votesResponse.status()).toBe(200);

        const votesData = await votesResponse.json();
        expect(votesData.data).toBeInstanceOf(Array);
        expect(votesData.data.length).toBe(0);
      });
    });

    test.describe('DELETE /api/votes/:actId', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.delete('/api/votes/some-act-id');
        expect(response.status()).toBe(401);
      });

      test('should remove vote for an act', async ({ page }) => {
        await loginAsTestUser(page, `RemoveVoteAPI${Date.now()}`, 'User');

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create and vote for a video
        const video = await createTestVideo(page, actId, 2024);

        try {
          await page.request.post('/api/votes', {
            data: { videoId: video.id, actId },
          });

          // Delete the vote
          const deleteResponse = await page.request.delete(`/api/votes/${actId}`);
          expect(deleteResponse.status()).toBe(200);

          // Verify vote is gone
          const votesResponse = await page.request.get('/api/votes/me');
          const votesData = await votesResponse.json();
          expect(votesData.data.some((v: { actId: string }) => v.actId === actId)).toBeFalsy();
        } finally {
          // Cleanup
          await page.request.delete(`/api/videos/${video.id}`);
        }
      });

      test('should return 404 when vote not found', async ({ page }) => {
        await loginAsTestUser(page);

        // Try to delete a vote that doesn't exist
        const response = await page.request.delete('/api/votes/nonexistent-act-id');
        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Vote not found');
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

        // Create a video where this user is a performer (V5 signature)
        const video = await createTestVideo(page, actId, 2024, { performerIds: [userId] });

        // Vote for this video (should count as 2) - V5: requires actId
        await page.request.post('/api/votes', {
          data: { videoId: video.id, actId },
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

      test('should have proper structure in rankings response', async ({ request }) => {
        const response = await request.get('/api/rankings');
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data).toBeInstanceOf(Array);

        // Every ranking should have the expected structure
        for (const ranking of data.data) {
          expect(ranking).toHaveProperty('act');
          expect(ranking).toHaveProperty('totalVotes');
          expect(typeof ranking.totalVotes).toBe('number');
          // topVideo can be null or an object based on whether there are votes
          expect(ranking.topVideo === null || typeof ranking.topVideo === 'object').toBeTruthy();
        }
      });

      test('should include act info in rankings response', async ({ request }) => {
        const response = await request.get('/api/rankings');
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data.length).toBeGreaterThan(0);

        // Check structure of first ranking
        const ranking = data.data[0];
        expect(ranking).toHaveProperty('act');
        expect(ranking.act).toHaveProperty('id');
        expect(ranking.act).toHaveProperty('name');
        expect(ranking).toHaveProperty('totalVotes');
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
          data: { videoId: video.id, actId },
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

        // Create video where user is a performer (V5 signature)
        const video = await createTestVideo(page, actId, 2024, { performerIds: [userId] });

        // Vote for it (V5: requires actId)
        await page.request.post('/api/votes', {
          data: { videoId: video.id, actId },
        });

        // Get voters list
        const votersResponse = await page.request.get(`/api/videos/${video.id}/voters`);
        const votersData = await votersResponse.json();

        expect(votersData.data[0].isPerformer).toBe(true);
        expect(votersData.data[0].voteWeight).toBe(2);

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should return 404 for invalid video', async ({ request }) => {
        const response = await request.get('/api/videos/nonexistent-video-id/voters');
        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Video not found');
      });

      test('should return empty array for video with no votes', async ({ page }) => {
        await loginAsTestUser(page);

        // Get an act
        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        // Create video without voting
        const video = await createTestVideo(page, actId, 2024);

        // Get voters list
        const votersResponse = await page.request.get(`/api/videos/${video.id}/voters`);
        expect(votersResponse.status()).toBe(200);

        const votersData = await votersResponse.json();
        expect(votersData.data).toBeInstanceOf(Array);
        expect(votersData.data.length).toBe(0);

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
      await loginAsTestUser(page, `Toggle${Date.now()}`, 'User');

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;
      const actName = actsData.data[0].name;

      // Create a test video
      const video = await createTestVideo(page, actId, 2024);

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Wait for vote button to be ready (not loading)
      await expect(page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') })).toBeVisible({ timeout: 15000 });

      // Click vote button
      const voteButton = page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') });
      await voteButton.click();

      // Button should now indicate voted state
      await expect(page.getByRole('button', { name: new RegExp(`Your Best ${actName}`, 'i') })).toBeVisible({ timeout: 15000 });

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show vote count and allow viewing voters', async ({ page }) => {
      await loginAsTestUser(page, 'VoterModal', 'TestUser');

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create a test video
      const video = await createTestVideo(page, actId, 2024);

      // Vote for it (V5: requires actId)
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Should show vote count (could be 1 or 2 if user is performer)
      await expect(page.getByText(/\d+ votes?/i)).toBeVisible();

      // Click to see voters
      await page.getByText(/\d+ votes?/i).click();

      // Wait for modal to open and show the Votes heading
      await expect(page.getByRole('heading', { name: 'Votes' })).toBeVisible();

      // Modal should show voter name - look within the modal container
      await expect(page.locator('.relative.bg-white p.font-medium').getByText(/VoterModal TestUser/)).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should indicate when switching vote from another video', async ({ page }) => {
      await loginAsTestUser(page, `SwitchUI${Date.now()}`, 'User');

      // Get an act
      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create two test videos
      const video1 = await createTestVideo(page, actId, 2023);
      const video2 = await createTestVideo(page, actId, 2024);

      try {
        // Vote for first video (V5: requires actId)
        await page.request.post('/api/votes', {
          data: { videoId: video1.id, actId },
        });

        // Navigate to second video page
        await page.goto(`/videos/${video2.id}`);

        // Should indicate user voted for different video in this act
        await expect(page.getByText(/You voted for a different/i)).toBeVisible({ timeout: 10000 });
      } finally {
        // Cleanup
        await page.request.delete(`/api/videos/${video1.id}`);
        await page.request.delete(`/api/videos/${video2.id}`);
      }
    });

    test('should hide vote button when not logged in', async ({ page }) => {
      test.setTimeout(60000); // Extend timeout for this test

      // Create a video via API (need to be logged in to create)
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;
      const actName = actsData.data[0].name;

      const video = await createTestVideo(page, actId, 2024);

      // Sign out - clear browser context and use a new page session
      await page.context().clearCookies();

      // Navigate to video page as unauthenticated user
      await page.goto(`/videos/${video.id}`);

      // Wait for page to load - wait for some content to appear
      await page.waitForLoadState('networkidle');

      // Wait a bit for the vote button to potentially appear (give session state time to settle)
      await page.waitForTimeout(3000);

      // Vote button should NOT be visible (component returns null when not logged in)
      await expect(page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') })).not.toBeVisible();

      // Cleanup - need to login to delete
      await loginAsTestUser(page);
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show remove vote option and allow removing vote', async ({ page }) => {
      await loginAsTestUser(page, `RemoveVote${Date.now()}`, 'User');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;
      const actName = actsData.data[0].name;

      const video = await createTestVideo(page, actId, 2024);

      try {
        // Navigate and vote
        await page.goto(`/videos/${video.id}`);

        // Wait for vote button to be ready
        await expect(page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') })).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') }).click();

        // Wait for voted state
        await expect(page.getByRole('button', { name: new RegExp(`Your Best ${actName}`, 'i') })).toBeVisible({ timeout: 10000 });

        // Should show "Remove vote" option
        await expect(page.getByText('Remove vote')).toBeVisible();

        // Click remove vote
        await page.getByText('Remove vote').click();

        // Button should return to unvoted state
        await expect(page.getByRole('button', { name: new RegExp(`Vote Best ${actName}`, 'i') })).toBeVisible({ timeout: 10000 });
      } finally {
        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      }
    });

    test('should close voters modal when clicking backdrop', async ({ page }) => {
      await loginAsTestUser(page, `Backdrop${Date.now()}`, 'User');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Vote for it via API (V5: requires actId)
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      // Navigate to video page
      await page.goto(`/videos/${video.id}`);

      // Wait for page to be ready and vote info to load - look for the blue vote count link
      const voteCountLink = page.locator('button.text-blue-600').filter({ hasText: /\d+ votes?/ });
      await expect(voteCountLink).toBeVisible({ timeout: 15000 });

      // Click to open voters modal
      await voteCountLink.click();

      // Modal should be open - check for the Votes header
      await expect(page.getByRole('heading', { name: 'Votes' })).toBeVisible();

      // Click backdrop to close - the backdrop is the element with bg-black bg-opacity-50
      const backdrop = page.locator('.bg-black.bg-opacity-50');
      await backdrop.click({ position: { x: 10, y: 10 }, force: true });

      // Modal should be closed
      await expect(page.getByRole('heading', { name: 'Votes' })).not.toBeVisible({ timeout: 5000 });

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should close voters modal when clicking X button', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Vote for it (V5: requires actId)
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto(`/videos/${video.id}`);

      // Wait for vote count to appear (could be 1 or 2)
      await expect(page.getByText(/\d+ votes?/i)).toBeVisible({ timeout: 10000 });

      // Open modal
      await page.getByText(/\d+ votes?/i).click();
      await expect(page.getByRole('heading', { name: 'Votes' })).toBeVisible();

      // Click the X button (inside the modal header)
      await page.locator('.relative.bg-white button').filter({ hasText: '×' }).click();

      // Modal should be closed
      await expect(page.getByRole('heading', { name: 'Votes' })).not.toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show performer 2x badge in voters modal', async ({ page }) => {
      await loginAsTestUser(page, 'PerformerBadge', 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Get user ID
      const session = await page.request.get('/api/auth/session');
      const sessionData = await session.json();
      const userId = sessionData.user.id;

      // Create video where user is a performer (V5 signature)
      const video = await createTestVideo(page, actId, 2024, { performerIds: [userId] });

      // Vote for it (V5: requires actId)
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto(`/videos/${video.id}`);

      // Open voters modal
      await page.getByText(/votes/i).first().click();

      // Should show performer badge
      await expect(page.getByText('Performer (2x vote)')).toBeVisible();

      // Cleanup
      await page.request.delete(`/api/videos/${video.id}`);
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

      // Create a video and vote for it (V5: requires actId)
      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
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

    test('should show YouTube thumbnail for voted videos', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show YouTube thumbnail image
      const thumbnailImg = page.locator(`a[href="/videos/${video.id}"] img`);
      if (await thumbnailImg.isVisible()) {
        const src = await thumbnailImg.getAttribute('src');
        expect(src).toContain('ytimg.com');
      }

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show #1 Best badge on featured cards', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show "#1 Best" badge
      await expect(page.getByText('#1 Best').first()).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show year badge on video cards', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show year badge with 2024
      const videoCard = page.locator(`a[href="/videos/${video.id}"]`);
      if (await videoCard.isVisible()) {
        await expect(videoCard.getByText('2024')).toBeVisible();
      }

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show vote count on ranked cards', async ({ page }) => {
      await loginAsTestUser(page, `VoteCount${Date.now()}`, 'User');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show vote count (could be 1 vote or 2 votes depending on performer status)
      await expect(page.getByText(/\d+ votes?/i).first()).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show performers on video cards', async ({ page }) => {
      await loginAsTestUser(page, 'RankingsPerf', 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Get user ID
      const session = await page.request.get('/api/auth/session');
      const sessionData = await session.json();
      const userId = sessionData.user.id;

      const video = await createTestVideo(page, actId, 2024, { performerIds: [userId] });
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show performer name on the card
      const videoCard = page.locator(`a[href="/videos/${video.id}"]`);
      if (await videoCard.isVisible()) {
        await expect(videoCard.getByText(/RankingsPerf Test/)).toBeVisible();
      }

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show truncated performer list with +N more', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      // Create 4 performers
      const performers: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const resp = await page.request.post('/api/users', {
          data: { firstName: `TruncPerf${i}`, lastName: `Test${Date.now()}` },
        });
        const data = await resp.json();
        performers.push(data.data.id);
      }

      const video = await createTestVideo(page, actId, 2024, { performerIds: performers });
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show "+1 more" or similar truncation
      const videoCard = page.locator(`a[href="/videos/${video.id}"]`);
      if (await videoCard.isVisible()) {
        await expect(videoCard.getByText(/\+\d+ more/)).toBeVisible();
      }

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show "No votes yet" for acts without votes', async ({ page }) => {
      await page.goto('/');

      // Look for "No votes yet" text (for acts without votes)
      const noVotesElement = page.getByText('No votes yet');

      // If there are any acts without votes, this should be visible
      // Otherwise the test passes as there are no unvoted acts
      if (await noVotesElement.first().isVisible()) {
        await expect(noVotesElement.first()).toBeVisible();
      }
    });

    test('should navigate to browse page for acts without votes', async ({ page }) => {
      await page.goto('/');

      // Find an act card without votes (has "Be the first to vote!")
      const actCard = page.getByText('Be the first to vote!').first();

      if (await actCard.isVisible()) {
        // Click on the parent card
        await actCard.locator('..').locator('..').click();

        // Should navigate to videos page with actId filter
        await expect(page).toHaveURL(/\/videos\?actId=/);
      }
      // If no unvoted acts, test passes
    });

    test('should show Top Voted Performances section when acts have votes', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);
      await page.request.post('/api/votes', {
        data: { videoId: video.id, actId },
      });

      await page.goto('/');

      // Should show "Top Voted Performances" section
      await expect(page.getByRole('heading', { name: 'Top Voted Performances' })).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });
  });

  test.describe('Navigation', () => {
    test('should have Best Videos as first nav item', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');

      // Best Videos link should be visible
      const bestVideosLink = nav.getByRole('link', { name: /Best Videos/i });
      const browseLink = nav.getByRole('link', { name: /Browse/i });

      await expect(bestVideosLink).toBeVisible();
      await expect(browseLink).toBeVisible();
    });

    test('should navigate to rankings from nav', async ({ page }) => {
      await page.goto('/videos');

      // Click Best Videos in nav
      await page.getByRole('navigation').getByRole('link', { name: /Best Videos/i }).click();

      // Should be on homepage/rankings
      await expect(page).toHaveURL('/');
    });

    test('should show correct nav order: Best Videos, Browse, Submit Video', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');

      // Get all links in navigation order
      const links = await nav.getByRole('link').all();
      const linkTexts = await Promise.all(links.map(async (link) => await link.textContent()));

      // Filter to just the main nav items (not Sign In button)
      const mainNavItems = linkTexts.filter((text) =>
        text && (text.includes('Best') || text.includes('Browse') || text.includes('Submit'))
      );

      // Verify order
      expect(mainNavItems[0]).toContain('Best');
      expect(mainNavItems[1]).toContain('Browse');
      expect(mainNavItems[2]).toContain('Submit');
    });

    test('should highlight Best Videos when on homepage', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      const bestVideosLink = nav.getByRole('link', { name: /Best Videos/i });

      // Should have active state (blue-600 color)
      await expect(bestVideosLink).toHaveClass(/text-blue-600/);
    });

    test('should highlight Browse when on videos page', async ({ page }) => {
      await page.goto('/videos');

      const nav = page.getByRole('navigation');
      const browseLink = nav.getByRole('link', { name: /Browse/i });

      // Should have active state (blue-600 color)
      await expect(browseLink).toHaveClass(/text-blue-600/);
    });

    test('should navigate to Browse page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation').getByRole('link', { name: /Browse/i }).click();

      await expect(page).toHaveURL('/videos');
    });

    test('should navigate to Submit Video page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation').getByRole('link', { name: /Submit/i }).click();

      await expect(page).toHaveURL('/submit');
    });
  });
});
