const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function migrateProductStats() {
  try {
    console.log('📊 Starting product statistics migration...\n');
    
    // Step 1: Add columns (if they don't exist, Supabase will ignore the error)
    console.log('Step 1: Checking/Adding columns to products table...');
    
    // Note: Column addition must be done via Supabase SQL Editor
    console.log('⚠️  Please run this SQL in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);
CREATE INDEX IF NOT EXISTS idx_products_sold_quantity ON products(sold_quantity);
    `);
    console.log('');
    
    // Step 2: Calculate and update product statistics
    console.log('Step 2: Calculating product statistics...\n');
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name');
    
    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`);
    }
    
    console.log(`Found ${products.length} products to process\n`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each product
    for (const product of products) {
      try {
        // Get all reviews for this product
        const { data: reviews, error: reviewsError } = await supabase
          .from('order_reviews')
          .select('rating, order_id')
          .neq('order_id', null);
        
        if (reviewsError) {
          console.error(`Error fetching reviews: ${reviewsError.message}`);
          continue;
        }
        
        // Filter reviews for this product by checking order items
        const productReviews = [];
        
        for (const review of reviews || []) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_items, status')
            .eq('id', review.order_id)
            .single();
          
          if (order && order.order_items) {
            const orderItems = typeof order.order_items === 'string' 
              ? JSON.parse(order.order_items) 
              : order.order_items;
            
            const hasProduct = orderItems.some(item => 
              item.product_id === product.id || item.productId === product.id
            );
            
            if (hasProduct && order.status !== 'cancelled' && order.status !== 'refunded') {
              productReviews.push(review);
            }
          }
        }
        
        // Calculate average rating
        const averageRating = productReviews.length > 0
          ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(2)
          : 0.00;
        
        const reviewCount = productReviews.length;
        
        // Get sold quantity from completed orders
        const { data: orders } = await supabase
          .from('orders')
          .select('order_items, status')
          .in('status', ['shipped', 'out_for_delivery', 'delivered', 'picked_up_delivered', 'completed']);
        
        let soldQuantity = 0;
        
        for (const order of orders || []) {
          if (order.order_items) {
            const orderItems = typeof order.order_items === 'string' 
              ? JSON.parse(order.order_items) 
              : order.order_items;
            
            orderItems.forEach(item => {
              if (item.product_id === product.id || item.productId === product.id) {
                soldQuantity += parseInt(item.quantity || 1);
              }
            });
          }
        }
        
        // Update product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            average_rating: parseFloat(averageRating),
            review_count: reviewCount,
            sold_quantity: soldQuantity
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${product.name}:`, updateError.message);
          skipped++;
        } else {
          updated++;
          if (reviewCount > 0 || soldQuantity > 0) {
            console.log(`✅ ${product.name}: ${averageRating}⭐ (${reviewCount} reviews) | ${soldQuantity} sold`);
          }
        }
        
      } catch (err) {
        console.error(`Error processing product ${product.name}:`, err.message);
        skipped++;
      }
    }
    
    console.log(`\n📊 Migration Complete!`);
    console.log(`   ✅ Updated: ${updated} products`);
    console.log(`   ⚠️  Skipped: ${skipped} products`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Product Statistics Migration Tool\n');
  migrateProductStats()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateProductStats };

