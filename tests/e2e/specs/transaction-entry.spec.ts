import { test, expect } from '@playwright/test'

test.describe('transaction entry form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/entry')
    await expect(page.getByRole('heading', { name: 'Transaction Entry' })).toBeVisible()
  })

  test('renders all form fields and seeded transaction types', async ({ page }) => {
    await expect(page.getByTestId('transaction-entry-amount')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-type')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-description')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-date')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-submit')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-cancel')).toBeVisible()

    const typeSelect = page.getByTestId('transaction-entry-type')
    const options = typeSelect.locator('option[data-testid="transaction-entry-type-option"]')
    await expect(options).toHaveCount(4)

    await expect(page.getByTestId('transaction-entry-type')).toContainText('Need')
    await expect(page.getByTestId('transaction-entry-type')).toContainText('Want')
    await expect(page.getByTestId('transaction-entry-type')).toContainText('Investment')
    await expect(page.getByTestId('transaction-entry-type')).toContainText('Income')
  })

  test('validates required fields before submission', async ({ page }) => {
    await page.getByTestId('transaction-entry-submit').click()

    await expect(page.getByTestId('transaction-entry-amount-error')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-type-error')).toBeVisible()
    await expect(page.getByTestId('transaction-entry-description-error')).toBeVisible()
  })

  test('creates a transaction and redirects to the dashboard on submit', async ({ page }) => {
    const description = `E2E test transaction ${crypto.randomUUID()}`
    const today = new Date().toISOString().split('T')[0]

    await page.getByTestId('transaction-entry-amount').fill('250')
    await page.getByTestId('transaction-entry-type').selectOption('Want')
    await page.getByTestId('transaction-entry-description').fill(description)
    await page.getByTestId('transaction-entry-date').fill(today)

    await page.getByTestId('transaction-entry-submit').click()

    await page.waitForURL('/finance')
    await expect(page.getByRole('heading', { name: 'Finance Dashboard' })).toBeVisible()

    const transactionList = page.getByTestId('transaction-list-slot')
    await expect(transactionList).toContainText(description)
    await expect(transactionList).toContainText('₹250')
  })

  test('returns to the dashboard without saving when cancelled', async ({ page }) => {
    await page.goto('/finance')
    await expect(page.getByRole('heading', { name: 'Finance Dashboard' })).toBeVisible()

    const dashboard = page.getByTestId('transaction-list-slot')
    const initialRowCount = await dashboard.getByTestId('transaction-list-row').count()

    await page.goto('/finance/entry')
    await expect(page.getByRole('heading', { name: 'Transaction Entry' })).toBeVisible()

    await page.getByTestId('transaction-entry-cancel').click()

    await page.waitForURL('/finance')
    await expect(page.getByRole('heading', { name: 'Finance Dashboard' })).toBeVisible()

    const finalRowCount = await dashboard.getByTestId('transaction-list-row').count()
    expect(finalRowCount).toBe(initialRowCount)
  })
})
