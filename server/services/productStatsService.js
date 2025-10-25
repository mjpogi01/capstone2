const { supabase } = require('../lib/supabase');

class ProductStatsService {
  /**
   * Update statistics for a specific product
   * @param {string} productId - The product UUID
   */
  async updateProductStats(productId) {
    try {
      // Get all reviews for this product
      const { data: reviews, error: reviewsError } = await supabase
        .from('order_reviews')
        .select('rating, order_id');
      
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }
      
      // Filter reviews for this product
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
            item.product_id === productId || item.productId === productId
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
      
      // Get sold quantity
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
            if (item.product_id === productId || item.productId === productId) {
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
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error updating product stats:', updateError);
        return false;
      }
      
      console.log(`✅ Updated stats for product ${productId}: ${averageRating}⭐ (${reviewCount} reviews) | ${soldQuantity} sold`);
      return true;
      
    } catch (error) {
      console.error('Error in updateProductStats:', error);
      return false;
    }
  }

  /**
   * Update statistics for all products in an order
   * @param {string} orderId - The order UUID
   */
  async updateStatsForOrder(orderId) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_items')
        .eq('id', orderId)
        .single();
      
      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return false;
      }
      
      // Get product IDs from order
      const orderItems = typeof order.order_items === 'string' 
        ? JSON.parse(order.order_items) 
        : order.order_items;
      
      const productIds = orderItems.map(item => item.product_id || item.productId);
      
      // Update stats for each product
      const updates = productIds.map(productId => this.updateProductStats(productId));
      await Promise.all(updates);
      
      console.log(`✅ Updated stats for ${productIds.length} products in order ${orderId}`);
      return true;
      
    } catch (error) {
      console.error('Error in updateStatsForOrder:', error);
      return false;
    }
  }

  /**
   * Update sold quantity when order status changes
   * @param {string} orderId - The order UUID
   */
  async updateSoldQuantityForOrder(orderId) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('order_items')
        .eq('id', orderId)
        .single();
      
      if (!order) return false;
      
      const orderItems = typeof order.order_items === 'string' 
        ? JSON.parse(order.order_items) 
        : order.order_items;
      
      const productIds = [...new Set(orderItems.map(item => item.product_id || item.productId))];
      
      // Update sold quantity for each product
      for (const productId of productIds) {
        await this.updateProductStats(productId);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating sold quantity:', error);
      return false;
    }
  }

  /**
   * Recalculate all product statistics
   */
  async recalculateAllStats() {
    try {
      console.log('📊 Recalculating statistics for all products...');
      
      const { data: products } = await supabase
        .from('products')
        .select('id, name');
      
      let updated = 0;
      
      for (const product of products || []) {
        const success = await this.updateProductStats(product.id);
        if (success) updated++;
      }
      
      console.log(`✅ Recalculated stats for ${updated} products`);
      return true;
    } catch (error) {
      console.error('Error recalculating all stats:', error);
      return false;
    }
  }
}

module.exports = new ProductStatsService();

