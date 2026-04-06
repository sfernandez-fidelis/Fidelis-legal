import { expect, test } from '@playwright/test';

test('redirects guests to the login screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Fidelis Legal' })).toBeVisible();
  await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible();
});
