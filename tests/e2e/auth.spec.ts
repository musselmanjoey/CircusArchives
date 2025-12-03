import { test, expect } from '@playwright/test';

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

      // Should redirect to home page after login
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // User name should appear in navigation
      await expect(page.getByText('Test User')).toBeVisible();
    });

    test('should redirect to callback URL after login', async ({ page }) => {
      await page.goto('/login?callbackUrl=/videos');

      await page.getByLabel('First Name').fill('Callback');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should redirect to the callback URL
      await expect(page).toHaveURL('/videos', { timeout: 10000 });
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page navigation', async ({ page }) => {
      // Log in first
      await page.goto('/login');
      await page.getByLabel('First Name').fill('Session');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Navigate to different pages and verify session persists (check nav bar specifically)
      await page.goto('/videos');
      await expect(page.getByRole('navigation').getByText('Session Test')).toBeVisible();

      await page.goto('/submit');
      await expect(page.getByRole('navigation').getByText('Session Test')).toBeVisible();
    });

    test('should maintain session after page refresh', async ({ page }) => {
      // Log in first
      await page.goto('/login');
      await page.getByLabel('First Name').fill('Refresh');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Refresh the page
      await page.reload();

      // Session should still be active (check nav bar specifically)
      await expect(page.getByRole('navigation').getByText('Refresh Test')).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('should successfully sign out', async ({ page }) => {
      // Log in first
      await page.goto('/login');
      await page.getByLabel('First Name').fill('SignOut');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Verify logged in
      await expect(page.getByText('SignOut Test')).toBeVisible();

      // Click sign out
      await page.getByRole('button', { name: 'Sign Out' }).click();

      // Should show Sign In button instead of user name
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('SignOut Test')).not.toBeVisible();
    });

    test('should redirect to home after sign out', async ({ page }) => {
      // Log in first
      await page.goto('/login');
      await page.getByLabel('First Name').fill('Redirect');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Navigate to a different page
      await page.goto('/videos');

      // Sign out
      await page.getByRole('button', { name: 'Sign Out' }).click();

      // Should redirect to home
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });
});
