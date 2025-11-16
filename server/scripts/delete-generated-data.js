const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const HISTORY_START = new Date(Date.UTC(2022, 0, 1, 0, 0, 0));
const HISTORY_END = new Date(Date.UTC(2025, 9, 31, 23, 59, 59, 999));
const HISTORICAL_EMAIL_DOMAIN = '@mail.yohanns.com';

async function deleteHistoricalOrders() {
  console.log('🧹 Deleting historical orders...');
  const { error, count } = await supabase
    .from('orders')
    .delete({ returning: 'minimal', count: 'exact' })
    .gte('created_at', HISTORY_START.toISOString())
    .lte('created_at', HISTORY_END.toISOString());

  if (error) {
    throw new Error(`Failed to delete orders: ${error.message}`);
  }

  console.log(`   ✅ Deleted ${count ?? 0} orders`);
}

async function deleteHistoricalUsers() {
  console.log('🧹 Deleting generated customer accounts...');
  let page = 1;
  const perPage = 1000;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const users = data?.users ?? [];
    const candidates = users.filter((user) => (
      (user.email || '').endsWith(HISTORICAL_EMAIL_DOMAIN)
    ));

    for (const user of candidates) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.warn(`   ⚠️ Failed to delete user ${user.email}: ${deleteError.message}`);
      } else {
        deleted += 1;
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  console.log(`   ✅ Deleted ${deleted} generated customer accounts`);
}

async function main() {
  try {
    await deleteHistoricalOrders();
    await deleteHistoricalUsers();
    console.log('✅ Cleanup complete.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();



