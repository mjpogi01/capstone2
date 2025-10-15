const express = require('express');
const { query } = require('../lib/db');
const router = express.Router();

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
    const { status } = req.body;

    if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Create new order (for testing purposes)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      orderNumber,
      shippingMethod,
      pickupLocation,
      deliveryAddress,
      orderNotes,
      subtotalAmount,
      shippingCost,
      totalAmount,
      totalItems,
      orderItems
    } = req.body;

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || `ORD-${Date.now()}`;

    const insertQuery = `
      INSERT INTO orders (
        user_id, order_number, shipping_method, pickup_location,
        delivery_address, order_notes, subtotal_amount, shipping_cost,
        total_amount, total_items, order_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      userId,
      finalOrderNumber,
      shippingMethod,
      pickupLocation,
      JSON.stringify(deliveryAddress),
      orderNotes,
      subtotalAmount,
      shippingCost,
      totalAmount,
      totalItems,
      JSON.stringify(orderItems)
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
