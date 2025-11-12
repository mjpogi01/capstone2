const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

let pool;

function getPool() {
  if (!connectionString) {
    const errorMsg = 'Missing DATABASE_URL environment variable for direct SQL access.\n' +
      'To fix this, add DATABASE_URL to your server/.env file.\n' +
      'Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres\n' +
      'You can find this in your Supabase project settings under Database > Connection String > URI';
    console.error(errorMsg);
    throw new Error('Missing DATABASE_URL environment variable');
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 5,
        idleTimeoutMillis: 30_000
      });
    } catch (poolError) {
      console.error('Failed to create database connection pool:', poolError);
      throw new Error(`Database connection failed: ${poolError.message}`);
    }
  }

  return pool;
}

async function executeSql(sql, params = []) {
  let client;
  try {
    client = await getPool().connect();
    const start = Date.now();
    const result = await client.query(sql, params);
    result.durationMs = Date.now() - start;
    return result;
  } catch (error) {
    console.error('SQL execution error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL query:', sql.substring(0, 200));

    const errorMsg = (error.message || String(error) || '').toLowerCase();
    if (errorMsg.includes('tenant') || errorMsg.includes('user not found')) {
      const helpfulError = new Error(
        'Database connection failed with "Tenant or user not found" error.\n' +
        'This usually means:\n' +
        '  1. The database password in DATABASE_URL is incorrect\n' +
        '  2. The connection pooler is having issues (try direct connection on port 5432)\n' +
        '  3. The connection string format is wrong\n\n' +
        'To fix:\n' +
        '  1. Go to Supabase Dashboard > Project Settings > Database\n' +
        '  2. Reset your database password if needed\n' +
        '  3. Copy the "URI" connection string (not Connection Pooling)\n' +
        '  4. Update DATABASE_URL in server/.env with the working connection string.'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }

    if (errorMsg.includes('password authentication failed')) {
      const helpfulError = new Error(
        'Database password authentication failed. Please check your DATABASE_URL password in server/.env'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }

    if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
      console.error('Table might not exist or schema issue');
    }

    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  executeSql
};

