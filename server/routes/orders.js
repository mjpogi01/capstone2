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

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Pickup branch filter
    if (pickupBranch) {
      whereConditions.push(`o.pickup_location = $${paramIndex}`);
      queryParams.push(pickupBranch);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Determine sorting
    let orderByClause = 'ORDER BY o.created_at DESC'; // Default sorting
    if (dateSort === 'asc') {
      orderByClause = 'ORDER BY o.created_at ASC';
    } else if (dateSort === 'desc') {
      orderByClause = 'ORDER BY o.created_at DESC';
    } else if (priceSort === 'asc') {
      orderByClause = 'ORDER BY o.total_amount ASC';
    } else if (priceSort === 'desc') {
      orderByClause = 'ORDER BY o.total_amount DESC';
    } else if (quantitySort === 'asc') {
      orderByClause = 'ORDER BY o.total_items ASC';
    } else if (quantitySort === 'desc') {
      orderByClause = 'ORDER BY o.total_items DESC';
    }

    const offset = (page - 1) * limit;

    // Get orders with user information
    const ordersQuery = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.raw_user_meta_data->>'full_name' as customer_name
      FROM orders o
      LEFT JOIN auth.users u ON o.user_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const ordersResult = await query(ordersQuery, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      orders: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
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

    const orderQuery = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.raw_user_meta_data->>'full_name' as customer_name
      FROM orders o
      LEFT JOIN auth.users u ON o.user_id = u.id
      WHERE o.id = $1
    `;

    const result = await query(orderQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);

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

    if (!status || !['pending', 'processing', 'completed', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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
