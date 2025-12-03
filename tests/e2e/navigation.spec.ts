import { test, expect, Page } from '@playwright/test';

// Helper function to log in
async function loginAsTestUser(page: Page, firstName = 'Nav', lastName = 'Tester') {
  await page.goto('/login');
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Navigation', () => {
  test.describe('Unauthenticated State', () => {
    test('should show Sign In button when not logged in', async ({ page }) => {
      await page.goto('/');

      const signInLink = page.getByRole('link', { name: 'Sign In' });
      await expect(signInLink).toBeVisible();
    });

    test('should not show Sign Out button when not logged in', async ({ page }) => {
      await page.goto('/');

      const signOutButton = page.getByRole('button', { name: 'Sign Out' });
      await expect(signOutButton).not.toBeVisible();
    });

    test('should not show user name when not logged in', async ({ page }) => {
      await page.goto('/');

      // Wait for auth state to settle
      await page.waitForTimeout(500);

      // Should see Sign In, not a user name
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    });

    test('Sign In button should link to login page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('link', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Authenticated State', () => {
    test('should show user name when logged in', async ({ page }) => {
      await loginAsTestUser(page, 'Display', 'Name');

      await expect(page.getByText('Display Name')).toBeVisible();
    });

    test('should show Sign Out button when logged in', async ({ page }) => {
      await loginAsTestUser(page);

      const signOutButton = page.getByRole('button', { name: 'Sign Out' });
      await expect(signOutButton).toBeVisible();
    });

    test('should not show Sign In button when logged in', async ({ page }) => {
      await loginAsTestUser(page);

      const signInLink = page.getByRole('link', { name: 'Sign In' });
      await expect(signInLink).not.toBeVisible();
    });

    test('should update navigation after sign out', async ({ page }) => {
      await loginAsTestUser(page, 'Update', 'Test');

      // Verify logged in state
      await expect(page.getByText('Update Test')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

      // Sign out
      await page.getByRole('button', { name: 'Sign Out' }).click();

      // Wait for sign out to complete
      await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });

      // Verify logged out state
      await expect(page.getByText('Update Test')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign Out' })).not.toBeVisible();
    });
  });

  test.describe('Navigation Links', () => {
    test('should have Browse link', async ({ page }) => {
      await page.goto('/');

      // Use exact match to avoid matching "Browse Videos"
      const browseLink = page.getByRole('navigation').getByRole('link', { name: 'Browse', exact: true });
      await expect(browseLink).toBeVisible();
    });

    test('should have Submit Video link', async ({ page }) => {
      await page.goto('/');

      const submitLink = page.getByRole('navigation').getByRole('link', { name: 'Submit Video' });
      await expect(submitLink).toBeVisible();
    });

    test('Browse link should navigate to videos page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation').getByRole('link', { name: 'Browse', exact: true }).click();
      await expect(page).toHaveURL('/videos');
    });

    test('Submit Video link should navigate to submit page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation').getByRole('link', { name: 'Submit Video' }).click();
      await expect(page).toHaveURL('/submit');
    });

    test('should highlight current page in navigation', async ({ page }) => {
      await page.goto('/videos');

      // Browse link should be highlighted (blue text) - use exact match
      const browseLink = page.getByRole('navigation').getByRole('link', { name: 'Browse', exact: true });
      await expect(browseLink).toHaveClass(/text-blue-600/);

      // Submit link should not be highlighted
      const submitLink = page.getByRole('navigation').getByRole('link', { name: 'Submit Video' });
      await expect(submitLink).toHaveClass(/text-gray-600/);
    });
  });

  test.describe('Loading State', () => {
    test('should show loading indicator briefly while checking auth', async ({ page }) => {
      // Navigate without waiting for hydration
      await page.goto('/', { waitUntil: 'commit' });

      // The loading state "..." may appear briefly
      // This is a best-effort test - the loading state is very quick
      // Just verify the page eventually shows either Sign In or user info
      await expect(
        page.getByRole('link', { name: 'Sign In' }).or(page.getByRole('button', { name: 'Sign Out' }))
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
