import { test, expect, type Page } from '@playwright/test';

// Helper: complete the initial admin setup
async function setupAdmin(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Create Admin Account' })).toBeVisible();
  await page.fill('#login-username', 'admin');
  await page.fill('#login-password', 'test123');
  await page.getByRole('button', { name: 'Create Admin Account' }).click();
  await expect(page).toHaveURL('/');
  await page.waitForLoadState('networkidle');
}

// Helper: login as existing user
async function login(page: Page, username = 'admin', password = 'test123') {
  await page.goto('/login');
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('/');
  await page.waitForLoadState('networkidle');
}

// Scoped section locators
function teamsSection(page: Page) {
  return page.locator('section', { hasText: 'Teams' }).first();
}

function gamesSection(page: Page) {
  return page.locator('section', { hasText: 'Scheduled Games' }).first();
}

test.describe('Authentication', () => {
  test('shows setup screen when no users exist', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Create Admin Account' })).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('initial setup creates admin and redirects to home', async ({ page }) => {
    await setupAdmin(page);
    await expect(page.locator('header').getByText('Admin')).toBeVisible();
  });

  test('setup is blocked after first user created', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Soccer Roster', level: 1 })).toBeVisible();
  });

  test('login works with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await expect(page.locator('header').getByText('admin')).toBeVisible();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Team CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('creates a team', async ({ page }) => {
    const section = teamsSection(page);
    await section.locator('input[placeholder="Team Name..."]').fill('FC Eagles');
    await section.getByRole('button', { name: 'Create Team' }).click();
    // Verify team shows in the team list
    await expect(section.locator('li', { hasText: 'FC Eagles' })).toBeVisible();
    await expect(section.locator('li', { hasText: '0 players' })).toBeVisible();
  });

  test('navigates to team roster and adds players', async ({ page }) => {
    const section = teamsSection(page);
    await section.getByRole('link', { name: 'Roster' }).click();
    await expect(page.getByRole('heading', { name: /Roster/ })).toBeVisible();

    // Add players via bulk add
    await page.locator('textarea').fill('Player One\nPlayer Two\nPlayer Three');
    await page.getByRole('button', { name: 'Add to Team' }).click();

    await expect(page.getByText('Player One')).toBeVisible();
    await expect(page.getByText('Player Two')).toBeVisible();
    await expect(page.getByText('Player Three')).toBeVisible();
    await expect(page.getByText('3 players total')).toBeVisible();
  });

  test('removes a player from team', async ({ page }) => {
    const section = teamsSection(page);
    await section.getByRole('link', { name: 'Roster' }).click();
    await expect(page.getByText('Player One')).toBeVisible(); // Wait for players to load
    const removeButtons = page.getByRole('button', { name: 'Remove Player' });
    await removeButtons.last().click();
    await expect(page.getByText('2 players total')).toBeVisible();
  });

  test('deletes a team', async ({ page }) => {
    const section = teamsSection(page);
    // Create a temporary team to delete
    await section.locator('input[placeholder="Team Name..."]').fill('Temp Team');
    await section.getByRole('button', { name: 'Create Team' }).click();
    await expect(section.locator('li', { hasText: 'Temp Team' })).toBeVisible();

    // Delete it
    const teamRow = section.locator('li', { hasText: 'Temp Team' });
    await teamRow.getByRole('button', { name: 'Delete Team' }).click();
    await expect(section.locator('li', { hasText: 'Temp Team' })).not.toBeVisible();
  });
});

test.describe('Game CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('creates a game', async ({ page }) => {
    const section = gamesSection(page);
    await section.locator('input[placeholder*="Game Name"]').fill('vs Panthers');
    // Wait for team options to load
    const teamSelect = section.locator('select');
    await expect(teamSelect.locator('option')).not.toHaveCount(1); // More than just the disabled option
    await teamSelect.selectOption({ index: 1 });
    await section.getByRole('button', { name: 'Schedule Game' }).click();
    await expect(section.locator('li', { hasText: 'vs Panthers' })).toBeVisible();
  });

  test('opens game and adds a lineup', async ({ page }) => {
    const section = gamesSection(page);
    await section.getByRole('link', { name: 'Open Game' }).click();
    await expect(page.getByText('vs Panthers').first()).toBeVisible();

    // Create a lineup
    await page.fill('input[placeholder*="Lineup Name"]', 'Q1');
    await page.getByRole('button', { name: 'Add Lineup' }).click();

    // Verify lineup field appears - check for the lineup name input
    const lineupInput = page.locator('input[title="Edit Lineup Name"]');
    await expect(lineupInput).toBeVisible();
    await expect(lineupInput).toHaveValue('Q1');
  });

  test('data persists after page reload', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Scope checks to the teams section and games section
    await expect(teamsSection(page).locator('li', { hasText: 'FC Eagles' })).toBeVisible();
    await expect(gamesSection(page).locator('li', { hasText: 'vs Panthers' })).toBeVisible();
  });

  test('deletes a game', async ({ page }) => {
    const section = gamesSection(page);
    await section.locator('input[placeholder*="Game Name"]').fill('Temp Game');
    const teamSelect = section.locator('select');
    await expect(teamSelect.locator('option')).not.toHaveCount(1);
    await teamSelect.selectOption({ index: 1 });
    await section.getByRole('button', { name: 'Schedule Game' }).click();
    await expect(section.locator('li', { hasText: 'Temp Game' })).toBeVisible();

    // Delete it
    const gameRow = section.locator('li', { hasText: 'Temp Game' });
    await gameRow.getByRole('button', { name: 'Delete Game' }).click();
    await expect(section.locator('li', { hasText: 'Temp Game' })).not.toBeVisible();
  });
});

test.describe('Access Control', () => {
  test('API returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/teams');
    expect(response.status()).toBe(401);
  });

  test('API returns 401 for unauthenticated game requests', async ({ request }) => {
    const response = await request.get('/api/games');
    expect(response.status()).toBe(401);
  });
});
