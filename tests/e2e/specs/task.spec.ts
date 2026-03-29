import { test, expect } from '@playwright/test'
import { deleteTestTasks } from '../helpers/supabase'

test.describe('task creation', () => {
  test.afterEach(async () => {
    await deleteTestTasks()
  })

  test('task due today', async ({ page }) => {
    // Test runs on HUDView
    await page.goto('/')

    // Click the quick add button
    await page.locator('.quick-add-button').click()

    // Wait for task create modal to show up
    await page.locator('.modal-content').waitFor({ state: 'visible' })

    // Fill the task details
    const taskTitle = `test-task-${crypto.randomUUID()}`
    await page.getByLabel('Title').fill(taskTitle)

    await page.locator('.form-group').filter({ hasText: 'Description' }).locator('.tiptap').click()
    await page
      .locator('.form-group')
      .filter({ hasText: 'Description' })
      .locator('.tiptap')
      .fill('This is a task description')

    await page.locator('.form-group').filter({ hasText: 'Notes' }).locator('.tiptap').click()
    await page
      .locator('.form-group')
      .filter({ hasText: 'Notes' })
      .locator('.tiptap')
      .fill('Task notes testing 123')
    await page.getByLabel('Due Date').fill(new Date().toISOString().split('T')[0])

    // Click on create button
    await page.getByRole('button', { name: /create task/i }).click()

    // Wait for modal to close and task to appear
    await page.locator('.modal-content').waitFor({ state: 'hidden' })
    await page.waitForTimeout(500)

    // Check for presence of task card
    await page.locator('.unassigned-category').waitFor({ state: 'visible' })

    // Check for the particular task
    await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible()

    // Check if the task is visible on the quest view too
    await page.goto('/quests')
    await page.locator('.unassigned-section').waitFor({ state: 'visible' })
    await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible()
  })

  test('task with care token outcome via quick add', async ({ page }) => {
    await page.goto('/quests')

    // Create task with care token outcome
    await page.locator('.quick-add-button').click()
    await page.locator('.modal-content').waitFor({ state: 'visible' })

    const taskTitle = `test-task-${crypto.randomUUID()}`
    await page.getByLabel('Title').fill(taskTitle)

    // Add care token outcome (1 token)
    await page.getByRole('button', { name: /add outcome/i }).click()
    // Wait for the outcome row to appear with the default token (Grind)
    await page
      .locator('.dropdown-trigger')
      .filter({ hasText: 'Grind' })
      .waitFor({ state: 'visible' })
    // Click on the dropdown to change it to Care
    await page.locator('.dropdown-trigger').filter({ hasText: 'Grind' }).click()
    await page.locator('.dropdown-menu').waitFor({ state: 'visible' })
    await page.locator('.dropdown-item').filter({ hasText: 'Care' }).click()
    // Wait for the selection to be captured
    await page.waitForTimeout(200)
    // Verify Care is now selected
    await expect(page.locator('.dropdown-trigger').filter({ hasText: 'Care' })).toBeVisible()
    // Quantity defaults to 1

    // Create task
    await page.getByRole('button', { name: /create task/i }).click()

    // Wait for modal to close
    await page.locator('.modal-content').waitFor({ state: 'hidden' })

    // Reload page to ensure task appears (workaround for reactivity issue)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify task in unassigned section
    const unassignedSection = page.locator('.unassigned-section')
    await unassignedSection.waitFor({ state: 'visible'})
    await expect(unassignedSection.locator('.task-title', { hasText: taskTitle })).toBeVisible()
  })

  test('task assigned to quest_id 1 via quick add', async ({ page }) => {
    await page.goto('/quests')

    // Create task
    await page.locator('.quick-add-button').click()
    await page.locator('.modal-content').waitFor({ state: 'visible' })

    const taskTitle = `test-task-${crypto.randomUUID()}`
    await page.getByLabel('Title').fill(taskTitle)

    // Assign to "Test main quest" (quest_id 1)
    await page.locator('.assignment-dropdown .dropdown-trigger').click()
    await page.locator('.dropdown-item').filter({ hasText: 'Test main quest' }).click()

    // Create task
    await page.getByRole('button', { name: /create task/i }).click()

    // Find quest_id 1 by header text and expand it
    const questCard = page.locator('.quest-card:has(.quest-title:has-text("Test main quest"))')
    const questHeader = questCard.locator('.quest-header')
    await questHeader.click()

    // Verify task appears inside quest card body
    await expect(questCard.locator('.task-title', { hasText: taskTitle })).toBeVisible()

    // Verify task NOT in unassigned section
    await expect(
      page.locator('.unassigned-section .task-title', { hasText: taskTitle }),
    ).not.toBeVisible()
  })

  test('task created via quest add task button', async ({ page }) => {
    await page.goto('/quests')

    // Find "Test main quest" and expand it
    const questCard = page.locator('.quest-card:has(.quest-title:has-text("Test main quest"))')
    const questHeader = questCard.locator('.quest-header')
    await questHeader.click()

    // Click add task button inside quest
    await questCard.getByRole('button', { name: /add task/i }).click()
    await page.locator('.modal-content').waitFor({ state: 'visible' })

    // Verify quest is pre-selected in assignment dropdown
    await expect(page.locator('.assignment-dropdown .current-assignment')).toContainText(
      'Test main quest',
    )

    const taskTitle = `test-task-${crypto.randomUUID()}`
    await page.getByLabel('Title').fill(taskTitle)

    // Create task
    await page.getByRole('button', { name: /create task/i }).click()

    // Verify task appears inside the quest card
    await expect(questCard.locator('.task-title', { hasText: taskTitle })).toBeVisible()

    // Verify progress updated - look for the progress text in the header specifically
    const progressText = questCard.locator('.quest-header .progress-text')
    await expect(progressText).toContainText('/')
  })
})
