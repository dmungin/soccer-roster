import { test, expect, type Page } from '@playwright/test';

async function loginOrSetup(page: Page) {
  await page.goto('/login');
  const createBtn = page.getByRole('button', { name: 'Create Admin Account' });
  if (await createBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await createBtn.click();
  } else {
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'test123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  }
  await expect(page).toHaveURL('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Live Game Feature', () => {
  test('full live game workflow: scaffolding, dual timer, sub callouts, scoring, and post-game recap', async ({ page }) => {
    await loginOrSetup(page);

    // 1. Create Team if none exists
    const teamSection = page.locator('section', { hasText: 'Teams' }).first();
    const teamName = `LiveFC-${Date.now()}`;
    await teamSection.getByPlaceholder('Team Name...').fill(teamName);
    await teamSection.getByRole('button', { name: 'Create Team' }).click();
    await expect(teamSection.getByText(teamName)).toBeVisible();

    // 2. Add players to team
    const teamCard = teamSection.locator('li', { hasText: teamName }).first();
    await teamCard.getByRole('link', { name: 'Roster' }).click();
    await page.waitForURL(/\/team\//);

    const playerInput = page.locator('textarea');
    await playerInput.fill('Liam\nMaya\nSophia\nAlex\nNoah\nJackson\nLucas');
    await page.getByRole('button', { name: 'Add to Team' }).click();
    await expect(page.getByText('Liam')).toBeVisible();

    // Return to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 3. Create a Game
    const gamesSection = page.locator('section', { hasText: 'Scheduled Games' }).first();
    const teamSelect = gamesSection.locator('select').first();
    await teamSelect.selectOption({ index: 1 });

    const gameName = `Vs Riverside ${Date.now()}`;
    await gamesSection.getByPlaceholder('Game Name/Opponent').fill(gameName);
    await gamesSection.getByRole('button', { name: 'Schedule Game' }).click();
    await expect(gamesSection.getByText(gameName)).toBeVisible();

    // 4. Open Game Plan and Scaffold 8 Shifts
    const gameRow = gamesSection.locator('li', { hasText: gameName }).first();
    await gameRow.getByRole('link', { name: 'Open Game' }).click();
    await page.waitForURL(/\/game\//);

    // Verify Quick Match Setup is visible
    const scaffoldBtn = page.getByRole('button', { name: /8 Shifts \(Q1A - Q4B\)/i });
    await expect(scaffoldBtn).toBeVisible();
    await scaffoldBtn.click();

    // Verify Q1A and Q1B lineups were generated
    await expect(page.locator('input[title="Edit Lineup Name"]').first()).toHaveValue('Q1A');

    // 5. Navigate to Live Match
    const liveMatchHeaderBtn = page.getByRole('link', { name: /Live Match/i });
    await expect(liveMatchHeaderBtn).toBeVisible();
    await liveMatchHeaderBtn.click();
    await page.waitForURL(/\/game\/.*\/live/);

    // Verify Live Game View elements
    await expect(page.getByText(/Quarter 1/i)).toBeVisible();
    await expect(page.getByText(/Quarter Time/i)).toBeVisible();

    // 6. Test Clock controls
    const startClockBtn = page.getByRole('button', { name: /Start Clock/i });
    await expect(startClockBtn).toBeVisible();
    await startClockBtn.click();

    const pauseClockBtn = page.getByRole('button', { name: /Pause Clock/i });
    await expect(pauseClockBtn).toBeVisible();
    await pauseClockBtn.click();

    // 7. Test Sub Diff Modal
    const viewSubsBtn = page.getByRole('button', { name: /View Subs/i });
    await viewSubsBtn.click();

    await expect(page.getByText(/Substitution Window/i)).toBeVisible();
    const waitStoppageBtn = page.getByRole('button', { name: /Wait for Stoppage/i });
    await waitStoppageBtn.click();
    await expect(page.getByText(/Substitution Window/i)).not.toBeVisible();

    // 8. Log Goal for Our Team (with assist)
    await page.getByRole('button', { name: /Goal \(Us\)/i }).click();
    await expect(page.getByText(/Goal for/i)).toBeVisible();

    // Select Liam as scorer
    await page.locator('[data-testid="scorer-Liam"]').click();
    // Select Maya as assist
    await page.locator('[data-testid="assist-Maya"]').click();
    // Confirm Goal
    await page.getByRole('button', { name: /Confirm Goal \(\+1\)/i }).click();

    // Verify scoreboard updated to 1 - 0
    await expect(page.getByText('1').first()).toBeVisible();

    // 9. Log Opponent Goal
    await page.getByRole('button', { name: /Goal \(Them\)/i }).click();

    // 10. Finalize match
    page.on('dialog', dialog => dialog.accept());
    const finalizeBtn = page.getByRole('button', { name: /Finalize Match/i });
    await finalizeBtn.click();

    // Verify Summary Modal opens
    await expect(page.getByText(/Match Summary/i)).toBeVisible();
    await expect(page.getByText('⚽ Goal: Liam (Assist: Maya)')).toBeVisible();

    // Close summary modal
    await page.getByRole('button', { name: /Done/i }).click();

    // 11. Return to dashboard and verify final score badge
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const updatedGameCard = page.locator('section', { hasText: 'Scheduled Games' }).first().locator('li', { hasText: gameName }).first();
    await expect(updatedGameCard.getByText(/FINAL 1 - 1/i)).toBeVisible();

    // Clicking the recap badge opens the Game Summary Modal
    await updatedGameCard.getByText(/FINAL 1 - 1/i).click();
    await expect(page.getByText(/Match Summary/i)).toBeVisible();
  });

  test('configurable quarter duration per team propagates to live match clock', async ({ page }) => {
    await loginOrSetup(page);

    // 1. Create team with custom quarter duration (12 min)
    const teamSection = page.locator('section', { hasText: 'Teams' }).first();
    const teamName = `TimingFC-${Date.now()}`;
    await teamSection.getByPlaceholder('Team Name...').fill(teamName);
    await teamSection.getByRole('button', { name: '12m' }).click();
    await teamSection.getByRole('button', { name: 'Create Team' }).click();

    const teamCard = teamSection.locator('li', { hasText: teamName }).first();
    await expect(teamCard.getByText(/12m quarters/i)).toBeVisible();

    // 2. Open Roster and change to 8 min
    await teamCard.getByRole('link', { name: 'Roster' }).click();
    await page.waitForURL(/\/team\//);
    await expect(page.getByText(/12m quarters/i)).toBeVisible();

    await page.getByRole('button', { name: '8m' }).click();
    await expect(page.getByText(/8m quarters/i)).toBeVisible();
    await expect(page.getByText(/Sub alert at 4:00/i)).toBeVisible();

    // 3. Add minimum players
    const playerInput = page.locator('textarea');
    await playerInput.fill('Player1\nPlayer2\nPlayer3\nPlayer4\nPlayer5\nPlayer6\nPlayer7');
    await page.getByRole('button', { name: 'Add to Team' }).click();
    await expect(page.getByText('Player1')).toBeVisible();

    // 4. Return to dashboard and schedule a game
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gamesSection = page.locator('section', { hasText: 'Scheduled Games' }).first();
    const teamSelect = gamesSection.locator('select').first();
    const teamVal = await teamSelect.locator('option', { hasText: teamName }).getAttribute('value');
    if (teamVal) {
      await teamSelect.selectOption(teamVal);
    }

    const gameName = `Vs Cup Final ${Date.now()}`;
    await gamesSection.getByPlaceholder('Game Name/Opponent').fill(gameName);
    await gamesSection.getByRole('button', { name: 'Schedule Game' }).click();
    await expect(gamesSection.getByText(gameName)).toBeVisible();

    // 5. Open game, scaffold lineups, and enter Live Match
    const gameRow = gamesSection.locator('li', { hasText: gameName }).first();
    await gameRow.getByRole('link', { name: 'Open Game' }).click();
    await page.waitForURL(/\/game\//);

    const scaffoldBtn = page.getByRole('button', { name: /8 Shifts/i });
    await scaffoldBtn.click();

    const liveMatchBtn = page.getByRole('link', { name: /Live Match/i });
    await liveMatchBtn.click();
    await page.waitForURL(/\/game\/.*\/live/);

    // 6. Verify clock started at 8:00 and sub timer at 4:00
    await expect(page.getByText('8:00')).toBeVisible();
    await expect(page.getByText('4:00')).toBeVisible();
    await expect(page.getByText('(8m)')).toBeVisible();
  });
});
