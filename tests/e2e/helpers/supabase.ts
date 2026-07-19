import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
 );


export async function deleteTestTasks() {
  const { error } = await supabase.from('Task').delete().like('title', 'test-task-%');
  if (error) console.error(`Failed to cleanup test tasks: ${error}`);
}

export async function deleteTestFinanceData() {
  const { error: transactionError } = await supabase
    .from('Transaction')
    .delete()
    .like('description', 'test-finance-%');
  if (transactionError) console.error(`Failed to cleanup test transactions: ${transactionError}`);

  // Budget has no description column, so clean up budgets linked to test transaction types.
  const { data: testTypes, error: typeFetchError } = await supabase
    .from('TransactionType')
    .select('id')
    .like('name', 'test-finance-%');
  if (typeFetchError) {
    console.error(`Failed to fetch test transaction types: ${typeFetchError}`);
  } else if (testTypes && testTypes.length > 0) {
    const testTypeIds = testTypes.map((t) => t.id);
    const { error: budgetError } = await supabase
      .from('Budget')
      .delete()
      .in('transaction_type_id', testTypeIds);
    if (budgetError) console.error(`Failed to cleanup test budgets: ${budgetError}`);
  }

  const { error: queryError } = await supabase
    .from('UserQuery')
    .delete()
    .like('query_text', 'test-finance-%');
  if (queryError) console.error(`Failed to cleanup test queries: ${queryError}`);

  const { error: typeError } = await supabase
    .from('TransactionType')
    .delete()
    .like('name', 'test-finance-%');
  if (typeError) console.error(`Failed to cleanup test transaction types: ${typeError}`);
}
