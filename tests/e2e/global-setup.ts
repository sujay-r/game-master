import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { getOTP } from './helpers/mailpit';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!;
const AUTH_FILE = 'tests/e2e/.auth/user.json';

export default async function globalSetup(config: FullConfig) {
  // Ensure auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/login');
  await page.getByLabel('Email').fill(TEST_USER_EMAIL);
  await page.getByRole('button', { name: /send otp/i }).click();

  const otp = await getOTP();

  await page.locator('.otp-container').waitFor({ state: 'visible' });
  const otpInputs = page.locator('.otp-input');
  await otpInputs.nth(0).waitFor({ state: 'visible' });
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }
  await page.getByRole('button', { name: /verify/i }).click();

  await page.waitForURL('http://localhost:5173/');

  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
}
