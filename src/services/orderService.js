import { supabase } from '../lib/supabase';

class OrderService {
  async getAllOrders(filters = {}) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.dateSort) params.append('dateSort', filters.dateSort);
      if (filters.priceSort) params.append('priceSort', filters.priceSort);
      if (filters.quantitySort) params.append('quantitySort', filters.quantitySort);
      if (filters.pickupBranch) params.append('pickupBranch', filters.pickupBranch);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`/api/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to mock data if API fails
      return {
        orders: this.getMockOrders(),
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 1
        }
      };
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
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
      // Use backend API to trigger email automation
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          skipEmail: false // Ensure email is sent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const data = await response.json();
      
      // Log email status
      if (data.emailSent) {
        console.log('✅ Email notification sent successfully');
      } else if (data.emailError) {
        console.warn('⚠️ Email notification failed:', data.emailError);
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      // Use backend API to trigger email automation
      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      
      // Log email status
      if (data.emailSent) {
        console.log('✅ Order confirmation email sent successfully');
      } else if (data.emailError) {
        console.warn('⚠️ Order confirmation email failed:', data.emailError);
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

  getMockOrders() {
    return [
      {
        id: 1,
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        status: 'processing',
        shippingMethod: 'pickup',
        pickupLocation: 'Main Branch',
        subtotalAmount: 1500.00,
        shippingCost: 0.00,
        totalAmount: 1500.00,
        totalItems: 2,
        orderDate: new Date().toISOString(),
        orderItems: [
          { name: 'Basketball Jersey', quantity: 1, price: 750.00 },
          { name: 'Football Jersey', quantity: 1, price: 750.00 }
        ],
        deliveryAddress: null,
        orderNotes: 'Please make sure the jerseys are high quality',
        designFiles: []
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        status: 'completed',
        shippingMethod: 'delivery',
        pickupLocation: 'Mall Branch',
        subtotalAmount: 2000.00,
        shippingCost: 100.00,
        totalAmount: 2100.00,
        totalItems: 3,
        orderDate: new Date(Date.now() - 86400000).toISOString(),
        orderItems: [
          { name: 'Volleyball Jersey', quantity: 2, price: 800.00 },
          { name: 'Soccer Jersey', quantity: 1, price: 400.00 }
        ],
        deliveryAddress: {
          fullName: 'Jane Smith',
          street: '123 Main St',
          city: 'Batangas City',
          province: 'Batangas',
          postalCode: '4200'
        },
        orderNotes: 'Rush order needed',
        designFiles: []
      },
      {
        id: 3,
        orderNumber: 'ORD-003',
        customerName: 'Mike Johnson',
        customerEmail: 'mike@example.com',
        status: 'pending',
        shippingMethod: 'pickup',
        pickupLocation: 'Downtown Branch',
        subtotalAmount: 3000.00,
        shippingCost: 0.00,
        totalAmount: 3000.00,
        totalItems: 4,
        orderDate: new Date(Date.now() - 172800000).toISOString(),
        orderItems: [
          { name: 'Basketball Jersey', quantity: 2, price: 1500.00 },
          { name: 'Football Jersey', quantity: 2, price: 1500.00 }
        ],
        deliveryAddress: null,
        orderNotes: 'Team uniforms for basketball tournament',
        designFiles: []
      }
    ];
  }
}

const orderService = new OrderService();
export default orderService;