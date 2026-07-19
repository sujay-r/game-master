import { test, expect } from '@playwright/test'
import { supabase } from '../helpers/supabase'

// Note: These tests verify the foundational DB schema, seed data, and FK behavior
// for the Finance Manager data models. App-layer validation (kind guards, expense-only
// budgets) lives in TypeScript and is covered by `npm run type-check`.

test.describe('finance data models', () => {
  const createdTypeIds: number[] = []
  const createdTransactionIds: number[] = []
  const createdBudgetIds: number[] = []
  const createdQueryIds: number[] = []

  test.afterEach(async () => {
    // Clean up in dependency order to respect FK constraints.
    if (createdTransactionIds.length > 0) {
      const { error } = await supabase.from('Transaction').delete().in('id', createdTransactionIds)
      if (error) console.error(`Failed to cleanup test transactions: ${error}`)
      createdTransactionIds.length = 0
    }
    if (createdBudgetIds.length > 0) {
      const { error } = await supabase.from('Budget').delete().in('id', createdBudgetIds)
      if (error) console.error(`Failed to cleanup test budgets: ${error}`)
      createdBudgetIds.length = 0
    }
    if (createdQueryIds.length > 0) {
      const { error } = await supabase.from('UserQuery').delete().in('id', createdQueryIds)
      if (error) console.error(`Failed to cleanup test queries: ${error}`)
      createdQueryIds.length = 0
    }
    if (createdTypeIds.length > 0) {
      const { error } = await supabase.from('TransactionType').delete().in('id', createdTypeIds)
      if (error) console.error(`Failed to cleanup test transaction types: ${error}`)
      createdTypeIds.length = 0
    }
  })

  test('seeded TransactionType rows match expected defaults', async () => {
    const { data, error } = await supabase
      .from('TransactionType')
      .select('*')
      .order('name', { ascending: true })

    expect(error).toBeNull()
    const seeded = data?.filter((row) => ['Need', 'Want', 'Investment', 'Income'].includes(row.name))
    expect(seeded).toHaveLength(4)

    const expenseKinds = ['Need', 'Want', 'Investment']
    for (const name of expenseKinds) {
      const row = seeded?.find((r) => r.name === name)
      expect(row).toBeDefined()
      expect(row?.kind).toBe('expense')
    }

    const incomeRow = seeded?.find((r) => r.name === 'Income')
    expect(incomeRow).toBeDefined()
    expect(incomeRow?.kind).toBe('income')
  })

  test('custom TransactionType can be created with valid kind', async () => {
    const { data, error } = await supabase
      .from('TransactionType')
      .insert({ name: 'test-finance-custom', kind: 'expense' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data.name).toBe('test-finance-custom')
    expect(data.kind).toBe('expense')
    expect(data.created_at).toBeDefined()
    createdTypeIds.push(data.id)
  })

  test('Transaction source defaults to manual and FK enforces ON DELETE RESTRICT', async () => {
    const { data: typeData } = await supabase
      .from('TransactionType')
      .select('id')
      .eq('name', 'Need')
      .single()
    expect(typeData).not.toBeNull()
    const typeId = typeData!.id

    const { data: txData, error: txError } = await supabase
      .from('Transaction')
      .insert({
        amount: 123.45,
        transaction_type_id: typeId,
        description: 'test-finance-transaction',
        date: new Date().toISOString(),
      })
      .select()
      .single()

    expect(txError).toBeNull()
    expect(txData).not.toBeNull()
    expect(txData.source).toBe('manual')
    createdTransactionIds.push(txData.id)

    // Attempting to delete the referenced type should fail due to RESTRICT.
    const { error: deleteError } = await supabase.from('TransactionType').delete().eq('id', typeId)
    expect(deleteError).not.toBeNull()
  })

  test('Budget can be created for expense type with nullable end_date', async () => {
    const { data: typeData } = await supabase
      .from('TransactionType')
      .select('id')
      .eq('name', 'Want')
      .single()
    expect(typeData).not.toBeNull()
    const typeId = typeData!.id

    const { data: budgetData, error } = await supabase
      .from('Budget')
      .insert({
        transaction_type_id: typeId,
        amount: 500,
        period: 'monthly',
        start_date: new Date().toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(budgetData).not.toBeNull()
    expect(budgetData.period).toBe('monthly')
    expect(budgetData.end_date).toBeNull()
    createdBudgetIds.push(budgetData.id)
  })

  test('app-layer createBudget rejects income transaction type', async ({ page }) => {
    const { data: typeData, error: typeError } = await supabase
      .from('TransactionType')
      .insert({ name: 'test-finance-income', kind: 'income' })
      .select()
      .single()

    expect(typeError).toBeNull()
    expect(typeData).not.toBeNull()
    createdTypeIds.push(typeData!.id)

    await page.goto('/')

    const result = await page.evaluate(async (typeId) => {
      try {
        const { createBudget } = await import('@/lib/supabase')
        await createBudget({
          transactionTypeId: typeId,
          amount: 100,
          period: 'monthly',
          startDate: new Date(),
        })
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : String(err) }
      }
    }, typeData!.id)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('expense')
  })

  test('UserQuery persists and retrieves with jsonb and bigint array', async () => {
    const { data: queryData, error } = await supabase
      .from('UserQuery')
      .insert({
        query_text: 'test-finance-query',
        response_text: 'test-finance-response',
        resolved_transaction_ids: [1, 2, 3],
        date_range_context: { start: '2026-01-01', end: '2026-01-31' },
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(queryData).not.toBeNull()
    expect(queryData.query_text).toBe('test-finance-query')
    expect(queryData.resolved_transaction_ids).toEqual([1, 2, 3])
    expect(queryData.date_range_context).toEqual({ start: '2026-01-01', end: '2026-01-31' })
    expect(queryData.created_at).toBeDefined()
    createdQueryIds.push(queryData.id)

    const { data: retrieved } = await supabase
      .from('UserQuery')
      .select('*')
      .eq('id', queryData.id)
      .single()

    expect(retrieved).not.toBeNull()
    expect(retrieved.resolved_transaction_ids).toEqual([1, 2, 3])
    expect(retrieved.date_range_context).toEqual({ start: '2026-01-01', end: '2026-01-31' })
  })

  test('UserQuery history is ordered by created_at descending', async () => {
    const { data: firstQuery, error: firstError } = await supabase
      .from('UserQuery')
      .insert({ query_text: 'test-finance-query-first', response_text: 'first-response' })
      .select()
      .single()

    expect(firstError).toBeNull()
    expect(firstQuery).not.toBeNull()
    createdQueryIds.push(firstQuery!.id)

    await new Promise((resolve) => setTimeout(resolve, 50))

    const { data: secondQuery, error: secondError } = await supabase
      .from('UserQuery')
      .insert({ query_text: 'test-finance-query-second', response_text: 'second-response' })
      .select()
      .single()

    expect(secondError).toBeNull()
    expect(secondQuery).not.toBeNull()
    createdQueryIds.push(secondQuery!.id)

    const { data: history, error: historyError } = await supabase
      .from('UserQuery')
      .select('*')
      .order('created_at', { ascending: false })

    expect(historyError).toBeNull()
    expect(history).not.toBeNull()
    expect(history!.length).toBeGreaterThanOrEqual(2)

    const ids = history!.map((row) => row.id)
    const firstIndex = ids.indexOf(firstQuery!.id)
    const secondIndex = ids.indexOf(secondQuery!.id)
    expect(secondIndex).toBeLessThan(firstIndex)
  })
})
