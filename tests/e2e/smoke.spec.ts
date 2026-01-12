import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WhatsAI/);
});

test('shows main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'WhatsAI' })).toBeVisible();
});
