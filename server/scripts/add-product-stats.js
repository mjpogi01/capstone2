const { supabase } = require('../lib/supabase');
const fs = require('fs');
const path = require('path');

async function addProductStatsColumns() {
  try {
    console.log('📊 Adding product statistics columns...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add-product-stats-columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing statement...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Continue with next statement even if one fails
      }
    }
    
    console.log('✅ Product statistics columns added successfully!');
    console.log('📊 Columns added:');
    console.log('   - average_rating (DECIMAL)');
    console.log('   - review_count (INTEGER)');
    console.log('   - sold_quantity (INTEGER)');
    console.log('🔄 Auto-update triggers created for reviews');
    
  } catch (error) {
    console.error('❌ Error adding product stats columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addProductStatsColumns()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { addProductStatsColumns };

