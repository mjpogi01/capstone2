const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Supabase connection configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.xnuzdzjfqhbpcnsetjif:lLqK8vaaYeCOlQj7@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

async function ensureUsersTable() {
  // Ensure pgcrypto for gen_random_uuid()
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      address1 TEXT,
      address2 TEXT,
      city TEXT,
      province TEXT,
      postal_code TEXT,
      country TEXT,
      role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'owner')),
      branch_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Safe ALTERs in case table existed before - only essential user fields
  const columns = [
    ['full_name', 'TEXT'],
    ['phone', 'TEXT'],
    ['role', 'TEXT DEFAULT \'customer\' CHECK (role IN (\'customer\', \'admin\', \'owner\'))'],
    ['branch_id', 'INTEGER']
  ];
  for (const [name, type] of columns) {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${name} ${type};`);
  }

  // Remove unnecessary address columns from users table since we use user_addresses table
  const columnsToRemove = [
    'address1', 'address2', 'city', 'province', 'postal_code', 'country',
    'street_address', 'barangay', 'address'
  ];
  
  for (const columnName of columnsToRemove) {
    try {
      await query(`ALTER TABLE users DROP COLUMN IF EXISTS ${columnName};`);
      console.log(`Removed column: ${columnName}`);
    } catch (error) {
      console.log(`Column ${columnName} may not exist or couldn't be removed:`, error.message);
    }
  }

  // Create branches table
  await query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Insert default branches (1-9)
  await query(`
    INSERT INTO branches (id, name, address, city, phone, email) VALUES
    (1, 'Main Branch', '123 Main St', 'Batangas City', '+63-43-123-4567', 'main@yohanns.com'),
    (2, 'Mall Branch', '456 Mall Ave', 'Batangas City', '+63-43-234-5678', 'mall@yohanns.com'),
    (3, 'Downtown Branch', '789 Downtown Blvd', 'Batangas City', '+63-43-345-6789', 'downtown@yohanns.com'),
    (4, 'Suburb Branch', '321 Suburb St', 'Batangas City', '+63-43-456-7890', 'suburb@yohanns.com'),
    (5, 'Coastal Branch', '654 Coastal Rd', 'Batangas City', '+63-43-567-8901', 'coastal@yohanns.com'),
    (6, 'University Branch', '987 University Ave', 'Batangas City', '+63-43-678-9012', 'university@yohanns.com'),
    (7, 'Industrial Branch', '147 Industrial Zone', 'Batangas City', '+63-43-789-0123', 'industrial@yohanns.com'),
    (8, 'Residential Branch', '258 Residential Area', 'Batangas City', '+63-43-890-1234', 'residential@yohanns.com'),
    (9, 'Business Branch', '369 Business District', 'Batangas City', '+63-43-901-2345', 'business@yohanns.com')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Create products table
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      size TEXT,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      main_image TEXT,
      additional_images TEXT[],
      stock_quantity INTEGER DEFAULT 0,
      branch_id INTEGER REFERENCES branches(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Create user_addresses table
  await query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      street_address TEXT NOT NULL,
      barangay VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      province VARCHAR(100) NOT NULL,
      postal_code VARCHAR(10) NOT NULL,
      address TEXT NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Create indexes for user_addresses
  await query(`CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);`);
  
  // Add is_default column if it doesn't exist
  await query(`ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;`);
  
  // Create index for default addresses
  await query(`CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default);`);
}

module.exports = { pool, query, ensureUsersTable };
