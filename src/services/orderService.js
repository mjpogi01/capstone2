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

      const response = await fetch(`http://localhost:4000/api/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 [OrderService.getAllOrders] Backend response:', data);
      console.log('📦 [OrderService.getAllOrders] Orders returned:', data.orders?.length);
      console.log('📦 [OrderService.getAllOrders] Pagination:', data.pagination);
      
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
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}`);
      
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
      console.log('📦 [OrderService] ========== FETCHING ORDERS ==========');
      console.log('📦 [OrderService] Searching for user_id:', userId);
      console.log('📦 [OrderService] User ID type:', typeof userId);
      console.log('📦 [OrderService] Exclude cancelled:', excludeCancelled);
      
      // First, let's see ALL orders to debug
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, order_number, user_id, status, created_at')
        .limit(10)
        .order('created_at', { ascending: false });
      
      console.log('📦 [OrderService] Recent orders in database (last 10):');
      if (allOrders && allOrders.length > 0) {
        allOrders.forEach(order => {
          console.log(`  - Order ${order.order_number}: user_id=${order.user_id} (type: ${typeof order.user_id}), status=${order.status}`);
          console.log(`    Match? ${order.user_id === userId} (strict), ${order.user_id == userId} (loose)`);
        });
      } else {
        console.log('  No orders found in database at all!');
      }
      
      // Now fetch orders for this specific user
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
        console.error('❌ [OrderService] Supabase error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log('📦 [OrderService] Orders for this user:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📦 [OrderService] User\'s orders:', data.map(o => o.order_number).join(', '));
      }
      
      const formattedOrders = (data || []).map(order => this.formatOrderForDisplay(order));
      console.log('📦 [OrderService] ========== END FETCH ==========');
      
      return formattedOrders;
    } catch (error) {
      console.error('❌ [OrderService] Error fetching user orders:', error);
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
    // Use customer info from API response (now populated by backend)
    const customerName = order.customer_name || 'Customer';
    const customerEmail = order.customer_email || 'N/A';
    
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

  // Fetch reviews for a specific product - HYBRID VERSION (handles both new and old reviews)
  async getProductReviews(productId) {
    try {
      // First, get direct product-specific reviews (new system)
      const { data: productReviews, error: productError } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (productError) {
        console.error('Error fetching product-specific reviews:', productError);
      }

      // Then, get order-level reviews that might contain this product (old system)
      const { data: orderReviews, error: orderError } = await supabase
        .from('order_reviews')
        .select('*')
        .is('product_id', null)
        .order('created_at', { ascending: false });

      if (orderError) {
        console.error('Error fetching order-level reviews:', orderError);
      }

      // For order-level reviews, we need to check if the order contains this product
      let relevantOrderReviews = [];
      if (orderReviews && orderReviews.length > 0) {
        // Get all completed orders to check which ones contain this product
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_items')
          .eq('status', 'picked_up_delivered');

        if (!ordersError && orders) {
          // Find orders that contain this product
          const relevantOrderIds = orders
            .filter(order => {
              const orderItems = order.order_items || [];
              return orderItems.some(item => item.id === productId);
            })
            .map(order => order.id);

          // Filter order reviews to only include those from relevant orders
          relevantOrderReviews = orderReviews.filter(review => 
            relevantOrderIds.includes(review.order_id)
          );
        }
      }

      // Combine both types of reviews
      const allReviews = [
        ...(productReviews || []),
        ...relevantOrderReviews
      ];

      // Sort by creation date (newest first)
      allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return allReviews;
    } catch (error) {
      console.error('Error in getProductReviews:', error);
      return [];
    }
  }

  // Fetch all orders with their reviews from completed deliveries
  async getAllOrdersWithReviews() {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'picked_up_delivered');

      if (error) {
        console.error('Error fetching completed orders:', error);
        return [];
      }

      // For each order, fetch the reviews
      const ordersWithReviews = await Promise.all(
        (orders || []).map(async (order) => {
          try {
            const { data: reviews } = await supabase
              .from('order_reviews')
              .select('*')
              .eq('order_id', order.id);

            return {
              ...order,
              reviews: reviews || []
            };
          } catch (err) {
            console.error('Error fetching reviews for order', order.id, err);
            return {
              ...order,
              reviews: []
            };
          }
        })
      );

      return ordersWithReviews;
    } catch (error) {
      console.error('Error in getAllOrdersWithReviews:', error);
      return [];
    }
  }
}

const orderService = new OrderService();
export default orderService;