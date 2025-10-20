const express = require('express');
const { query } = require('../lib/db');
const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get total sales over time (last 12 months)
    const salesOverTime = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total_amount) as sales
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      AND status != 'cancelled'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `);

    // Get sales by branch
    const salesByBranch = await query(`
      SELECT 
        branch_name,
        SUM(total_amount) as sales
      FROM orders 
      WHERE status != 'cancelled'
      GROUP BY branch_name
      ORDER BY sales DESC
    `);

    // Get order status distribution
    const orderStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY status
    `);

    // Get total orders count
    const totalOrdersCount = await query(`
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get top selling products
    const topProducts = await query(`
      SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
      AND o.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    // Get total revenue
    const totalRevenue = await query(`
      SELECT 
        SUM(total_amount) as total_revenue,
        COUNT(*) as total_orders
      FROM orders 
      WHERE status != 'cancelled'
      AND created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get recent orders
    const recentOrders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        u.email as customer_email
      FROM orders o
      LEFT JOIN auth.users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Process data for frontend
    const processedData = {
      salesOverTime: salesOverTime.rows.map(row => ({
        month: new Date(row.month).toLocaleDateString('en-US', { month: 'short' }),
        sales: parseFloat(row.sales)
      })),
      salesByBranch: salesByBranch.rows.map((row, index) => ({
        branch: row.branch_name,
        sales: parseFloat(row.sales),
        color: getBranchColor(index)
      })),
      orderStatus: processOrderStatus(orderStatus.rows, totalOrdersCount.rows[0]?.total_orders || 0),
      topProducts: topProducts.rows.map(row => ({
        product: row.product_name,
        quantity: parseInt(row.total_quantity),
        orders: parseInt(row.order_count)
      })),
      summary: {
        totalRevenue: parseFloat(totalRevenue.rows[0]?.total_revenue || 0),
        totalOrders: parseInt(totalRevenue.rows[0]?.total_orders || 0),
        averageOrderValue: totalRevenue.rows[0]?.total_orders > 0 
          ? parseFloat(totalRevenue.rows[0].total_revenue) / parseInt(totalRevenue.rows[0].total_orders)
          : 0
      },
      recentOrders: recentOrders.rows
    };

    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics data' 
    });
  }
});

// Get sales trends
router.get('/sales-trends', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const trends = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        SUM(total_amount) as daily_sales,
        COUNT(*) as daily_orders
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
      AND status != 'cancelled'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: trends.rows.map(row => ({
        date: row.date,
        sales: parseFloat(row.daily_sales),
        orders: parseInt(row.daily_orders)
      }))
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sales trends' 
    });
  }
});

// Get product performance
router.get('/product-performance', async (req, res) => {
  try {
    const productPerformance = await query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT o.id) as order_count,
        AVG(oi.quantity) as avg_quantity_per_order
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
      AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.price
      ORDER BY total_sold DESC
    `);

    res.json({
      success: true,
      data: productPerformance.rows.map(row => ({
        id: row.id,
        name: row.name,
        price: parseFloat(row.price),
        totalSold: parseInt(row.total_sold),
        totalRevenue: parseFloat(row.total_revenue),
        orderCount: parseInt(row.order_count),
        avgQuantityPerOrder: parseFloat(row.avg_quantity_per_order)
      }))
    });
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch product performance' 
    });
  }
});

// Get customer analytics
router.get('/customer-analytics', async (req, res) => {
  try {
    const customerData = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_customers,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN user_id END) as new_customers,
        AVG(order_count) as avg_orders_per_customer,
        AVG(total_spent) as avg_spent_per_customer
      FROM (
        SELECT 
          user_id,
          COUNT(*) as order_count,
          SUM(total_amount) as total_spent
        FROM orders 
        WHERE status != 'cancelled'
        GROUP BY user_id
      ) customer_stats
    `);

    const topCustomers = await query(`
      SELECT 
        u.email,
        u.user_metadata->>'full_name' as full_name,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM orders o
      LEFT JOIN auth.users u ON o.user_id = u.id
      WHERE o.status != 'cancelled'
      GROUP BY u.id, u.email, u.user_metadata->>'full_name'
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers: parseInt(customerData.rows[0]?.total_customers || 0),
          newCustomers: parseInt(customerData.rows[0]?.new_customers || 0),
          avgOrdersPerCustomer: parseFloat(customerData.rows[0]?.avg_orders_per_customer || 0),
          avgSpentPerCustomer: parseFloat(customerData.rows[0]?.avg_spent_per_customer || 0)
        },
        topCustomers: topCustomers.rows.map(row => ({
          email: row.email,
          fullName: row.full_name,
          orderCount: parseInt(row.order_count),
          totalSpent: parseFloat(row.total_spent),
          lastOrderDate: row.last_order_date
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer analytics' 
    });
  }
});

// Helper functions
function getBranchColor(index) {
  const colors = [
    '#1e3a8a', '#0d9488', '#166534', '#0284c7', '#0f766e',
    '#0369a1', '#7c3aed', '#64748b', '#15803d'
  ];
  return colors[index % colors.length];
}

function processOrderStatus(statusRows, totalOrders) {
  const statusMap = {};
  statusRows.forEach(row => {
    statusMap[row.status] = parseInt(row.count);
  });
  
  const completed = statusMap.delivered || 0;
  const processing = (statusMap.processing || 0) + (statusMap.confirmed || 0);
  const pending = statusMap.pending || 0;
  const cancelled = statusMap.cancelled || 0;
  
  return {
    completed: {
      count: completed,
      percentage: totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0
    },
    processing: {
      count: processing,
      percentage: totalOrders > 0 ? Math.round((processing / totalOrders) * 100) : 0
    },
    pending: {
      count: pending,
      percentage: totalOrders > 0 ? Math.round((pending / totalOrders) * 100) : 0
    },
    cancelled: {
      count: cancelled,
      percentage: totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0
    },
    total: totalOrders
  };
}

module.exports = router;
