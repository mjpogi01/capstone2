import { supabase } from '../lib/supabase';

class ProductService {
  parseAvailableSizes(sizeValue) {
    if (!sizeValue || typeof sizeValue !== 'string') {
      return [];
    }

    const trimmed = sizeValue.trim();

    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const allSizes = [];
          if (parsed.shirts) {
            if (Array.isArray(parsed.shirts.adults)) allSizes.push(...parsed.shirts.adults);
            if (Array.isArray(parsed.shirts.kids)) allSizes.push(...parsed.shirts.kids);
          }
          if (parsed.shorts) {
            if (Array.isArray(parsed.shorts.adults)) allSizes.push(...parsed.shorts.adults);
            if (Array.isArray(parsed.shorts.kids)) allSizes.push(...parsed.shorts.kids);
          }
          return allSizes
            .filter(item => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.trim());
        }
      } catch (error) {
        console.warn('Failed to parse jersey sizes in productService:', error.message);
      }
    }

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
      
      if (!data || data.length === 0) {
        return [];
      }

      const productIds = data
        .map(product => product.id)
        .filter(Boolean);
      const productIdSet = new Set(productIds);

      let productSpecificReviews = [];
      if (productIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('order_reviews')
          .select('product_id, rating')
          .in('product_id', productIds);

        if (reviewsError) {
          console.error('Error fetching product-specific reviews:', reviewsError);
        } else {
          productSpecificReviews = reviewsData || [];
        }
      }

      const { data: orderLevelReviews, error: orderLevelError } = await supabase
        .from('order_reviews')
        .select('order_id, rating')
        .is('product_id', null);

      if (orderLevelError) {
        console.error('Error fetching order-level reviews:', orderLevelError);
      }

      const relevantOrderIds = (orderLevelReviews || [])
        .map(review => review.order_id)
        .filter(Boolean);

      let deliveredOrders = [];
      if (relevantOrderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_items')
          .eq('status', 'picked_up_delivered')
          .in('id', Array.from(new Set(relevantOrderIds)));

        if (ordersError) {
          console.error('Error fetching delivered orders:', ordersError);
        } else {
          deliveredOrders = ordersData || [];
        }
      }

      const ratingsByProduct = new Map();

      const normalizeOrderItems = (orderItems) => {
        if (!orderItems) {
          return [];
        }
        if (Array.isArray(orderItems)) {
          return orderItems;
        }
        try {
          const parsed = JSON.parse(orderItems);
          return Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.warn('Failed to parse order_items in productService:', parseError?.message);
          return [];
        }
      };

      const addRating = (productId, rating) => {
        if (!productId || rating === null || rating === undefined) {
          return;
        }
        if (!ratingsByProduct.has(productId)) {
          ratingsByProduct.set(productId, []);
        }
        ratingsByProduct.get(productId).push(rating);
      };

      for (const review of productSpecificReviews) {
        addRating(review.product_id, review.rating);
      }

      if (orderLevelReviews && orderLevelReviews.length > 0 && deliveredOrders.length > 0) {
        const orderMap = deliveredOrders.reduce((acc, order) => {
          acc.set(order.id, normalizeOrderItems(order.order_items));
          return acc;
        }, new Map());

        for (const review of orderLevelReviews) {
          const items = orderMap.get(review.order_id) || [];
          for (const item of items) {
            if (item && productIdSet.has(item.id)) {
              addRating(item.id, review.rating);
            }
          }
        }
      }

      return data.map(product => {
        const ratings = ratingsByProduct.get(product.id) || [];
        const count = ratings.length;
        const average = count === 0
          ? 0
          : Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / count) * 10) / 10;

        return {
          ...product,
          average_rating: average,
          review_count: count,
          available_sizes: this.parseAvailableSizes(product.size)
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
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
