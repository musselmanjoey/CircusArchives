import { Page, expect } from '@playwright/test';

/**
 * Robust login helper that waits for session to be established.
 *
 * Instead of waiting for URL change (which can be flaky due to client-side
 * routing timing), this waits for the user's name to appear in navigation,
 * which proves the session is active and the page has updated.
 */
export async function loginAsTestUser(
  page: Page,
  firstName = 'Test',
  lastName = 'User'
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByRole('button', { name: 'Continue' }).click();

  // Wait for session to be established by checking for user name in navigation
  // This is more reliable than waiting for URL change
  const fullName = `${firstName} ${lastName}`;
  await expect(page.getByRole('navigation').getByText(fullName)).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Sign out the current user and wait for session to be cleared.
 */
export async function signOutUser(page: Page): Promise<void> {
  // First navigate to home to ensure we're on a page with the nav
  await page.goto('/');

  // Click sign out
  await page.getByRole('button', { name: 'Sign Out' }).click();

  // Wait for Sign In link to appear, confirming session is cleared
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({
    timeout: 10000,
  });
}
