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

    // Six named slots render their components.
    await expect(page.getByTestId('summary-bar-slot')).toContainText('Total Income')
    await expect(page.getByTestId('budget-status-slot')).toContainText('Budget Status')
    await expect(page.getByTestId('spend-breakdown-slot')).toContainText('Spend Breakdown')
    await expect(page.getByTestId('transaction-list-slot')).toContainText('Transaction List')
    await expect(page.getByTestId('income-expense-chart-slot')).toContainText(
      'Income vs. Expense Chart',
    )
    await expect(page.getByTestId('nlq-panel-slot')).toContainText('NLQ Panel')
  })

  test('kind toggle updates the shared filter state and summary values', async ({ page }) => {
    const summarySlot = page.getByTestId('summary-bar-slot')

    await expect(summarySlot).toContainText('Total Income')
    await expect(summarySlot).toContainText('₹5,000')
    await expect(summarySlot).toContainText('₹2,445')

    await page.getByRole('button', { name: 'Income' }).click()
    await expect(summarySlot).toContainText('Total Income')
    await expect(summarySlot).toContainText('₹5,000')
    await expect(summarySlot).not.toContainText('₹2,445')

    await page.getByRole('button', { name: 'Expense' }).click()
    await expect(summarySlot).toContainText('Total Expense')
    await expect(summarySlot).toContainText('₹2,445')
    await expect(summarySlot).not.toContainText('₹5,000')

    await page.getByRole('button', { name: 'All' }).click()
    await expect(summarySlot).toContainText('Total Income')
    await expect(summarySlot).toContainText('₹5,000')
    await expect(summarySlot).toContainText('₹2,445')
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
    await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/active/)
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

    await expect(page.getByTestId('summary-bar-slot')).toContainText('Total Income')
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

  test('spend breakdown renders donut chart and legend for default seed data', async ({ page }) => {
    const slot = page.getByTestId('spend-breakdown-slot')

    await expect(slot.getByTestId('spend-breakdown-chart')).toBeVisible()
    await expect(slot.getByTestId('spend-breakdown-legend')).toBeVisible()

    const legendItems = slot.getByTestId('spend-breakdown-legend-item')
    await expect(legendItems).toHaveCount(3)

    await expect(slot).toContainText('Need')
    await expect(slot).toContainText('Want')
    await expect(slot).toContainText('Investment')
  })

  test('spend breakdown shows empty state when income kind is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click()

    const slot = page.getByTestId('spend-breakdown-slot')
    await expect(slot.getByTestId('spend-breakdown-empty')).toBeVisible()
    await expect(slot).toContainText('No expense data')
  })

  test('spend breakdown shows empty state when date range has no transactions', async ({ page }) => {
    const dateInput = page.locator('.date-range-picker input').first()
    await dateInput.click()

    const previousMonthButton = page.locator('[data-dp-element="action-prev"]').first()
    await expect(previousMonthButton).toBeVisible()

    // Move several months into the past so no seeded transactions fall inside the range.
    await previousMonthButton.click()
    await previousMonthButton.click()
    await previousMonthButton.click()

    const calendarCells = page.locator('.dp__calendar_item .dp__cell_inner')
    await expect(calendarCells.first()).toBeVisible()

    const firstCell = calendarCells.first()
    const secondCell = calendarCells.nth(1)
    await firstCell.click()
    await secondCell.click()

    await page.keyboard.press('Escape')

    const slot = page.getByTestId('spend-breakdown-slot')
    await expect(slot.getByTestId('spend-breakdown-empty')).toBeVisible()
    await expect(slot).toContainText('No expense data')
  })

  test('transaction list renders all seeded rows sorted by date descending', async ({ page }) => {
    const slot = page.getByTestId('transaction-list-slot')
    const rows = slot.getByTestId('transaction-list-row')

    await expect(rows).toHaveCount(8)

    const firstRowDate = await rows.first().locator('td').first().textContent()
    const lastRowDate = await rows.last().locator('td').first().textContent()
    expect(firstRowDate).toBeTruthy()
    expect(lastRowDate).toBeTruthy()

    const firstDate = new Date(firstRowDate!)
    const lastDate = new Date(lastRowDate!)
    expect(firstDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime())
  })

  test('transaction list pagination shows page count and boundary states', async ({ page }) => {
    const slot = page.getByTestId('transaction-list-slot')

    await expect(slot.getByTestId('transaction-list-page-info')).toHaveText('Page 1 of 1')
    await expect(slot.getByTestId('transaction-list-previous')).toBeDisabled()
    await expect(slot.getByTestId('transaction-list-next')).toBeDisabled()
  })

  test('transaction list filters to income only and resets pagination', async ({ page }) => {
    const slot = page.getByTestId('transaction-list-slot')

    await page.getByRole('button', { name: 'Income' }).click()

    const rows = slot.getByTestId('transaction-list-row')
    await expect(rows).toHaveCount(1)
    await expect(slot).toContainText('Monthly salary deposit')

    await expect(slot.getByTestId('transaction-list-page-info')).toHaveText('Page 1 of 1')
  })

  test('transaction list shows empty state when date range has no transactions', async ({ page }) => {
    const dateInput = page.locator('.date-range-picker input').first()
    await dateInput.click()

    const previousMonthButton = page.locator('[data-dp-element="action-prev"]').first()
    await expect(previousMonthButton).toBeVisible()

    // Move several months into the past so no seeded transactions fall inside the range.
    await previousMonthButton.click()
    await previousMonthButton.click()
    await previousMonthButton.click()

    const calendarCells = page.locator('.dp__calendar_item .dp__cell_inner')
    await expect(calendarCells.first()).toBeVisible()

    const firstCell = calendarCells.first()
    const secondCell = calendarCells.nth(1)
    await firstCell.click()
    await secondCell.click()

    await page.keyboard.press('Escape')

    const slot = page.getByTestId('transaction-list-slot')
    await expect(slot.getByTestId('transaction-list-empty')).toBeVisible()
    await expect(slot).toContainText('No transactions match the current filters')
  })
})
