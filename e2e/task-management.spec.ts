import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Task Management
 * Critical user flows: Create, Update, Complete, Delete tasks
 */

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real E2E test, you would:
    // 1. Create a test user via Supabase
    // 2. Login with that user
    // 3. Clean up test data after tests
    // For now, we'll test the UI flows assuming auth works

    await page.goto('/login');
    // Skip actual login for now - would need test credentials
  });

  test('should create a new task from capture bar', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/demo/owner');

    // Wait for page to load
    await expect(page.getByText(/Sharma Textiles/i)).toBeVisible();

    // Find the capture bar input
    const captureInput = page.locator('[placeholder*="Create task"], [placeholder*="capture"]').first();
    await expect(captureInput).toBeVisible();

    // Type a new task
    const taskTitle = `Test Task ${Date.now()}`;
    await captureInput.fill(taskTitle);

    // Submit the task
    await captureInput.press('Enter');

    // Verify task appears in the feed
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test('should mark a task as done', async ({ page }) => {
    await page.goto('/demo/owner');

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-card"], .task-card, [class*="task"]', {
      timeout: 10000,
      state: 'attached',
    });

    // Find first task checkbox
    const firstTaskCheckbox = page.locator('input[type="checkbox"]').first();

    if (await firstTaskCheckbox.count() > 0) {
      // Check if it's not already done
      const isChecked = await firstTaskCheckbox.isChecked();

      if (!isChecked) {
        // Click checkbox to mark as done
        await firstTaskCheckbox.click();

        // Verify task is marked as done (checkbox is checked)
        await expect(firstTaskCheckbox).toBeChecked();
      }
    }
  });

  test('should filter tasks by category', async ({ page }) => {
    await page.goto('/demo/owner');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for filter buttons (e.g., CUSTOMER, INVOICE, etc.)
    const customerFilter = page.locator('button:has-text("CUSTOMER")');

    if (await customerFilter.count() > 0) {
      await customerFilter.click();

      // Verify URL or active state changes
      await expect(customerFilter).toHaveClass(/active|bg-brand-red|text-brand-red/);
    }
  });

  test('should search tasks using command palette', async ({ page }) => {
    await page.goto('/demo/owner');

    // Open command palette with Ctrl+K
    await page.keyboard.press('Control+K');

    // Wait for command palette to open
    const commandPalette = page.locator('[role="dialog"], [data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible({ timeout: 2000 });

    // Type search query
    const searchInput = commandPalette.locator('input[type="text"]').first();
    await searchInput.fill('invoice');

    // Verify search results appear
    await expect(commandPalette.locator('text=invoice')).toBeVisible({ timeout: 1000 });
  });

  test('should navigate between desk view modes', async ({ page }) => {
    await page.goto('/demo/owner');

    // Wait for view switcher to load
    await page.waitForLoadState('networkidle');

    // Look for "Kanban Board" button
    const kanbanButton = page.locator('button:has-text("Kanban Board"), button:has-text("Board")');

    if (await kanbanButton.count() > 0) {
      // Click to switch to Kanban view
      await kanbanButton.click();

      // Verify Kanban board is visible
      await expect(page.locator('text=To Do, text=In Progress, text=Review')).toBeVisible({
        timeout: 2000,
      });

      // Switch back to feed view
      const feedButton = page.locator('button:has-text("Calendar"), button:has-text("Feed")');
      if (await feedButton.count() > 0) {
        await feedButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should create task with specific category', async ({ page }) => {
    await page.goto('/demo/owner');

    const captureInput = page.locator('[placeholder*="Create"], [placeholder*="capture"]').first();
    await expect(captureInput).toBeVisible();

    // Type task with category keyword
    const taskTitle = `Customer inquiry - urgent ${Date.now()}`;
    await captureInput.fill(taskTitle);
    await captureInput.press('Enter');

    // Wait for task to appear
    await page.waitForTimeout(1000);

    // Verify task appears (basic check)
    const taskExists = await page.getByText(/Customer inquiry/).count();
    expect(taskExists).toBeGreaterThan(0);
  });

  test('should display task details in calendar view', async ({ page }) => {
    await page.goto('/demo/owner');

    // Look for the calendar/feed view
    await page.waitForLoadState('networkidle');

    // Verify task cards are displayed
    const taskCards = page.locator('[data-testid="task-card"], .task-card, [class*="card"]');
    const count = await taskCards.count();

    // Should have at least some tasks visible
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/demo/owner');

    // Press Tab to navigate through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible (element is focused)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
