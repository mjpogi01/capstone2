const { query } = require('../lib/db');

async function migrateToSupabase() {
  console.log('🚀 Starting Supabase migration...');
  
  try {
    // Enable required extensions
    console.log('📦 Enabling required extensions...');
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    
    // Create users table
    console.log('👥 Creating users table...');
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

    // Create branches table
    console.log('🏢 Creating branches table...');
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

    // Insert default branches
    console.log('📍 Inserting default branches...');
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
    console.log('📦 Creating products table...');
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

    // Create admin user
    console.log('👤 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const adminPassword = 'admin123'; // Change this to a secure password
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, branch_id)
      VALUES ('admin@yohanns.com', $1, 'Admin', 'User', 'admin', 1)
      ON CONFLICT (email) DO NOTHING;
    `, [adminPasswordHash]);

    // Create owner user
    console.log('👑 Creating owner user...');
    const ownerPassword = 'owner123'; // Change this to a secure password
    const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);
    
    await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ('owner@yohanns.com', $1, 'Owner', 'User', 'owner')
      ON CONFLICT (email) DO NOTHING;
    `, [ownerPasswordHash]);

    console.log('✅ Supabase migration completed successfully!');
    console.log('📧 Admin credentials: admin@yohanns.com / admin123');
    console.log('👑 Owner credentials: owner@yohanns.com / owner123');
    console.log('⚠️  Please change these passwords in production!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToSupabase()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToSupabase };
