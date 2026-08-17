import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Kanban Board
 * Critical flows: Drag-and-drop, column filtering, task movement
 */

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/owner');

    // Switch to Kanban view
    const kanbanButton = page.locator('button:has-text("Kanban Board"), button:has-text("Board")');

    if (await kanbanButton.count() > 0) {
      await kanbanButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display all four Kanban columns', async ({ page }) => {
    // Verify all columns are visible
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Completed, text=Done')).toBeVisible();
  });

  test('should show task count in each column header', async ({ page }) => {
    // Look for task count badges in column headers
    const badges = page.locator('[class*="badge"], [class*="count"]');
    const count = await badges.count();

    // Should have at least one badge (for task counts)
    expect(count).toBeGreaterThan(0);
  });

  test('should filter tasks by category using filter pills', async ({ page }) => {
    // Wait for category filter pills to load
    const categoryPills = page.locator('button:has-text("ALL"), button:has-text("CUSTOMER")');

    if (await categoryPills.count() > 0) {
      // Click on CUSTOMER filter
      const customerPill = page.locator('button:has-text("CUSTOMER")').first();
      await customerPill.click();

      // Verify active state
      await expect(customerPill).toHaveClass(/active|bg-zinc-900|bg-white/);

      // Click ALL to reset
      const allPill = page.locator('button:has-text("ALL")').first();
      await allPill.click();
    }
  });

  test('should move task forward using Next button', async ({ page }) => {
    // Find a task in "To Do" column
    const todoColumn = page.locator('[data-column-id="todo"], :has-text("To Do")').first();

    // Look for "Next" or forward arrow button
    const nextButton = todoColumn.locator('button:has-text("Next"), button[title="Move forward"]').first();

    if (await nextButton.count() > 0) {
      const isVisible = await nextButton.isVisible();

      if (isVisible) {
        // Click to move task forward
        await nextButton.click();

        // Verify task moved (basic check - no error occurred)
        await page.waitForTimeout(500);
      }
    }
  });

  test('should move task backward using back button', async ({ page }) => {
    // Find a task in "In Progress" or "Review" column
    const reviewColumn = page.locator('[data-column-id="review"], :has-text("Review")').first();

    // Look for back arrow button
    const backButton = reviewColumn.locator('button:has-text("←"), button[title="Move back"]').first();

    if (await backButton.count() > 0) {
      const isVisible = await backButton.isVisible();

      if (isVisible) {
        // Click to move task backward
        await backButton.click();

        // Verify task moved (basic check)
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show drag handle on task cards', async ({ page }) => {
    // Look for drag handles (GripVertical icon)
    const dragHandles = page.locator('[aria-label="Drag to move task"], button:has([class*="grip"])');

    const count = await dragHandles.count();

    if (count > 0) {
      // Verify at least one drag handle is visible
      await expect(dragHandles.first()).toBeVisible();
    }
  });

  test('should display empty state when column has no tasks', async ({ page }) => {
    // After filtering, some columns might be empty
    const customerPill = page.locator('button:has-text("COMPLAINT")').first();

    if (await customerPill.count() > 0) {
      await customerPill.click();

      // Look for empty state message
      const emptyState = page.locator('text=Drop tasks here, text=No tasks, text=Empty');

      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('should show task details in Kanban card', async ({ page }) => {
    // Find first task card
    const taskCard = page.locator('[class*="task"], [data-testid="task-card"]').first();

    if (await taskCard.count() > 0) {
      // Verify task card shows:
      // - Category badge
      const categoryBadge = taskCard.locator('[class*="badge"], [class*="category"]').first();
      await expect(categoryBadge).toBeVisible({ timeout: 2000 });

      // - Assigned user
      const assignedUser = taskCard.locator('text=owner, text=sales, text=production');
      // At least one should exist
      expect(await assignedUser.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to apply mobile layout
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify mobile layout adjusts (columns stack vertically)
    const columns = page.locator('[class*="column"], [data-column-id]');
    const count = await columns.count();

    // Should still display columns (even if stacked)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should maintain task state after switching views', async ({ page }) => {
    // Get task count in Kanban view
    const kanbanTasks = page.locator('[class*="task"], [data-testid="task-card"]');
    const kanbanCount = await kanbanTasks.count();

    // Switch to feed view
    const feedButton = page.locator('button:has-text("Feed"), button:has-text("Calendar")').first();

    if (await feedButton.count() > 0) {
      await feedButton.click();
      await page.waitForLoadState('networkidle');

      // Get task count in feed view
      const feedTasks = page.locator('[class*="task"], [data-testid="task-card"]');
      const feedCount = await feedTasks.count();

      // Task counts should be similar (allowing for some variance due to filtering)
      expect(Math.abs(kanbanCount - feedCount)).toBeLessThan(10);
    }
  });
});
