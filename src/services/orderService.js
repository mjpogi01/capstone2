import { supabase } from '../lib/supabase';

class OrderService {
  async getAllOrders(filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select('*');

      // Apply filters
      if (filters.pickupBranch) {
        query = query.eq('pickup_location', filters.pickupBranch);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      if (filters.dateSort === 'asc') {
        query = query.order('created_at', { ascending: true });
      } else if (filters.dateSort === 'desc') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.priceSort === 'asc') {
        query = query.order('total_amount', { ascending: true });
      } else if (filters.priceSort === 'desc') {
        query = query.order('total_amount', { ascending: false });
      } else if (filters.quantitySort === 'asc') {
        query = query.order('total_items', { ascending: true });
      } else if (filters.quantitySort === 'desc') {
        query = query.order('total_items', { ascending: false });
      } else {
        // Default sorting by date descending
        query = query.order('created_at', { ascending: false });
      }

      const { data: orders, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // For now, return orders without user data and handle it in the component
      const ordersWithUsers = (orders || []).map(order => ({
        ...order,
        user: null // We'll handle user data display differently
      }));

      return {
        orders: ordersWithUsers || [],
        pagination: {
          page: 1,
          limit: 50,
          total: ordersWithUsers?.length || 0,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return {
        ...data,
        user: null
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async getUserOrders(userId, excludeCancelled = true) {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      // Exclude cancelled orders by default
      if (excludeCancelled) {
        query = query.neq('status', 'cancelled');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return (data || []).map(order => this.formatOrderForDisplay(order));
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Helper method to format order data for display
  formatOrderForDisplay(order) {
    // Extract customer info from delivery address if available
    const deliveryAddress = order.delivery_address || {};
    const customerName = deliveryAddress.receiver || 'Customer';
    const customerEmail = order.user?.email || 'N/A';
    
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerEmail: customerEmail,
      customerName: customerName,
      status: order.status,
      shippingMethod: order.shipping_method,
      pickupLocation: order.pickup_location,
      subtotalAmount: parseFloat(order.subtotal_amount) || 0,
      shippingCost: parseFloat(order.shipping_cost) || 0,
      totalAmount: parseFloat(order.total_amount) || 0,
      totalItems: order.total_items,
      orderDate: order.created_at,
      orderItems: order.order_items,
      deliveryAddress: order.delivery_address,
      orderNotes: order.order_notes,
      designFiles: order.design_files || []
    };
  }
}

const orderService = new OrderService();
export default orderService;