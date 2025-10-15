import { supabase } from '../lib/supabase';

class CartService {
  // Get user's cart items from database
  async getUserCart(userId, forceRefresh = false) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('🔍 CartService: Fetching cart for user ID:', userId);

      // Ensure user exists in database first
      await this.ensureUserExists(userId);

      const { data, error } = await supabase
        .from('user_carts')
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
        .order('created_at', { ascending: true })
        .abortSignal(AbortSignal.timeout(10000)); // Add timeout to prevent hanging

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('🔍 CartService: Found', data?.length || 0, 'cart items for user:', userId);


      // Transform the data to match the cart item format
      const transformedData = data.map(item => {
        if (!item.products) {
          console.warn('Cart item missing product data:', item);
          return null;
        }
        
        return {
          id: item.products.id,
          name: item.products.name,
          category: item.products.category,
          price: parseFloat(item.products.price),
          image: item.products.main_image,
          additional_images: item.products.additional_images,
          quantity: item.quantity,
          size: item.size,
          isTeamOrder: item.is_team_order,
          teamMembers: item.team_members,
          singleOrderDetails: item.single_order_details,
          uniqueId: item.id, // Use database ID as unique identifier
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
      }).filter(item => item !== null);

      return transformedData;
    } catch (error) {
      console.error('Error fetching user cart:', error);
      throw error;
    }
  }

  // Check if user exists in Supabase Auth
  async ensureUserExists(userId) {
    try {
      // Get current user from Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting current user:', error);
        throw error;
      }

      if (!user || user.id !== userId) {
        throw new Error('User not authenticated or ID mismatch');
      }

      return true;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  // Add item to user's cart
  async addToCart(userId, cartItem) {
    try {
      // Ensure user exists in database first
      await this.ensureUserExists(userId);
      
      // Validate that product_id is a proper UUID
      if (!cartItem.id || typeof cartItem.id !== 'string') {
        throw new Error('Invalid product ID');
      }

      const { data, error } = await supabase
        .from('user_carts')
        .insert({
          user_id: userId,
          product_id: cartItem.id,
          quantity: cartItem.quantity,
          size: cartItem.size,
          is_team_order: cartItem.isTeamOrder,
          team_members: cartItem.teamMembers,
          single_order_details: cartItem.singleOrderDetails
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }


      return {
        ...cartItem,
        uniqueId: data.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(userId, uniqueId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        return await this.removeFromCart(userId, uniqueId);
      }

      const { data, error } = await supabase
        .from('user_carts')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', uniqueId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(userId, uniqueId) {
    try {
      const { error } = await supabase
        .from('user_carts')
        .delete()
        .eq('id', uniqueId)
        .eq('user_id', userId);

      if (error) {
        console.error('CartService: Supabase delete error:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Clear user's entire cart
  async clearCart(userId) {
    try {
      const { error } = await supabase
        .from('user_carts')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Sync cart with database (for when user logs in)
  async syncCartWithDatabase(userId, localCartItems) {
    try {
      // Ensure user exists in database first
      await this.ensureUserExists(userId);
      
      // Clear existing cart in database
      await this.clearCart(userId);

      // Filter out items with invalid IDs and add valid ones to database
      const validItems = localCartItems.filter(item => {
        // Check if the ID is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return item.id && uuidRegex.test(item.id);
      });

      if (validItems.length === 0) {
        return [];
      }

      // Add all valid cart items to database
      const promises = validItems.map(item => 
        this.addToCart(userId, item)
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error syncing cart with database:', error);
      throw error;
    }
  }

  // Get cart item count for a user
  async getCartItemCount(userId) {
    try {
      const { count, error } = await supabase
        .from('user_carts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting cart item count:', error);
      throw error;
    }
  }

  // Get cart total for a user
  async getCartTotal(userId) {
    try {
      const { data, error } = await supabase
        .from('user_carts')
        .select(`
          quantity,
          products (price)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.reduce((sum, item) => {
        return sum + (parseFloat(item.products.price) * item.quantity);
      }, 0);

      return total;
    } catch (error) {
      console.error('Error getting cart total:', error);
      throw error;
    }
  }
}

const cartService = new CartService();
export default cartService;
