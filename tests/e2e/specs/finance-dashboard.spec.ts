import { test, expect } from '@playwright/test'

test.describe('finance dashboard shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance')
  })

  test('renders the global filter bar and six component slots', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Finance Dashboard' })).toBeVisible()

    // Global filters
    await expect(page.getByText('Date Range')).toBeVisible()
    await expect(page.getByText('Transaction Types')).toBeVisible()
    await expect(page.locator('.kind-toggle-label')).toHaveText('Kind')

    // Six named slots with placeholder content
    await expect(page.getByTestId('summary-bar-slot')).toContainText('Summary Bar')
    await expect(page.getByTestId('budget-status-slot')).toContainText('Budget Status')
    await expect(page.getByTestId('spend-breakdown-slot')).toContainText('Spend Breakdown')
    await expect(page.getByTestId('transaction-list-slot')).toContainText('Transaction List')
    await expect(page.getByTestId('income-expense-chart-slot')).toContainText(
      'Income vs. Expense Chart',
    )
    await expect(page.getByTestId('nlq-panel-slot')).toContainText('NLQ Panel')
  })

  test('kind toggle updates the shared filter state and placeholders', async ({ page }) => {
    const summarySlot = page.getByTestId('summary-bar-slot')

    await expect(summarySlot).toContainText('Current kind filter: all')

    await page.getByRole('button', { name: 'Income' }).click()
    await expect(summarySlot).toContainText('Current kind filter: income')

    await page.getByRole('button', { name: 'Expense' }).click()
    await expect(summarySlot).toContainText('Current kind filter: expense')

    await page.getByRole('button', { name: 'All' }).click()
    await expect(summarySlot).toContainText('Current kind filter: all')
  })

  test('transaction type multi-select updates the shared filter state', async ({ page }) => {
    const nlqSlot = page.getByTestId('nlq-panel-slot')
    await expect(nlqSlot).toContainText('Selected types: All types')

    // Open the dropdown and select two types.
    const dropdown = page.locator('.transaction-type-filter .dropdown-trigger').first()
    await dropdown.click()

    const firstOption = page.locator('.dropdown-option').first()
    const secondOption = page.locator('.dropdown-option').nth(1)
    const firstName = await firstOption.textContent()
    const secondName = await secondOption.textContent()

    await firstOption.click()
    await secondOption.click()

    expect(firstName).toBeTruthy()
    expect(secondName).toBeTruthy()
    await expect(nlqSlot).toContainText(`Selected types: ${firstName}, ${secondName}`)

    // Remove the first selected pill.
    await page
      .locator('.selected-pill-container .pill', { hasText: firstName! })
      .locator('.pill-close')
      .click()

    await expect(nlqSlot).toContainText(`Selected types: ${secondName}`)
  })

  test('reset button appears when filters differ from defaults', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible()

    await page.getByRole('button', { name: 'Income' }).click()
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()

    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible()
    await expect(page.getByTestId('summary-bar-slot')).toContainText('Current kind filter: all')
  })

  test('navigation links to Transaction Entry and Query History work', async ({ page }) => {
    await page.getByRole('link', { name: 'New Transaction' }).click()
    await expect(page.getByRole('heading', { name: 'Transaction Entry' })).toBeVisible()
    await expect(page.getByText('This screen will be built in task 274')).toBeVisible()

    await page.getByRole('link', { name: 'Back to Dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Finance Dashboard' })).toBeVisible()

    await page.getByRole('link', { name: 'Query History' }).click()
    await expect(page.getByRole('heading', { name: 'Query History' })).toBeVisible()
    await expect(page.getByText('This screen will be built in task 282')).toBeVisible()
  })

  test('date range picker can select a new range', async ({ page }) => {
    const dateInput = page.locator('.date-range-picker input').first()
    await expect(dateInput).toBeVisible()

    const originalValue = await dateInput.inputValue()
    await dateInput.click()

    const calendarCells = page.locator('.dp__calendar_item .dp__cell_inner')
    await expect(calendarCells.first()).toBeVisible()

    // Select the first and last visible day cells to form a new range.
    const firstCell = calendarCells.first()
    const lastCell = calendarCells.last()
    await firstCell.click()
    await lastCell.click()

    // Close the calendar so the input value settles.
    await page.keyboard.press('Escape')

    const newValue = await dateInput.inputValue()
    expect(newValue).not.toBe(originalValue)
    expect(newValue).not.toBe('')
  })

  test('per-slot error toggle isolates a failing slot from the rest of the dashboard', async ({
    page,
  }) => {
    const targetSlot = page.getByTestId('spend-breakdown-slot')

    await expect(targetSlot).toContainText('Spend Breakdown')
    await targetSlot.getByRole('button', { name: 'Throw Error' }).click()

    await expect(targetSlot).toContainText('Something went wrong')
    await expect(targetSlot).toContainText('Try again')

    await expect(page.getByTestId('summary-bar-slot')).toContainText('Summary Bar')
    await expect(page.getByTestId('budget-status-slot')).toContainText('Budget Status')
    await expect(page.getByTestId('transaction-list-slot')).toContainText('Transaction List')
    await expect(page.getByTestId('income-expense-chart-slot')).toContainText(
      'Income vs. Expense Chart',
    )
    await expect(page.getByTestId('nlq-panel-slot')).toContainText('NLQ Panel')

    await targetSlot.getByRole('button', { name: 'Try again' }).click()
    await expect(targetSlot).toContainText('Spend Breakdown')
  })

  test('error boundary isolates a failing slot from the rest of the dashboard', async ({
    page,
  }) => {
    await page.goto('/finance/error-test')

    await expect(page.getByTestId('faulty-slot')).toContainText('Something went wrong')
    await expect(page.getByTestId('faulty-slot')).toContainText('Try again')
    await expect(page.getByTestId('healthy-slot')).toContainText('Healthy slot rendered')
  })
})
