import { test, expect, type Page } from '@playwright/test';

// Helper: login as existing user (copied from app.e2e.ts for reliability)
async function login(page: Page, username = 'admin', password = 'test123') {
  await page.goto('/login');
  // Wait for either setup button or login button
  const setupBtn = page.getByRole('button', { name: 'Create Admin Account' });
  const loginBtn = page.getByRole('button', { name: 'Sign In' });
  
  await Promise.race([
    setupBtn.waitFor({ state: 'visible' }).catch(() => {}),
    loginBtn.waitFor({ state: 'visible' }).catch(() => {})
  ]);

  const isSetup = await setupBtn.isVisible();
  if (isSetup) {
    await page.fill('#login-username', username);
    await page.fill('#login-password', password);
    await setupBtn.click();
  } else {
    await page.fill('#login-username', username);
    await page.fill('#login-password', password);
    await loginBtn.click();
  }
  await expect(page).toHaveURL('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Custom Formations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can create a custom formation', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for drag and drop sequence
    await page.getByRole('link', { name: 'Create Formation' }).click();
    await expect(page).toHaveURL('/builder');

    await page.fill('input[placeholder="e.g. 4-4-2"]', 'My Custom Formation');
    await page.selectOption('select', '7v7');

    const dropzone = page.getByTestId('formation-field');
    
    // Use 7 unique positions to avoid any issues with dragging the same source repeatedly
    const positions = [
      { label: 'GK', x: 200, y: 600 },
      { label: 'LB', x: 50, y: 450 },
      { label: 'RB', x: 350, y: 450 },
      { label: 'CB', x: 200, y: 450 },
      { label: 'LM', x: 50, y: 250 },
      { label: 'RM', x: 350, y: 250 },
      { label: 'ST', x: 200, y: 100 },
    ];
    
    for (const pos of positions) {
      // Manual drag and drop injection for HTML5 DnD reliability
      await page.evaluate(({ label, x, y }) => {
        const source = document.querySelector(`[data-testid="drag-pos-${label}"]`);
        const target = document.querySelector(`[data-testid="formation-field"]`);
        if (!source || !target) return;

        const rect = target.getBoundingClientRect();
        const clientX = rect.left + x;
        const clientY = rect.top + y;

        // Mock dataTransfer
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', JSON.stringify({ 
          source: 'sidebar', 
          label: label,
          name: label
        }));
        
        // 1. Dragstart
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        });
        source.dispatchEvent(dragStartEvent);

        // 2. Dragover (some drop handlers require this to be canceled/dispatched)
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientX,
          clientY
        });
        target.dispatchEvent(dragOverEvent);

        // 3. Drop
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientX,
          clientY
        });
        target.dispatchEvent(dropEvent);
      }, { label: pos.label, x: pos.x, y: pos.y });
    }

    await page.getByRole('button', { name: 'Save Formation' }).click();
    await expect(page).toHaveURL('/');
    
    await expect(page.getByText('My Custom Formation')).toBeVisible();
  });

  test('validates duplicate formation names', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Formation' }).click();
    
    // System default
    await page.fill('input[placeholder="e.g. 4-4-2"]', '4-3-3');
    await expect(page.getByText('Name already exists!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Formation' })).toBeDisabled();
  });

  test('can preview and delete a formation', async ({ page }) => {
    // We expect "My Custom Formation" to exist from the previous test (since we don't wipe between tests in a file)
    // Actually, workers=1 ensures sequentiality.
    
    await expect(page.getByText('My Custom Formation')).toBeVisible();
    
    // Preview
    await page.locator('li', { hasText: 'My Custom Formation' }).getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByRole('heading', { name: 'My Custom Formation' })).toBeVisible();
    await page.getByRole('button', { name: 'Close Preview' }).click();

    // Delete
    page.on('dialog', dialog => dialog.accept());
    await page.locator('li', { hasText: 'My Custom Formation' }).getByRole('button', { name: 'Delete Formation' }).click();
    await expect(page.getByText('My Custom Formation')).not.toBeVisible();
  });
});
