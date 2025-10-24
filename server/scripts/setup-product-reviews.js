const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupProductReviews() {
  try {
    console.log('🔧 Setting up product review statistics function...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-product-review-stats.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
      .catch(async () => {
        // If exec_sql doesn't exist, try executing via REST API
        console.log('📝 Executing SQL via direct query...');
        
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql_query: sql })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return { data: await response.json(), error: null };
      });

    if (error) {
      console.error('❌ Error creating function:', error);
      console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
      console.log('\n' + sql);
      return;
    }

    console.log('✅ Product review statistics function created successfully!');
    console.log('\n📊 The function will now calculate:');
    console.log('  - Average rating for each product');
    console.log('  - Total review count for each product');
    console.log('  - Based on reviews from order_reviews table\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual Setup Required:');
    console.log('Please copy and run the SQL from:');
    console.log(path.join(__dirname, 'create-product-review-stats.sql'));
    console.log('in your Supabase SQL Editor.\n');
  }
}

// Run the setup
setupProductReviews()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });

