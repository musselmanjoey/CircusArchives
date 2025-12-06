import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import { createTestVideo } from './helpers/video';

test.describe('Comments System', () => {
  test.describe('Comments API', () => {
    test.describe('GET /api/comments', () => {
      test('should require videoId parameter', async ({ request }) => {
        const response = await request.get('/api/comments');
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Video ID is required');
      });

      test('should return comments for a video', async ({ page }) => {
        await loginAsTestUser(page);

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        // Create a comment
        await page.request.post('/api/comments', {
          data: { content: 'Test comment', videoId: video.id },
        });

        // Get comments
        const response = await page.request.get(`/api/comments?videoId=${video.id}`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data).toBeInstanceOf(Array);
        expect(data.data.length).toBe(1);
        expect(data.data[0].content).toBe('Test comment');

        // Cleanup
        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should return empty array for video with no comments', async ({ page }) => {
        await loginAsTestUser(page);

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const response = await page.request.get(`/api/comments?videoId=${video.id}`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data).toBeInstanceOf(Array);
        expect(data.data.length).toBe(0);

        await page.request.delete(`/api/videos/${video.id}`);
      });
    });

    test.describe('POST /api/comments', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.post('/api/comments', {
          data: { content: 'Test', videoId: 'some-id' },
        });
        expect(response.status()).toBe(401);
      });

      test('should create a comment', async ({ page }) => {
        await loginAsTestUser(page, 'Commenter', 'Test');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const response = await page.request.post('/api/comments', {
          data: { content: 'Great performance!', videoId: video.id },
        });
        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data.data.content).toBe('Great performance!');
        expect(data.data.user.firstName).toBe('Commenter');
        expect(data.data.user.lastName).toBe('Test');

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject empty comment', async ({ page }) => {
        await loginAsTestUser(page);

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const response = await page.request.post('/api/comments', {
          data: { content: '', videoId: video.id },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Comment content is required');

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject comment over 140 characters', async ({ page }) => {
        await loginAsTestUser(page);

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const longContent = 'a'.repeat(141);
        const response = await page.request.post('/api/comments', {
          data: { content: longContent, videoId: video.id },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Comment must be 140 characters or less');

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should accept comment exactly 140 characters', async ({ page }) => {
        await loginAsTestUser(page);

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const exactContent = 'a'.repeat(140);
        const response = await page.request.post('/api/comments', {
          data: { content: exactContent, videoId: video.id },
        });
        expect(response.status()).toBe(201);

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject comment for non-existent video', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.post('/api/comments', {
          data: { content: 'Test', videoId: 'non-existent-id' },
        });
        expect(response.status()).toBe(404);
        const data = await response.json();
        expect(data.error).toBe('Video not found');
      });
    });

    test.describe('PATCH /api/comments/:id', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.patch('/api/comments/some-id', {
          data: { content: 'Updated' },
        });
        expect(response.status()).toBe(401);
      });

      test('should update own comment', async ({ page }) => {
        await loginAsTestUser(page, 'Editor', 'Test');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        // Create comment
        const createResp = await page.request.post('/api/comments', {
          data: { content: 'Original', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Update comment
        const response = await page.request.patch(`/api/comments/${comment.id}`, {
          data: { content: 'Updated content' },
        });
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.data.content).toBe('Updated content');

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject editing another user comment', async ({ page }) => {
        // Create comment as first user
        await loginAsTestUser(page, 'User1', 'Test');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const createResp = await page.request.post('/api/comments', {
          data: { content: 'User1 comment', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Login as different user and try to edit
        await page.context().clearCookies();
        await loginAsTestUser(page, 'User2', 'Test');

        const response = await page.request.patch(`/api/comments/${comment.id}`, {
          data: { content: 'Hacked!' },
        });
        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('You can only edit your own comments');

        // Cleanup as original user
        await page.context().clearCookies();
        await loginAsTestUser(page, 'User1', 'Test');
        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject update for non-existent comment', async ({ page }) => {
        await loginAsTestUser(page);

        const response = await page.request.patch('/api/comments/non-existent-id', {
          data: { content: 'Updated' },
        });
        expect(response.status()).toBe(404);
      });

      test('should reject empty content on update', async ({ page }) => {
        await loginAsTestUser(page, 'EmptyTest', 'User');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        // Create comment
        const createResp = await page.request.post('/api/comments', {
          data: { content: 'Original', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Try to update with empty content
        const response = await page.request.patch(`/api/comments/${comment.id}`, {
          data: { content: '' },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Comment content is required');

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject update over 140 characters', async ({ page }) => {
        await loginAsTestUser(page, 'LongTest', 'User');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        // Create comment
        const createResp = await page.request.post('/api/comments', {
          data: { content: 'Original', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Try to update with too long content
        const longContent = 'a'.repeat(141);
        const response = await page.request.patch(`/api/comments/${comment.id}`, {
          data: { content: longContent },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Comment must be 140 characters or less');

        await page.request.delete(`/api/videos/${video.id}`);
      });
    });

    test.describe('DELETE /api/comments/:id', () => {
      test('should require authentication', async ({ request }) => {
        const response = await request.delete('/api/comments/some-id');
        expect(response.status()).toBe(401);
      });

      test('should delete own comment', async ({ page }) => {
        await loginAsTestUser(page, 'Deleter', 'Test');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        // Create comment
        const createResp = await page.request.post('/api/comments', {
          data: { content: 'To be deleted', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Delete comment
        const response = await page.request.delete(`/api/comments/${comment.id}`);
        expect(response.status()).toBe(200);

        // Verify deletion
        const commentsResp = await page.request.get(`/api/comments?videoId=${video.id}`);
        const commentsData = await commentsResp.json();
        expect(commentsData.data.length).toBe(0);

        await page.request.delete(`/api/videos/${video.id}`);
      });

      test('should reject deleting another user comment', async ({ page }) => {
        // Create comment as first user
        await loginAsTestUser(page, 'Owner', 'Comment');

        const actsResponse = await page.request.get('/api/acts');
        const actsData = await actsResponse.json();
        const actId = actsData.data[0].id;

        const video = await createTestVideo(page, actId, 2024);

        const createResp = await page.request.post('/api/comments', {
          data: { content: 'Protected', videoId: video.id },
        });
        const comment = (await createResp.json()).data;

        // Login as different user and try to delete
        await page.context().clearCookies();
        await loginAsTestUser(page, 'Attacker', 'Test');

        const response = await page.request.delete(`/api/comments/${comment.id}`);
        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('You can only delete your own comments');

        // Cleanup
        await page.context().clearCookies();
        await loginAsTestUser(page, 'Owner', 'Comment');
        await page.request.delete(`/api/videos/${video.id}`);
      });
    });
  });

  test.describe('Comments UI', () => {
    test('should show comments section on video page', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      await expect(page.getByRole('heading', { name: /Comments/i })).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show comment form when logged in', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      await expect(page.getByPlaceholder(/Share your thoughts/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Post/i })).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show login prompt when not logged in', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Clear session
      await page.context().clearCookies();
      await page.goto(`/videos/${video.id}`);

      await expect(page.getByText(/Log in to leave a comment/i)).toBeVisible();

      // Cleanup
      await loginAsTestUser(page);
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should post a comment and show it', async ({ page }) => {
      await loginAsTestUser(page, 'Poster', 'Comment');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      // Post comment
      await page.getByPlaceholder(/Share your thoughts/i).fill('Amazing performance!');
      await page.getByRole('button', { name: /Post/i }).click();

      // Should show the comment within the comments section
      const commentSection = page.locator('[data-testid="comments-section"]');
      await expect(commentSection.getByText('Amazing performance!')).toBeVisible();
      await expect(commentSection.getByText('Poster Comment')).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show character count', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      // Initially should show 140
      await expect(page.getByText('140')).toBeVisible();

      // Type some characters
      await page.getByPlaceholder(/Share your thoughts/i).fill('Hello');

      // Should show 135 remaining
      await expect(page.getByText('135')).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show yellow count when under 20 chars remaining', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      // Type 125 characters to have 15 remaining
      await page.getByPlaceholder(/Share your thoughts/i).fill('a'.repeat(125));

      // Should show 15 remaining in yellow
      await expect(page.getByText('15')).toBeVisible();
      await expect(page.getByText('15')).toHaveClass(/text-yellow-600/);

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show red count when over limit', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.goto(`/videos/${video.id}`);

      // Type too many characters
      await page.getByPlaceholder(/Share your thoughts/i).fill('a'.repeat(145));

      // Should show negative count in red
      await expect(page.getByText('-5')).toBeVisible();
      await expect(page.getByText('-5')).toHaveClass(/text-red-600/);

      // Post button should be disabled
      await expect(page.getByRole('button', { name: /Post/i })).toBeDisabled();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should allow editing own comment', async ({ page }) => {
      await loginAsTestUser(page, 'EditUI', 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Create comment via API
      await page.request.post('/api/comments', {
        data: { content: 'Original comment', videoId: video.id },
      });

      await page.goto(`/videos/${video.id}`);

      // Find the comment section and click Edit within it
      const commentSection = page.locator('[data-testid="comments-section"]');
      await commentSection.getByRole('button', { name: /Edit/i }).first().click();

      // Should show edit form
      const textarea = page.locator('textarea').first();
      await textarea.clear();
      await textarea.fill('Updated comment');

      await page.getByRole('button', { name: /Save/i }).click();

      // Should show updated comment
      await expect(page.getByText('Updated comment')).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should allow deleting own comment', async ({ page }) => {
      await loginAsTestUser(page, 'DeleteUI', 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Create comment via API
      await page.request.post('/api/comments', {
        data: { content: 'To be deleted', videoId: video.id },
      });

      await page.goto(`/videos/${video.id}`);

      // Accept the confirm dialog
      page.on('dialog', (dialog) => dialog.accept());

      // Find the comment section and click Delete within it
      const commentSection = page.locator('[data-testid="comments-section"]');
      await commentSection.getByRole('button', { name: /Delete/i }).first().click();

      // Comment should be gone
      await expect(page.getByText('To be deleted')).not.toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should not show edit/delete for other users comments', async ({ page }) => {
      // Create comment as first user
      await loginAsTestUser(page, 'Author', 'Comment');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.request.post('/api/comments', {
        data: { content: 'Not yours', videoId: video.id },
      });

      // Login as different user
      await page.context().clearCookies();
      await loginAsTestUser(page, 'Viewer', 'Test');

      await page.goto(`/videos/${video.id}`);

      // Should see the comment but not edit/delete buttons within comments section
      const commentSection = page.locator('[data-testid="comments-section"]');
      await expect(page.getByText('Not yours')).toBeVisible();
      await expect(commentSection.getByRole('button', { name: /Edit/i })).not.toBeVisible();
      await expect(commentSection.getByRole('button', { name: /Delete/i })).not.toBeVisible();

      // Cleanup
      await page.context().clearCookies();
      await loginAsTestUser(page, 'Author', 'Comment');
      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should show comment count in header', async ({ page }) => {
      await loginAsTestUser(page);

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      // Create 2 comments
      await page.request.post('/api/comments', {
        data: { content: 'Comment 1', videoId: video.id },
      });
      await page.request.post('/api/comments', {
        data: { content: 'Comment 2', videoId: video.id },
      });

      await page.goto(`/videos/${video.id}`);

      await expect(page.getByRole('heading', { name: /Comments \(2\)/i })).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });

    test('should cancel edit when clicking cancel', async ({ page }) => {
      await loginAsTestUser(page, 'CancelEdit', 'Test');

      const actsResponse = await page.request.get('/api/acts');
      const actsData = await actsResponse.json();
      const actId = actsData.data[0].id;

      const video = await createTestVideo(page, actId, 2024);

      await page.request.post('/api/comments', {
        data: { content: 'Original', videoId: video.id },
      });

      await page.goto(`/videos/${video.id}`);

      // Find the comment section and click Edit within it
      const commentSection = page.locator('[data-testid="comments-section"]');
      await commentSection.getByRole('button', { name: /Edit/i }).first().click();

      // Wait for save button to appear (indicating edit mode is active)
      await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();

      // Modify text in the comment edit textarea (not the main comment form)
      const editTextarea = commentSection.locator('textarea').first();
      await editTextarea.clear();
      await editTextarea.fill('Modified');

      // Click cancel
      await page.getByRole('button', { name: /Cancel/i }).click();

      // Wait for Cancel button to disappear (edit mode closed)
      await expect(page.getByRole('button', { name: /Cancel/i })).not.toBeVisible();

      // Should show original text in comment
      await expect(commentSection.getByText('Original')).toBeVisible();

      await page.request.delete(`/api/videos/${video.id}`);
    });
  });
});
