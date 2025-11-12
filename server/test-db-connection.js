const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

console.log('🔍 Testing Database Connection...\n');
console.log('Connection string:', connectionString ? `${connectionString.substring(0, 50)}...` : 'MISSING');
console.log('');

if (!connectionString) {
  console.error('❌ No database connection string found!');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30_000
});

console.log('Attempting to connect to database...\n');

pool.connect()
  .then((client) => {
    console.log('✓ Connected to database successfully!');
    
    // Test a simple query
    return client.query('SELECT NOW() as current_time, current_database() as db_name')
      .then((result) => {
        console.log('✓ Query executed successfully!');
        console.log('  Current time:', result.rows[0].current_time);
        console.log('  Database name:', result.rows[0].db_name);
        
        // Test querying the orders table
        return client.query('SELECT COUNT(*) as count FROM orders LIMIT 1');
      })
      .then((result) => {
        console.log('✓ Orders table accessible!');
        console.log('  Order count:', result.rows[0]?.count || 'N/A');
        client.release();
        pool.end();
        console.log('\n✅ Database connection test passed!');
        process.exit(0);
      })
      .catch((queryError) => {
        console.error('❌ Query error:', queryError.message);
        console.error('Error code:', queryError.code);
        console.error('Error details:', queryError);
        client.release();
        pool.end();
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error('❌ Connection failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    const errorMsg = (error.message || String(error) || '').toLowerCase();
    if (errorMsg.includes('tenant') || errorMsg.includes('user not found')) {
      console.error('\n⚠️  "Tenant or user not found" error detected!');
      console.error('This might mean:');
      console.error('  1. The database password is incorrect');
      console.error('  2. The connection string format is wrong');
      console.error('  3. The database user doesn\'t exist');
    }
    
    pool.end();
    process.exit(1);
  });

