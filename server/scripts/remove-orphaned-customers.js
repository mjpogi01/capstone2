const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAGE_SIZE = 1000;
const REQUEST_DELAY_MS = 50;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSpinner(initialMessage) {
  const frames = ['|', '/', '-', '\\'];
  let frameIndex = 0;
  let message = initialMessage;
  let interval = null;
  let active = false;

  function render() {
    const frame = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
    const output = `${message} ${frame}`;
    const padding = ' '.repeat(Math.max(0, (process.stdout.columns || 80) - output.length));
    process.stdout.write(`\r${output}${padding}`);
  }

  return {
    start(text) {
      if (text) {
        message = text;
      }
      if (interval) {
        return;
      }
      active = true;
      render();
      interval = setInterval(render, 120);
    },
    update(text) {
      if (text) {
        message = text;
        if (active) {
          render();
        }
      }
    },
    stop(finalMessage) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      active = false;
      const output = finalMessage || `${message} ✓`;
      const padding = ' '.repeat(Math.max(0, (process.stdout.columns || 80) - output.length));
      process.stdout.write(`\r${output}${padding}\n`);
    }
  };
}

async function loadCustomerUsers(spinner) {
  let page = 1;
  const customers = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) {
      throw new Error(`Failed to list users (page ${page}): ${error.message}`);
    }

    const users = data?.users || [];
    users.forEach((user) => {
      if ((user.user_metadata?.role || '').toLowerCase() === 'customer') {
        customers.push({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || null
        });
      }
    });

    if (spinner) {
      spinner.update(`   Fetching customer accounts (page ${page}, collected ${customers.length})`);
    }

    if (users.length < PAGE_SIZE) {
      break;
    }

    page += 1;
    await delay(REQUEST_DELAY_MS);
  }

  return customers;
}

async function hasOrders(userId) {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to check orders for ${userId}: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

async function removeCustomer(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to delete user ${userId}: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Scanning for customer accounts without orders...');

  const loadSpinner = createSpinner('   Fetching customer accounts...');
  loadSpinner.start();
  let customers;
  try {
    customers = await loadCustomerUsers(loadSpinner);
    loadSpinner.stop(`   Loaded ${customers.length} customer accounts.`);
  } catch (error) {
    loadSpinner.stop('   Failed to load customer accounts.');
    throw error;
  }
  console.log(`   Inspecting ${customers.length} customer accounts for order history...`);

  const orphaned = [];
  const errors = [];

  const inspectSpinner = createSpinner('   Checking customer order history...');
  inspectSpinner.start();

  for (let index = 0; index < customers.length; index += 1) {
    const customer = customers[index];
    try {
      const exists = await hasOrders(customer.id);
      if (!exists) {
        orphaned.push(customer);
      }
    } catch (error) {
      errors.push({ customerId: customer.id, reason: error.message });
    }

    if ((index + 1) % 50 === 0 || index === customers.length - 1) {
      inspectSpinner.update(`   Checking customer order history... ${index + 1}/${customers.length}`);
    }
    await delay(REQUEST_DELAY_MS);
  }

  inspectSpinner.stop('   Customer order history check complete.');

  if (!orphaned.length) {
    console.log('✅ No orphaned customer accounts detected.');
    if (errors.length) {
      console.log(`⚠️ Encountered ${errors.length} errors while checking accounts.`);
    }
    return;
  }

  console.log(`\n🧹 Removing ${orphaned.length} customer accounts with zero orders...`);

  const failedDeletes = [];
  const removalSpinner = createSpinner('   Removing orphaned customer accounts...');
  removalSpinner.start();

  for (let index = 0; index < orphaned.length; index += 1) {
    const customer = orphaned[index];
    try {
      await removeCustomer(customer.id);
    } catch (error) {
      failedDeletes.push({ customerId: customer.id, reason: error.message });
    }
    if ((index + 1) % 20 === 0 || index === orphaned.length - 1) {
      removalSpinner.update(`   Removing orphaned customer accounts... ${index + 1}/${orphaned.length}`);
    }
    await delay(REQUEST_DELAY_MS);
  }

  removalSpinner.stop('   Removal pass complete.');

  console.log(`\n✅ Removed ${orphaned.length - failedDeletes.length} orphaned customers.`);

  if (failedDeletes.length) {
    console.log(`⚠️ Failed to remove ${failedDeletes.length} customers:`);
    failedDeletes.slice(0, 10).forEach((failure) => {
      console.log(`   • ${failure.customerId}: ${failure.reason}`);
    });
    if (failedDeletes.length > 10) {
      console.log('   • ... additional failures not shown');
    }
  }

  if (errors.length) {
    console.log(`\n⚠️ Encountered ${errors.length} errors while checking for orders:`);
    errors.slice(0, 10).forEach((failure) => {
      console.log(`   • ${failure.customerId}: ${failure.reason}`);
    });
    if (errors.length > 10) {
      console.log('   • ... additional errors not shown');
    }
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

