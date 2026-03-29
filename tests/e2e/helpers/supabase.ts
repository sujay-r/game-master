import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function deleteTestTasks() {
  const { error } = await supabase.from('Task').delete().like('title', 'test-task-%');
  if (error) console.error(`Failed to cleanup test tasks: ${error}`);
}
