import { supabase } from '../lib/supabase';

class WishlistService {
  // Get user's wishlist items from database
  async getUserWishlist(userId, forceRefresh = false) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Ensure user exists in database first
      await this.ensureUserExists(userId);

      const { data, error } = await supabase
        .from('user_wishlist')
        .select(`
          *,
          products (
            id,
            name,
            category,
            price,
            main_image,
            additional_images
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform the data to match the wishlist item format
      const transformedData = data.map(item => {
        if (!item.products) {
          console.warn('Wishlist item missing product data:', item);
          return null;
        }
        
        return {
          id: item.products.id,
          name: item.products.name,
          category: item.products.category,
          price: parseFloat(item.products.price),
          image: item.products.main_image,
          additional_images: item.products.additional_images,
          addedAt: item.created_at,
          wishlistId: item.id // Use database ID as unique identifier
        };
      }).filter(item => item !== null);

      return transformedData;
    } catch (error) {
      console.error('Error fetching user wishlist:', error);
      throw error;
    }
  }

  // Check if user exists in Supabase Auth
  async ensureUserExists(userId) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error checking user authentication:', error);
      throw error;
    }
  }

  // Add product to wishlist
  async addToWishlist(userId, product) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Check if item already exists in wishlist
      const { data: existingItem, error: checkError } = await supabase
        .from('user_wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingItem) {
        // Item already exists in wishlist
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: parseFloat(product.price),
          image: product.main_image || product.image,
          additional_images: product.additional_images,
          addedAt: new Date().toISOString(),
          wishlistId: existingItem.id
        };
      }

      // Add new item to wishlist
      const { data, error } = await supabase
        .from('user_wishlist')
        .insert([
          {
            user_id: userId,
            product_id: product.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: parseFloat(product.price),
        image: product.main_image || product.image,
        additional_images: product.additional_images,
        addedAt: data.created_at,
        wishlistId: data.id
      };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(userId, productId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { error } = await supabase
        .from('user_wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  // Check if product is in wishlist
  async isInWishlist(userId, productId) {
    try {
      if (!userId) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  }
}

export default new WishlistService();
