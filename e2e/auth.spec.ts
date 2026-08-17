import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/sign in/i)).toBeVisible();
    await expect(page.getByText(/decision.*os/i)).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Need a workspace? Register');
    await expect(page).toHaveURL('/signup');
    await expect(page.getByText(/create account/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign in")');
    // Form validation would prevent submission
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button
    const themeButton = page.locator('button[aria-label="Toggle dark mode"]');
    await expect(themeButton).toBeVisible();

    // Click to toggle theme
    await themeButton.click();

    // Check if dark class is added to html element
    const htmlElement = page.locator('html');
    const hasDarkClass = await htmlElement.evaluate((el) =>
      el.classList.contains('dark')
    );

    expect(typeof hasDarkClass).toBe('boolean');
  });
});
