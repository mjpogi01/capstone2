const express = require('express');
const { supabase, query } = require('../lib/db');
const emailService = require('../lib/emailService');
const router = express.Router();

// Supabase client and query helper are provided by ../lib/db

// Get all orders with filters
router.get('/', async (req, res) => {
  try {
    const {
      dateSort,
      priceSort,
      quantitySort,
      pickupBranch,
      status,
      page = 1,
      limit = 50
    } = req.query;

    // Build Supabase query
    let query = supabase
      .from('orders')
      .select('*');

    // Apply filters
    if (pickupBranch) {
      query = query.eq('pickup_location', pickupBranch);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    if (dateSort === 'asc') {
      query = query.order('created_at', { ascending: true });
    } else if (dateSort === 'desc') {
      query = query.order('created_at', { ascending: false });
    } else if (priceSort === 'asc') {
      query = query.order('total_amount', { ascending: true });
    } else if (priceSort === 'desc') {
      query = query.order('total_amount', { ascending: false });
    } else if (quantitySort === 'asc') {
      query = query.order('total_items', { ascending: true });
    } else if (quantitySort === 'desc') {
      query = query.order('total_items', { ascending: false });
    } else {
      // Default sorting by date descending
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Transform data to match expected format
    const transformedOrders = (orders || []).map(order => ({
      ...order,
      customer_email: null, // Will be populated separately if needed
      customer_name: null   // Will be populated separately if needed
    }));

    res.json({
      orders: transformedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Transform data to match expected format
    const transformedOrder = {
      ...order,
      customer_email: null, // Will be populated separately if needed
      customer_name: null   // Will be populated separately if needed
    };

    res.json(transformedOrder);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, skipEmail = false } = req.body;

    // Updated to support new production stage statuses
    const validStatuses = [
      'pending', 'confirmed', 'layout', 'sizing', 'printing', 
      'press', 'prod', 'packing_completing', 'picked_up_delivered', 
      'cancelled'
    ];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    // Get current order data before update
    const { data: currentOrderData, error: currentError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentOrderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get user data separately
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(currentOrderData.user_id);
    
    const currentOrder = {
      ...currentOrderData,
      customer_email: userData?.user?.email || null,
      customer_name: userData?.user?.user_metadata?.full_name || null
    };
    const previousStatus = currentOrder.status;

    // Update order status
    const { data: updatedOrderData, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedOrderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = updatedOrderData;

    // Send email notification if not skipped and email is configured
    let emailResult = null;
    if (!skipEmail && currentOrder.customer_email && process.env.EMAIL_USER) {
      try {
        emailResult = await emailService.sendOrderStatusUpdate(
          updatedOrder,
          currentOrder.customer_email,
          currentOrder.customer_name,
          status,
          previousStatus
        );
        console.log(`📧 Email sent for order ${updatedOrder.order_number} status update: ${status}`);
      } catch (emailError) {
        console.error('❌ Failed to send status update email:', emailError);
        // Don't fail the entire request if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.json({
      ...updatedOrder,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Create new order (for testing purposes)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const userId = body.userId || body.user_id;
    const orderNumber = body.orderNumber || body.order_number;
    const shippingMethod = body.shippingMethod || body.shipping_method;
    const pickupLocation = body.pickupLocation || body.pickup_location;
    const deliveryAddress = body.deliveryAddress || body.delivery_address;
    const orderNotes = body.orderNotes || body.order_notes || null;
    const subtotalAmount = body.subtotalAmount || body.subtotal_amount || 0;
    const shippingCost = body.shippingCost || body.shipping_cost || 0;
    const totalAmount = body.totalAmount || body.total_amount || 0;
    const totalItems = body.totalItems || body.total_items || 0;
    const orderItems = body.orderItems || body.order_items || [];

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || `ORD-${Date.now()}`;

    // Insert using Supabase client
    const { data: inserted, error: insertError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          order_number: finalOrderNumber,
          status: body.status || 'pending',
          shipping_method: shippingMethod,
          pickup_location: pickupLocation,
          delivery_address: deliveryAddress || null,
          order_notes: orderNotes,
          subtotal_amount: subtotalAmount,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          total_items: totalItems,
          order_items: orderItems
        }
      ])
      .select()
      .single();

    if (insertError || !inserted) {
      // Provide more details for debugging
      console.error('Insert order failed:', insertError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const newOrder = inserted;

    // Send order confirmation email if email is configured
    let emailResult = null;
    if (process.env.EMAIL_USER && userId) {
      try {
        // Get customer email via Supabase Auth Admin API
        const { data: userResp, error: userLookupError } = await supabase.auth.admin.getUserById(userId);
        if (!userLookupError && userResp?.user?.email) {
          emailResult = await emailService.sendOrderConfirmation(
            newOrder,
            userResp.user.email,
            userResp.user.user_metadata?.full_name || null
          );
          console.log(`📧 Order confirmation email sent for order ${newOrder.order_number}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation email:', emailError);
        // Don't fail the entire request if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.status(201).json({
      ...newOrder,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
