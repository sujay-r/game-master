import { test, expect } from '@playwright/test';
import { getOTP, clearMailpit } from './helpers/mailpit';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('login journey', () => {
  test.beforeEach(async () => {
    await clearMailpit();
  })

  test('login journey', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
    await page.getByRole('button', { name: /send otp/i }).click();

    const otp = await getOTP();

    await page.locator('.otp-container').waitFor({ state: 'visible', timeout: 6000 });
    const otpInputs = page.locator('.otp-input');
    await otpInputs.nth(0).waitFor({ state: 'visible' });
    for (let i = 0; i < otp.length; i++) {
      await otpInputs.nth(i).fill(otp[i]);
    }

    await page.getByRole('button', { name: /verify/i }).click();
    await expect(page).toHaveURL('/');
  });
})
