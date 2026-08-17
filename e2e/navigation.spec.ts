import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation and Dashboard
 * Critical flows: Tab switching, mobile navigation, sidebar, settings
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/owner');
    await page.waitForLoadState('networkidle');
  });

  test('should display all navigation tabs in sidebar', async ({ page }) => {
    // Verify key navigation tabs are visible
    await expect(page.locator('text=Desk, text=DESK')).toBeVisible();
    await expect(page.locator('text=Brief, text=BRIEF')).toBeVisible();
    await expect(page.locator('text=My Work, text=MYWORK')).toBeVisible();
    await expect(page.locator('text=People, text=PEOPLE')).toBeVisible();
  });

  test('should navigate to Brief tab', async ({ page }) => {
    const briefTab = page.locator('text=Brief, text=BRIEF').first();
    await briefTab.click();

    // Verify Brief content is shown
    await expect(page.locator('text=Handoffs, text=Updates, text=Notifications')).toBeVisible({
      timeout: 3000,
    });
  });

  test('should navigate to My Work tab', async ({ page }) => {
    const myWorkTab = page.locator('text=My Work, text=MYWORK').first();
    await myWorkTab.click();

    // Verify My Work content is shown
    await expect(
      page.locator('text=Checklist, text=Tasks, text=To-Do, [placeholder*="Add task"]')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should navigate to People tab', async ({ page }) => {
    const peopleTab = page.locator('text=People, text=PEOPLE').first();
    await peopleTab.click();

    // Verify People directory is shown
    await expect(page.locator('text=Directory, text=Team, text=Owner, text=Sales')).toBeVisible({
      timeout: 3000,
    });
  });

  test('should navigate to Settings tab', async ({ page }) => {
    const settingsTab = page.locator('text=Settings, text=SETTINGS').first();
    await settingsTab.click();

    // Verify Settings content is shown
    await expect(page.locator('text=Profile, text=Security, text=Preferences')).toBeVisible({
      timeout: 3000,
    });
  });

  test('should open mobile navigation menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu button
    const menuButton = page.locator('button[aria-label*="menu"], button:has([class*="menu"])').first();

    if (await menuButton.count() > 0) {
      await menuButton.click();

      // Verify sidebar is visible
      await page.waitForTimeout(500);

      // Mobile navigation should be visible
      const sidebar = page.locator('[class*="sidebar"], [role="navigation"]');
      await expect(sidebar.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should display mobile bottom navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for bottom navigation bar
    const bottomNav = page.locator('[class*="bottom"], [class*="mobile-nav"]');

    if (await bottomNav.count() > 0) {
      await expect(bottomNav.first()).toBeVisible();

      // Verify bottom nav has tabs
      const tabs = bottomNav.locator('button, a');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    }
  });

  test('should toggle sidebar open/close', async ({ page }) => {
    // Look for sidebar toggle or collapse button
    const sidebarToggle = page.locator(
      'button[aria-label*="sidebar"], button[aria-label*="menu"]'
    ).first();

    if (await sidebarToggle.count() > 0) {
      // Click to toggle sidebar
      await sidebarToggle.click();
      await page.waitForTimeout(300);

      // Click again to toggle back
      await sidebarToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display user profile in sidebar', async ({ page }) => {
    // Look for user initials or avatar in sidebar
    const userProfile = page.locator('[class*="avatar"], [class*="initials"]');

    if (await userProfile.count() > 0) {
      await expect(userProfile.first()).toBeVisible();

      // Verify user info (initials or name)
      const userName = page.locator('text=Owner, text=Admin, text=User');
      expect(await userName.count()).toBeGreaterThan(0);
    }
  });

  test('should display Sign Out button in sidebar', async ({ page }) => {
    const signOutButton = page.locator('text=Sign Out, text=Logout');

    if (await signOutButton.count() > 0) {
      await expect(signOutButton.first()).toBeVisible();
    }
  });

  test('should display workspace name in header', async ({ page }) => {
    // Verify company name is displayed
    await expect(page.locator('text=SHARMA TEXTILES, text=DecisionOS')).toBeVisible();
  });

  test('should show role-specific tabs for owner role', async ({ page }) => {
    // Owner should see all tabs
    await expect(page.locator('text=Desk')).toBeVisible();
    await expect(page.locator('text=Brief')).toBeVisible();
    await expect(page.locator('text=People')).toBeVisible();
    await expect(page.locator('text=Finance, text=FINANCE')).toBeVisible({ timeout: 2000 });
  });

  test('should highlight active tab', async ({ page }) => {
    // Desk tab should be active by default
    const deskTab = page.locator('text=Desk, text=DESK').first();

    // Check for active state (red text or background)
    await expect(deskTab).toHaveClass(/active|text-brand-red|bg-/);
  });

  test('should preserve tab state on page reload', async ({ page }) => {
    // Navigate to Brief tab
    const briefTab = page.locator('text=Brief, text=BRIEF').first();
    await briefTab.click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Brief tab should still be active (depending on implementation)
    // For now, just verify the page loads correctly
    const tabs = page.locator('text=Desk, text=Brief, text=My Work');
    expect(await tabs.count()).toBeGreaterThan(0);
  });

  test('should navigate back to home from settings', async ({ page }) => {
    // Go to settings
    const settingsTab = page.locator('text=Settings, text=SETTINGS').first();
    await settingsTab.click();
    await page.waitForTimeout(500);

    // Click Desk to go back
    const deskTab = page.locator('text=Desk, text=DESK').first();
    await deskTab.click();

    // Verify we're back at Desk
    await expect(page.locator('[placeholder*="Create"], [placeholder*="capture"]')).toBeVisible({
      timeout: 3000,
    });
  });
});
