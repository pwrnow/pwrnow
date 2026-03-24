import { test, expect } from '@playwright/test';

test('app builds and starts', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});
