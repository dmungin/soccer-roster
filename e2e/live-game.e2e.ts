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

    const qInput = page.locator('input[type="number"]');
    await qInput.fill('8');
    await qInput.dispatchEvent('change');
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

    // 7. Test Reset Game flow
    await page.getByRole('button', { name: /Goal \(Us\)/i }).click();
    await page.locator('[data-testid="scorer-Player1"]').click();
    await page.getByRole('button', { name: /Confirm Goal/i }).click();
    await expect(page.getByText('1').first()).toBeVisible();

    // Trigger reset match
    page.on('dialog', dialog => dialog.accept());
    const resetBtn = page.getByRole('button', { name: /Reset Match|Reset/i }).first();
    await resetBtn.click();

    // Verify scoreboard and timer reset
    await expect(page.getByText('8:00')).toBeVisible();
    await expect(page.getByText('4:00')).toBeVisible();
    await expect(page.getByText('0 events')).toBeVisible();

    // Return to dashboard and verify status is scheduled
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const resetGameCard = page.locator('section', { hasText: 'Scheduled Games' }).first().locator('li', { hasText: gameName }).first();
    await expect(resetGameCard.getByText(/LIVE \d+ - \d+/i)).not.toBeVisible();
    await expect(resetGameCard.getByText(/FINAL \d+ - \d+/i)).not.toBeVisible();
  });

  test('game clock catches up elapsed wall time after screen lock/backgrounding without drift', async ({ page }) => {
    await loginOrSetup(page);

    // Create a team and game
    const teamSection = page.locator('section', { hasText: 'Teams' }).first();
    const teamName = `DriftCheckFC-${Date.now()}`;
    await teamSection.getByPlaceholder('Team Name...').fill(teamName);
    await teamSection.getByRole('button', { name: 'Create Team' }).click();

    const teamCard = teamSection.locator('li', { hasText: teamName }).first();
    await teamCard.getByRole('link', { name: 'Roster' }).click();
    await page.waitForURL(/\/team\//);

    const playerInput = page.locator('textarea');
    await playerInput.fill('P1\nP2\nP3\nP4\nP5\nP6\nP7');
    await page.getByRole('button', { name: 'Add to Team' }).click();
    await expect(page.getByText('P1')).toBeVisible();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gamesSection = page.locator('section', { hasText: 'Scheduled Games' }).first();
    const teamSelect = gamesSection.locator('select').first();
    const teamVal = await teamSelect.locator('option', { hasText: teamName }).getAttribute('value');
    if (teamVal) {
      await teamSelect.selectOption(teamVal);
    }

    const gameName = `Drift Test Match ${Date.now()}`;
    await gamesSection.getByPlaceholder('Game Name/Opponent').fill(gameName);
    await gamesSection.getByRole('button', { name: 'Schedule Game' }).click();

    const gameRow = gamesSection.locator('li', { hasText: gameName }).first();
    await gameRow.getByRole('link', { name: 'Open Game' }).click();
    await page.waitForURL(/\/game\//);

    await page.getByRole('button', { name: /8 Shifts/i }).click();
    await page.getByRole('link', { name: /Live Match/i }).click();
    await page.waitForURL(/\/game\/.*\/live/);

    // Initial clock at 10:00
    await expect(page.getByText('10:00')).toBeVisible();

    // Start clock
    await page.getByRole('button', { name: /Start Clock/i }).click();
    await expect(page.getByRole('button', { name: /Pause Clock/i })).toBeVisible();

    // Fast-forward wall clock by 6 seconds and fire visibilitychange
    await page.evaluate(() => {
      const realNow = Date.now();
      Date.now = () => realNow + 6000;
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Verify clock caught up: should now be 9:54 or less (not 9:59 or 10:00)
    await expect(page.getByText(/9:5[0-4]/)).toBeVisible();

    // Pause clock
    await page.getByRole('button', { name: /Pause Clock/i }).click();
    await expect(page.getByRole('button', { name: /Start Clock/i })).toBeVisible();
  });

  test('coaches can retroactively add missed events and edit existing events in live match', async ({ page }) => {
    await loginOrSetup(page);

    const teamSection = page.locator('section', { hasText: 'Teams' }).first();
    const teamName = `EventEditFC-${Date.now()}`;
    await teamSection.getByPlaceholder('Team Name...').fill(teamName);
    await teamSection.getByRole('button', { name: 'Create Team' }).click();

    const teamCard = teamSection.locator('li', { hasText: teamName }).first();
    await teamCard.getByRole('link', { name: 'Roster' }).click();
    await page.waitForURL(/\/team\//);

    const playerInput = page.locator('textarea');
    await playerInput.fill('StrikerSam\nMidfielderMax\nDefenderDan\nKeeperKen\nSubSue\nSubSal\nSubSid');
    await page.getByRole('button', { name: 'Add to Team' }).click();
    await expect(page.getByText('StrikerSam')).toBeVisible();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gamesSection = page.locator('section', { hasText: 'Scheduled Games' }).first();
    const teamSelect = gamesSection.locator('select').first();
    const teamVal = await teamSelect.locator('option', { hasText: teamName }).getAttribute('value');
    if (teamVal) {
      await teamSelect.selectOption(teamVal);
    }

    const gameName = `Edit Events Match ${Date.now()}`;
    await gamesSection.getByPlaceholder('Game Name/Opponent').fill(gameName);
    await gamesSection.getByRole('button', { name: 'Schedule Game' }).click();

    const gameRow = gamesSection.locator('li', { hasText: gameName }).first();
    await gameRow.getByRole('link', { name: 'Open Game' }).click();
    await page.waitForURL(/\/game\//);

    // Verify Quarter and Shift label layout
    await expect(page.getByText('Quarter:')).toBeVisible();
    await expect(page.getByText('Shift:')).toBeVisible();

    await page.getByRole('button', { name: /8 Shifts/i }).click();
    await page.getByRole('link', { name: /Live Match/i }).click();
    await page.waitForURL(/\/game\/.*\/live/);

    // 1. Add a missed goal retroactively via "+ Add Event"
    await page.getByRole('button', { name: /Add Event/i }).click();
    await expect(page.getByText(/Add Missed Event \/ Goal/i)).toBeVisible();

    const eventModal = page.locator('div.fixed.inset-0', { hasText: 'Add Missed Event / Goal' });
    // Set match minute to 3'
    const minuteInput = eventModal.locator('input[type="number"]');
    await minuteInput.fill('3');

    // Select StrikerSam as scorer
    const scorerSelect = eventModal.locator('select').first();
    await scorerSelect.selectOption({ label: 'StrikerSam' });

    // Save event
    await eventModal.getByRole('button', { name: 'Add Event' }).click();

    // Verify event is in feed with 3' and StrikerSam
    await expect(page.getByText("3'").first()).toBeVisible();
    await expect(page.getByText('⚽ Goal: StrikerSam')).toBeVisible();
    await expect(page.getByText('1').first()).toBeVisible(); // Us score = 1

    // 2. Edit the event using the pencil button
    const editBtn = page.locator('button[title="Edit Event"]').first();
    await editBtn.click();
    await expect(page.getByText('Edit Match Event')).toBeVisible();

    const editModal = page.locator('div.fixed.inset-0', { hasText: 'Edit Match Event' });
    // Change minute to 5' and change scorer to MidfielderMax
    await editModal.locator('input[type="number"]').fill('5');
    await editModal.locator('select').first().selectOption({ label: 'MidfielderMax' });
    await editModal.getByRole('button', { name: 'Save Changes' }).click();

    // Verify updated event details in feed
    await expect(page.getByText("5'").first()).toBeVisible();
    await expect(page.getByText('⚽ Goal: MidfielderMax')).toBeVisible();
  });
});
