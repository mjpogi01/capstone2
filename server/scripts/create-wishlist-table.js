const { pool, query } = require('../lib/db');

async function createWishlistTable() {
  try {
    console.log('Creating user_wishlist table...');

    // Create user_wishlist table
    await query(`
      CREATE TABLE IF NOT EXISTS user_wishlist (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `);

    // Create indexes for user_wishlist
    await query(`CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_id ON user_wishlist(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_wishlist_product_id ON user_wishlist(product_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_wishlist_created_at ON user_wishlist(created_at);`);

    // Create trigger to update updated_at timestamp
    await query(`
      CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await query(`
      CREATE TRIGGER update_user_wishlist_updated_at
        BEFORE UPDATE ON user_wishlist
        FOR EACH ROW
        EXECUTE FUNCTION update_wishlist_updated_at();
    `);

    console.log('✅ user_wishlist table created successfully!');
    console.log('✅ Indexes created successfully!');
    console.log('✅ Triggers created successfully!');

  } catch (error) {
    console.error('❌ Error creating wishlist table:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createWishlistTable()
    .then(() => {
      console.log('🎉 Wishlist table setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createWishlistTable };
