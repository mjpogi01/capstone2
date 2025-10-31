import { supabase } from '../lib/supabase';

class ProductService {
  parseAvailableSizes(sizeValue) {
    if (!sizeValue || typeof sizeValue !== 'string') {
      return [];
    }

    const trimmed = sizeValue.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim());
      }
    } catch (error) {
      console.warn('Failed to parse available sizes from productService:', error.message);
    }

    return [];
  }

  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
      
      // Fetch ratings for all products
      const productsWithRatings = await Promise.all(
        (data || []).map(async (product) => {
          const rating = await this.getProductAverageRating(product.id);
          return {
            ...product,
            average_rating: rating.average,
            review_count: rating.count,
            available_sizes: this.parseAvailableSizes(product.size)
          };
        })
      );
      
      return productsWithRatings;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get average rating for a product
  async getProductAverageRating(productId) {
    try {
      // Get product-specific reviews
      const { data: productReviews, error: productError } = await supabase
        .from('order_reviews')
        .select('rating')
        .eq('product_id', productId);

      if (productError) {
        console.error('Error fetching product reviews:', productError);
      }

      // Get order-level reviews for orders containing this product
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_items')
        .eq('status', 'picked_up_delivered');

      let orderReviews = [];
      if (!ordersError && orders) {
        const relevantOrderIds = orders
          .filter(order => {
            const orderItems = order.order_items || [];
            return orderItems.some(item => item.id === productId);
          })
          .map(order => order.id);

        if (relevantOrderIds.length > 0) {
          const { data: reviews } = await supabase
            .from('order_reviews')
            .select('rating')
            .is('product_id', null)
            .in('order_id', relevantOrderIds);
          
          orderReviews = reviews || [];
        }
      }

      // Combine all ratings
      const allRatings = [
        ...(productReviews || []),
        ...orderReviews
      ].map(r => r.rating).filter(r => r !== null && r !== undefined);

      if (allRatings.length === 0) {
        return { average: 0, count: 0 };
      }

      const average = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
      return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal
        count: allRatings.length
      };
    } catch (error) {
      console.error('Error calculating product rating:', error);
      return { average: 0, count: 0 };
    }
  }

  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch product: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getProductsByBranch(branchId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch products by branch: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching products by branch:', error);
      throw error;
    }
  }

  async getProductsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch products by category: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }
}

export default new ProductService();
