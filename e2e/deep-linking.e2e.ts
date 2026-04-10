import { test, expect, type Page } from '@playwright/test';

// Reuse helper for admin setup
async function ensureAdminExists(page: Page) {
  await page.goto('/login');
  const setupBtn = page.getByRole('button', { name: 'Create Admin Account' });
  if (await setupBtn.isVisible()) {
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await setupBtn.click();
    await expect(page).toHaveURL('/');
    // After setup, the user is already logged in, so we sign them out to test deep-linking
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL('/login');
  } else {
    // If setup already exists, ensure we aren't already logged in
    const signOutBtn = page.getByRole('button', { name: 'Sign Out' });
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await expect(page).toHaveURL('/login');
    }
  }
}

test.describe('Deep Linking', () => {
  // Ensure we have an admin and are logged out for these tests
  test.beforeEach(async ({ page }) => {
    await ensureAdminExists(page);
  });

  test('successfully redirects back to the intended path after login', async ({ page }) => {
    const intendedPath = '/builder';
    
    // 1. Visit the protected URL directly
    await page.goto(intendedPath);
    
    // 2. Expect to be redirected to login with redirect parameter (might be decoded in browser)
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)builder/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();

    // 3. Complete login
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');

    // 4. Expect to be redirected back to the intended path
    await expect(page).toHaveURL(intendedPath);
    await expect(page.getByText(/Drag positions onto the field below/i)).toBeVisible({ timeout: 10000 });
  });

  test('handles nested paths with IDs successfully', async ({ page }) => {
    const dummyId = '12345';
    const intendedPath = `/team/${dummyId}`;
    
    // 1. Attempt deep link
    await page.goto(intendedPath);
    // Allow for either encoded or decoded redirect param
    await expect(page).toHaveURL(new RegExp(`/login\\?redirect=(%2F|/)team(%2F|/)${dummyId}`));

    // 2. Login
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');

    // 3. Verify destination
    await expect(page).toHaveURL(intendedPath);
  });

  test('respects redirect parameter if visiting login page while already authenticated', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');

    // Now visit login page with a redirect param
    const intendedPath = '/builder';
    await page.goto(`/login?redirect=${encodeURIComponent(intendedPath)}`);
    await page.waitForLoadState('networkidle');

    // Verify it immediately redirects back to the intended path
    await expect(page).toHaveURL(intendedPath);
    await expect(page.getByText(/Drag positions onto the field below/i)).toBeVisible();
  });
});
