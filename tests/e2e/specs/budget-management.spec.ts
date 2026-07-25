import { test, expect } from '@playwright/test'

test.describe('budget management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/budgets')
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible()
  })

  test('renders seeded budgets with type, amount, period, and percentage', async ({ page }) => {
    const rows = page.getByTestId('budget-list-row')
    await expect(rows).toHaveCount(3)

    await expect(page.getByTestId('budget-list-type')).toContainText('Need')
    await expect(page.getByTestId('budget-list-type')).toContainText('Want')
    await expect(page.getByTestId('budget-list-type')).toContainText('Investment')

    await expect(page.getByTestId('budget-list-amount')).toContainText('₹2,000')
    await expect(page.getByTestId('budget-list-amount')).toContainText('₹500')
    await expect(page.getByTestId('budget-list-amount')).toContainText('₹1,000')

    await expect(page.getByTestId('budget-list-period')).toContainText('Monthly')

    await expect(page.getByTestId('budget-list-percentage')).toContainText('40%')
    await expect(page.getByTestId('budget-list-percentage')).toContainText('10%')
    await expect(page.getByTestId('budget-list-percentage')).toContainText('20%')
  })

  test('shows empty state when no budgets exist', async ({ page }) => {
    await page.goto('/finance/budgets')

    // Delete all seeded budgets one by one.
    while ((await page.getByTestId('budget-list-row').count()) > 0) {
      page.on('dialog', (dialog) => dialog.accept())
      await page.getByTestId('budget-list-delete').first().click()
      await page.waitForTimeout(100)
    }

    await expect(page.getByTestId('budget-empty-state')).toBeVisible()
    await expect(page.getByTestId('budget-empty-state')).toContainText('No budgets yet')
  })

  test('create form shows latest income and syncs percentage with amount', async ({ page }) => {
    await page.getByTestId('budget-new-button').click()
    await expect(page.getByRole('heading', { name: 'New Budget' })).toBeVisible()

    await expect(page.getByTestId('budget-form-income-baseline')).toContainText('Latest income')
    await expect(page.getByTestId('budget-form-income-baseline')).toContainText('₹5,000')

    await page.getByTestId('budget-form-percentage-slider').fill('50')
    await expect(page.getByTestId('budget-form-amount')).toHaveValue('2500')

    await page.getByTestId('budget-form-amount').fill('1000')
    await expect(page.getByTestId('budget-form-percentage-number')).toHaveValue('20')
  })

  test('creates a budget and returns to the list', async ({ page }) => {
    await page.getByTestId('budget-new-button').click()

    await page.getByTestId('budget-form-type').selectOption('Want')
    await page.getByTestId('budget-form-percentage-slider').fill('50')

    await page.getByTestId('budget-form-submit').click()

    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible()
    await expect(page.getByTestId('budget-list-amount')).toContainText('₹2,500')
  })

  test('edits a budget and reflects changes in the list', async ({ page }) => {
    await page.getByTestId('budget-list-row').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Budget' })).toBeVisible()

    await page.getByTestId('budget-form-amount').fill('3000')
    await page.getByTestId('budget-form-submit').click()

    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible()
    await expect(page.getByTestId('budget-list-amount')).toContainText('₹3,000')
  })

  test('deletes a budget after confirmation', async ({ page }) => {
    const initialCount = await page.getByTestId('budget-list-row').count()
    expect(initialCount).toBeGreaterThan(0)

    page.on('dialog', (dialog) => dialog.accept())
    await page.getByTestId('budget-list-delete').first().click()

    await expect(page.getByTestId('budget-list-row')).toHaveCount(initialCount - 1)
  })

  test('navigates from dashboard Budget Status to budget management', async ({ page }) => {
    await page.goto('/finance')
    const budgetStatus = page.getByTestId('budget-status')
    await expect(budgetStatus).toBeVisible()

    await budgetStatus.getByRole('link', { name: 'Manage Budgets' }).click()
    await page.waitForURL('/finance/budgets')
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible()
  })
})
