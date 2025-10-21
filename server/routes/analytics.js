const express = require('express');
const { supabase } = require('../lib/db');
const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching analytics data...');
    
    // Get all orders
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`✅ Fetched ${allOrders ? allOrders.length : 0} orders from database`);

    // Get orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = allOrders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );

    // Calculate sales over time (last 12 months)
    const salesByMonth = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    allOrders
      .filter(order => new Date(order.created_at) >= twelveMonthsAgo)
      .forEach(order => {
        const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' });
        if (!salesByMonth[month]) {
          salesByMonth[month] = 0;
        }
        salesByMonth[month] += parseFloat(order.total_amount || 0);
      });

    // Calculate sales by branch
    const salesByBranch = {};
    allOrders.forEach(order => {
      const branch = order.pickup_location || 'Online Orders';
      if (!salesByBranch[branch]) {
        salesByBranch[branch] = 0;
      }
      salesByBranch[branch] += parseFloat(order.total_amount || 0);
    });

    // Calculate order status distribution
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };

    recentOrders.forEach(order => {
      const status = order.status || 'pending';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else if (status === 'delivered') {
        statusCounts.completed++;
      } else if (status === 'confirmed') {
        statusCounts.processing++;
      }
    });

    // Calculate top selling products
    const productSales = {};
    recentOrders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach(item => {
          const productName = item.name || 'Unknown';
          if (!productSales[productName]) {
            productSales[productName] = {
              quantity: 0,
              orders: new Set()
            };
          }
          productSales[productName].quantity += parseInt(item.quantity || 0);
          productSales[productName].orders.add(order.id);
        });
      }
    });

    // Calculate total revenue
    const totalRevenue = recentOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || 0), 0
    );

    const totalOrders = recentOrders.length;

    // Convert sales by month to array format
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesOverTimeArray = monthOrder.map(month => ({
      month,
      sales: salesByMonth[month] || 0
    }));

    // Convert sales by branch to array format
    const salesByBranchArray = Object.entries(salesByBranch)
      .map(([branch, sales], index) => ({
        branch,
        sales,
        color: getBranchColor(index)
      }))
      .sort((a, b) => b.sales - a.sales);

    // Convert product sales to array format
    const topProductsArray = Object.entries(productSales)
      .map(([product, data]) => ({
        product,
        quantity: data.quantity,
        orders: data.orders.size
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Calculate order status percentages
    const orderStatusData = {
      completed: {
        count: statusCounts.completed,
        percentage: totalOrders > 0 ? Math.round((statusCounts.completed / totalOrders) * 100) : 0
      },
      processing: {
        count: statusCounts.processing,
        percentage: totalOrders > 0 ? Math.round((statusCounts.processing / totalOrders) * 100) : 0
      },
      pending: {
        count: statusCounts.pending,
        percentage: totalOrders > 0 ? Math.round((statusCounts.pending / totalOrders) * 100) : 0
      },
      cancelled: {
        count: statusCounts.cancelled,
        percentage: totalOrders > 0 ? Math.round((statusCounts.cancelled / totalOrders) * 100) : 0
      },
      total: totalOrders
    };

    // Process data for frontend
    const processedData = {
      salesOverTime: salesOverTimeArray,
      salesByBranch: salesByBranchArray,
      orderStatus: orderStatusData,
      topProducts: topProductsArray,
      summary: {
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      recentOrders: recentOrders.slice(0, 10).map(order => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        user_id: order.user_id
      }))
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
    const daysAgo = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'cancelled')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by day
    const dailyData = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          sales: 0,
          orders: 0
        };
      }
      dailyData[date].sales += parseFloat(order.total_amount || 0);
      dailyData[date].orders += 1;
    });

    const trends = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: trends
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'cancelled')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // Process product performance
    const productStats = {};
    orders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach(item => {
          const name = item.name || 'Unknown';
          const category = item.category || 'Unknown';
          const key = `${name}-${category}`;
          
          if (!productStats[key]) {
            productStats[key] = {
              name,
              category,
              totalSold: 0,
              totalRevenue: 0,
              orders: new Set(),
              quantities: []
            };
          }
          
          const quantity = parseInt(item.quantity || 0);
          const price = parseFloat(item.price || 0);
          
          productStats[key].totalSold += quantity;
          productStats[key].totalRevenue += quantity * price;
          productStats[key].orders.add(order.id);
          productStats[key].quantities.push(quantity);
        });
      }
    });

    const performance = Object.values(productStats)
      .map(stat => ({
        name: stat.name,
        category: stat.category,
        totalSold: stat.totalSold,
        totalRevenue: stat.totalRevenue,
        orderCount: stat.orders.size,
        avgQuantityPerOrder: stat.quantities.length > 0 
          ? stat.quantities.reduce((a, b) => a + b, 0) / stat.quantities.length 
          : 0
      }))
      .sort((a, b) => b.totalSold - a.totalSold);

    res.json({
      success: true,
      data: performance
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
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'cancelled');

    if (error) throw error;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate customer statistics
    const customerStats = {};
    let newCustomers = new Set();

    orders.forEach(order => {
      const userId = order.user_id;
      if (!customerStats[userId]) {
        customerStats[userId] = {
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null
        };
      }
      
      customerStats[userId].orderCount += 1;
      customerStats[userId].totalSpent += parseFloat(order.total_amount || 0);
      
      const orderDate = new Date(order.created_at);
      if (!customerStats[userId].lastOrderDate || orderDate > customerStats[userId].lastOrderDate) {
        customerStats[userId].lastOrderDate = orderDate;
      }
      
      if (orderDate >= thirtyDaysAgo) {
        newCustomers.add(userId);
      }
    });

    const totalCustomers = Object.keys(customerStats).length;
    const avgOrdersPerCustomer = totalCustomers > 0 
      ? Object.values(customerStats).reduce((sum, c) => sum + c.orderCount, 0) / totalCustomers 
      : 0;
    const avgSpentPerCustomer = totalCustomers > 0 
      ? Object.values(customerStats).reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers 
      : 0;

    // Get top 10 customers
    const topCustomers = Object.entries(customerStats)
      .map(([userId, stats]) => ({
        userId,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderDate: stats.lastOrderDate
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          newCustomers: newCustomers.size,
          avgOrdersPerCustomer: parseFloat(avgOrdersPerCustomer.toFixed(2)),
          avgSpentPerCustomer: parseFloat(avgSpentPerCustomer.toFixed(2))
        },
        topCustomers
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


module.exports = router;
