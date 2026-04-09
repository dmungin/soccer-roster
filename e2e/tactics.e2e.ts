import { test, expect } from '@playwright/test';

test('Appends players and handles lineup creation natively', async ({ page }) => {
  await page.goto('/');

  // Bulk add players
  await page.fill('textarea[placeholder="Paste names here..."]', 'Lionel Messi\nCristiano Ronaldo');
  await page.click('button:has-text("Add to Roster")');

  // Verify players added
  await expect(page.locator('text=Lionel Messi')).toBeVisible();
  await expect(page.locator('text=Cristiano Ronaldo')).toBeVisible();

  // Create Lineup
  await page.fill('input[placeholder="e.g. Q1, 2nd Half"]', 'Quarter 1');
  await page.click('button:has-text("Add")');

  // Verify selected lineup
  await expect(page.locator('select')).toContainText('Quarter 1');

  // Perform Drag and Drop if possible
  const sourceNode = page.locator('li', { hasText: 'Lionel Messi' }).first();
  const targetNode = page.locator('div.absolute', { hasText: 'GK' }).last();

  await sourceNode.dragTo(targetNode);

  // Assert Lionel Messi is assigned to GK
  // His initials "LM" will appear inside the position circle
  await expect(page.locator('div', { hasText: 'LM' }).last()).toBeVisible();
  
  // Test deletion of lineup
  page.once('dialog', dialog => dialog.accept());
  await page.locator('button[title="Delete Lineup"]').click();
  await expect(page.locator('text=Quarter 1')).not.toBeVisible();
});
