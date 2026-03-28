import { createClient } from '@supabase/supabase-js';

console.log("Connecting to local supabase...")

const supabase = createClient(
  'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("Created supabase client!")

const today = new Date().toISOString().split('T')[0];

console.log(`Today's date: ${today}`)

console.log("Inserting dynamic tasks in db now")
const { error } = await supabase.from('Task').insert([
  { title: 'Due today task 1', description: 'Description for first task due today', notes: null, quest_id: null, due_date: today, status: 'TODO' },
  { title: 'Due today task 2', description: 'Description for second task due today', notes: null, quest_id: null, due_date: today, status: 'TODO' },
]);

if(error) {
  console.error('Insert failed: ', error);
}

console.log("Dynamic db seeding finished.")
