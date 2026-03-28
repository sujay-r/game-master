import { test, expect } from '@playwright/test';


test.describe('task creation', () => {
  test('task due today', async ({ page }) => {
    // Test runs on HUDView
    await page.goto('/');

    // Click the quick add button
    await page.locator('.quick-add-button').click();

    // Wait for task create modal to show up
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    // Fill the task details
    await page.getByLabel('Title').fill("task due today");

    await page.locator('.form-group').filter({ hasText: 'Description' }).locator('.tiptap').click();
    await page.locator('.form-group').filter({ hasText: 'Description' }).locator('.tiptap').fill('This is a task description');

    await page.locator('.form-group').filter({ hasText: 'Notes' }).locator('.tiptap').click();
    await page.locator('.form-group').filter({ hasText: 'Notes' }).locator('.tiptap').fill('Task notes testing 123');
    await page.getByLabel('Due Date').fill(new Date().toISOString().split('T')[0]);

    // Click on create button
    await page.getByRole('button', { name: /create task/i }).click();

    // Check for presence of task card
    await page.locator('.unassigned-category').waitFor({ state: 'visible' });

    // Check for the particular task
    await expect(page.locator('.task-title', { hasText: 'task due today' })).toBeVisible();
  })
})
