import { test, expect } from '@playwright/test';
import { loginAsTestUser, signOutUser } from './helpers/auth';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page with name fields', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: 'Welcome to the Archive' })).toBeVisible();
      await expect(page.getByLabel('First Name')).toBeVisible();
      await expect(page.getByLabel('Last Name')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    });

    test('should disable submit button when fields are empty', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.getByRole('button', { name: 'Continue' });
      await expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when both fields are filled', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('User');

      const submitButton = page.getByRole('button', { name: 'Continue' });
      await expect(submitButton).toBeEnabled();
    });

    test('should successfully log in with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('User');
      await page.getByRole('button', { name: 'Continue' }).click();

      // User name should appear in navigation (proves session is active)
      await expect(page.getByRole('navigation').getByText('Test User')).toBeVisible({
        timeout: 15000,
      });

      // Should be on home page
      await expect(page).toHaveURL('/');
    });

    test('should redirect to callback URL after login', async ({ page }) => {
      await page.goto('/login?callbackUrl=/videos');

      await page.getByLabel('First Name').fill('Callback');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Wait for session to be established first
      await expect(page.getByRole('navigation').getByText('Callback Test')).toBeVisible({
        timeout: 15000,
      });

      // Should be at the callback URL
      await expect(page).toHaveURL('/videos');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page navigation', async ({ page }) => {
      // Log in first
      await loginAsTestUser(page, 'Session', 'Test');

      // Navigate to different pages and verify session persists (check nav bar specifically)
      await page.goto('/videos');
      await expect(page.getByRole('navigation').getByText('Session Test')).toBeVisible();

      await page.goto('/submit');
      await expect(page.getByRole('navigation').getByText('Session Test')).toBeVisible();
    });

    test('should maintain session after page refresh', async ({ page }) => {
      // Log in first
      await loginAsTestUser(page, 'Refresh', 'Test');

      // Refresh the page
      await page.reload();

      // Session should still be active (check nav bar specifically)
      await expect(page.getByRole('navigation').getByText('Refresh Test')).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('should successfully sign out', async ({ page }) => {
      // Log in first
      await loginAsTestUser(page, 'SignOut', 'Test');

      // Verify logged in
      await expect(page.getByText('SignOut Test')).toBeVisible();

      // Click sign out
      await signOutUser(page);

      // Should show Sign In button instead of user name
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
      await expect(page.getByText('SignOut Test')).not.toBeVisible();
    });

    test('should redirect to home after sign out', async ({ page }) => {
      // Log in first
      await loginAsTestUser(page, 'Redirect', 'Test');

      // Navigate to a different page
      await page.goto('/videos');

      // Sign out
      await signOutUser(page);

      // Should redirect to home
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });
});
