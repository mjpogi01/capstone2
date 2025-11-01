import React, { useState, useEffect } from 'react';
import './Dashboard1.css';
import orderService from '../../services/orderService';
import EarningsChart from '../../components/admin/EarningsChart';
import { API_URL } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faShoppingCart,
  faChartLine,
  faSearch,
  faFilter,
  faPlus,
  faBox,
  faUser,
  faFileAlt,
  faCog,
  faChevronUp,
  faEdit,
  faBoxOpen,
  faTrash,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const Dashboard1 = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockFilters, setStockFilters] = useState({
    category: '',
    status: ''
  });
  const [showStockFilters, setShowStockFilters] = useState(false);
  const [showAllStockItems, setShowAllStockItems] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockingItem, setRestockingItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockItem, setNewStockItem] = useState({
    name: '',
    category: '',
    stockQuantity: '',
    reorderLevel: ''
  });

  // Dashboard stats with real data from API
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalOrders: 0,
    salesTrend: '+0%',
    customersTrend: '+0%',
    ordersTrend: '+0%'
  });
  const [loadingStats, setLoadingStats] = useState(true);


  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      name: "Custom T-Shirt Premium",
      image: "https://via.placeholder.com/50",
      category: "t-shirts",
      stockQuantity: 450,
      reorderLevel: 100,
      supplier: "Textile Co.",
      lastRestocked: "2024-01-15",
      status: "In Stock"
    },
    {
      id: 2,
      name: "Basketball Jersey",
      image: "https://via.placeholder.com/50",
      category: "jerseys",
      stockQuantity: 35,
      reorderLevel: 50,
      supplier: "Sportswear Inc.",
      lastRestocked: "2024-01-10",
      status: "Low Stock"
    },
    {
      id: 3,
      name: "Trophy Gold",
      image: "https://via.placeholder.com/50",
      category: "trophies",
      stockQuantity: 0,
      reorderLevel: 20,
      supplier: "Award Master",
      lastRestocked: "2023-12-20",
      status: "Out of Stock"
    },
    {
      id: 4,
      name: "Medal Set",
      image: "https://via.placeholder.com/50",
      category: "trophies",
      stockQuantity: 120,
      reorderLevel: 30,
      supplier: "Award Master",
      lastRestocked: "2024-01-08",
      status: "In Stock"
    },
    {
      id: 5,
      name: "Long Sleeve Shirt",
      image: "https://via.placeholder.com/50",
      category: "long sleeves",
      stockQuantity: 28,
      reorderLevel: 50,
      supplier: "Textile Co.",
      lastRestocked: "2024-01-12",
      status: "Low Stock"
    },
    {
      id: 6,
      name: "Hoodie",
      image: "https://via.placeholder.com/50",
      category: "hoodies",
      stockQuantity: 200,
      reorderLevel: 50,
      supplier: "Sportswear Inc.",
      lastRestocked: "2024-01-05",
      status: "In Stock"
    },
    {
      id: 7,
      name: "Team Uniform Set",
      image: "https://via.placeholder.com/50",
      category: "uniforms",
      stockQuantity: 75,
      reorderLevel: 40,
      supplier: "Sportswear Inc.",
      lastRestocked: "2024-01-18",
      status: "In Stock"
    },
    {
      id: 8,
      name: "Basketball Official",
      image: "https://via.placeholder.com/50",
      category: "balls",
      stockQuantity: 45,
      reorderLevel: 25,
      supplier: "Sports Equipment Co.",
      lastRestocked: "2024-01-20",
      status: "In Stock"
    }
  ]);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
  const [showOrdersSearch, setShowOrdersSearch] = useState(false);
  const [ordersFilterStatus, setOrdersFilterStatus] = useState('all');
  const [showOrdersFilterDropdown, setShowOrdersFilterDropdown] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5;

  const getStockStatusColor = (status) => {
    const colors = {
      'In Stock': '#10b981',
      'Low Stock': '#f59e0b',
      'Out of Stock': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getProgressPercentage = (quantity, reorderLevel) => {
    if (quantity === 0) return 0;
    const max = reorderLevel * 5;
    return Math.min((quantity / max) * 100, 100);
  };

  const formatCategory = (category) => {
    if (!category) return '';
    // Format category names for display: "t-shirts" -> "T-Shirts", "long sleeves" -> "Long Sleeves"
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
  };

  const handleRestock = (item) => {
    setRestockingItem(item);
    setRestockQuantity('');
  };

  const handleRestockSubmit = () => {
    if (!restockQuantity || parseInt(restockQuantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === restockingItem.id) {
        const newQuantity = item.stockQuantity + parseInt(restockQuantity);
        let newStatus = 'In Stock';
        if (newQuantity === 0) {
          newStatus = 'Out of Stock';
        } else if (newQuantity <= item.reorderLevel) {
          newStatus = 'Low Stock';
        }
        
        return {
          ...item,
          stockQuantity: newQuantity,
          status: newStatus,
          lastRestocked: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));

    setRestockingItem(null);
    setRestockQuantity('');
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const confirmDelete = () => {
    if (deleteConfirmItem) {
      setStockItems(prev => prev.filter(item => item.id !== deleteConfirmItem.id));
      setDeleteConfirmItem(null);
    }
  };

  const handleUpdateItem = (updatedItem) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === updatedItem.id) {
        let status = updatedItem.status;
        if (updatedItem.stockQuantity === 0) {
          status = 'Out of Stock';
        } else if (updatedItem.stockQuantity <= updatedItem.reorderLevel) {
          status = 'Low Stock';
        } else {
          status = 'In Stock';
        }
        
        return { ...updatedItem, status };
      }
      return item;
    }));
    setEditingItem(null);
  };

  const handleAddStock = () => {
    setShowAddStockModal(true);
    setNewStockItem({
      name: '',
      category: '',
      stockQuantity: '',
      reorderLevel: ''
    });
  };

  const handleAddStockSubmit = () => {
    // Validation
    if (!newStockItem.name || !newStockItem.category) {
      alert('Please fill in all required fields (Name, Category)');
      return;
    }

    const stockQuantity = parseInt(newStockItem.stockQuantity) || 0;
    const reorderLevel = parseInt(newStockItem.reorderLevel) || 0;

    if (stockQuantity < 0 || reorderLevel < 0) {
      alert('Stock quantity and reorder level must be non-negative numbers');
      return;
    }

    // Determine status based on stock quantity
    let status = 'In Stock';
    if (stockQuantity === 0) {
      status = 'Out of Stock';
    } else if (stockQuantity <= reorderLevel) {
      status = 'Low Stock';
    }

    // Generate new ID (get max ID from existing items + 1)
    const newId = stockItems.length > 0 
      ? Math.max(...stockItems.map(item => item.id)) + 1 
      : 1;

    // Create new stock item
    const itemToAdd = {
      id: newId,
      name: newStockItem.name,
      image: "https://via.placeholder.com/50",
      category: newStockItem.category,
      stockQuantity: stockQuantity,
      reorderLevel: reorderLevel,
      supplier: "N/A",
      lastRestocked: new Date().toISOString().split('T')[0],
      status: status
    };

    // Add to stock items
    setStockItems(prev => [...prev, itemToAdd]);

    // Close modal and reset form
    setShowAddStockModal(false);
    setNewStockItem({
      name: '',
      category: '',
      stockQuantity: '',
      reorderLevel: ''
    });
  };

  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !stockFilters.category || item.category === stockFilters.category;
    const matchesStatus = !stockFilters.status || item.status === stockFilters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const INITIAL_STOCK_DISPLAY = 5;
  const displayedStockItems = showAllStockItems 
    ? filteredStockItems 
    : filteredStockItems.slice(0, INITIAL_STOCK_DISPLAY);
  const hasMoreStockItems = filteredStockItems.length > INITIAL_STOCK_DISPLAY && !showAllStockItems;

  const lowStockItems = stockItems
    .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 10);

  const categories = [...new Set(stockItems.map(item => item.category))];
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];
  const suppliers = [...new Set(stockItems.map(item => item.supplier))];
  
  // Available categories for dropdown
  const availableCategories = [
    { value: 'jerseys', label: 'Jerseys' },
    { value: 't-shirts', label: 'T-Shirts' },
    { value: 'long sleeves', label: 'Long Sleeves' },
    { value: 'hoodies', label: 'Hoodies' },
    { value: 'uniforms', label: 'Uniforms' },
    { value: 'balls', label: 'Balls' },
    { value: 'trophies', label: 'Trophies' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dashboard1-header-actions')) {
        setShowOrdersFilterDropdown(false);
      }
      if (!event.target.closest('.dashboard1-stock-controls')) {
        setShowStockFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchMetricsData();
  }, []);

  useEffect(() => {
    fetchRecentOrders(true);
    
    // Refresh orders every 30 seconds to keep data up to date (silently, without loading spinner)
    const refreshInterval = setInterval(() => {
      fetchRecentOrders(false);
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchMetricsData = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch analytics data from API
      const response = await fetch(`${API_URL}/api/analytics/dashboard`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Calculate metrics from real data
        const totalRevenue = data.summary?.totalRevenue || 0;
        const totalOrders = data.summary?.totalOrders || 0;
        const totalCustomers = data.summary?.totalCustomers || 0;
        
        // Calculate percentage changes (mock calculation for now)
        const revenueChange = totalRevenue > 0 ? '+12%' : '+0%';
        const ordersChange = totalOrders > 0 ? '+8%' : '+0%';
        const customersChange = totalCustomers > 0 ? '+15%' : '+0%';
        
        setDashboardStats({
          totalSales: totalRevenue,
          totalCustomers: totalCustomers,
          totalOrders: totalOrders,
          salesTrend: revenueChange,
          customersTrend: customersChange,
          ordersTrend: ordersChange
        });
      }
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      // Keep default values on error
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setOrdersLoading(true);
      }
      const response = await orderService.getAllOrders({
        limit: 100,
        dateSort: 'desc'
      });
      
      if (response && response.orders && Array.isArray(response.orders)) {
        const formattedOrders = response.orders.map(order => {
          const formattedOrder = order.orderItems ? order : orderService.formatOrderForDisplay(order);
          
          return {
            id: formattedOrder.id,
            email: formattedOrder.customer_email || formattedOrder.customerEmail || order.customer_email || order.email || 'N/A',
            product: getProductName(formattedOrder),
            date: formatOrderDate(formattedOrder.orderDate || formattedOrder.created_at || order.created_at),
            status: formattedOrder.status || order.status || 'pending',
            statusColor: getStatusColor(formattedOrder.status || order.status)
          };
        });
        setOrders(formattedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setOrders([]);
    } finally {
      if (showLoading) {
        setOrdersLoading(false);
      }
    }
  };

  const getProductName = (order) => {
    const orderItems = order.order_items || order.orderItems || order.items || [];
    
    if (orderItems && orderItems.length > 0) {
      const productNames = orderItems
        .map(item => {
          const productName = item.name || 
                            item.product_name || 
                            item.productName || 
                            item.product?.name ||
                            null;
          const quantity = parseInt(item.quantity) || 1;
          const size = item.size || item.product_size;
          
          return {
            name: productName,
            quantity: quantity,
            size: size
          };
        })
        .filter(item => item.name && item.name.trim() !== '');
      
      if (productNames.length > 0) {
        const productGroups = {};
        productNames.forEach(item => {
          const key = item.name;
          if (!productGroups[key]) {
            productGroups[key] = {
              name: key,
              totalQuantity: 0,
              sizes: []
            };
          }
          productGroups[key].totalQuantity += item.quantity;
          if (item.size && !productGroups[key].sizes.includes(item.size)) {
            productGroups[key].sizes.push(item.size);
          }
        });
        
        const products = Object.values(productGroups);
        
        if (products.length === 1) {
          const product = products[0];
          const quantityText = product.totalQuantity > 1 ? ` (${product.totalQuantity}x)` : '';
          const sizeText = product.sizes.length > 0 ? ` - Size: ${product.sizes.join(', ')}` : '';
          return `${product.name}${quantityText}${sizeText}`;
        } else if (products.length === 2) {
          return products.map(p => `${p.name} (${p.totalQuantity}x)`).join(', ');
        } else {
          const firstTwo = products.slice(0, 2).map(p => `${p.name} (${p.totalQuantity}x)`).join(', ');
          const remaining = products.length - 2;
          return `${firstTwo} +${remaining} more product${remaining > 1 ? 's' : ''}`;
        }
      }
    }
    
    if (order.product_name) {
      return order.product_name;
    }
    
    return 'No Product Name';
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed' || 
        statusLower === 'delivered' || 
        statusLower === 'picked_up_delivered' ||
        statusLower === 'picked up delivered') return 'blue';
    if (statusLower === 'processing' || statusLower === 'process') return 'orange';
    if (statusLower === 'pending') return 'red';
    return 'orange';
  };

  const handleOrdersSearch = (e) => {
    setOrdersSearchTerm(e.target.value);
    setShowOrdersFilterDropdown(false);
  };

  const handleOrdersSearchToggle = () => {
    setShowOrdersSearch(!showOrdersSearch);
    if (!showOrdersSearch) {
      setShowOrdersFilterDropdown(false);
    }
    if (showOrdersSearch) {
      setOrdersSearchTerm('');
    }
  };

  const handleOrdersFilterToggle = () => {
    setShowOrdersFilterDropdown(!showOrdersFilterDropdown);
    if (!showOrdersFilterDropdown) {
      setShowOrdersSearch(false);
    }
  };

  const handleOrdersFilterSelect = (status) => {
    setOrdersFilterStatus(status);
    setShowOrdersFilterDropdown(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !ordersSearchTerm || 
      order.email.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
      order.date.toLowerCase().includes(ordersSearchTerm.toLowerCase());
    
    const orderStatus = (order.status || '').toLowerCase().trim();
    
    let matchesFilter = true;
    if (ordersFilterStatus !== 'all') {
      const filterStatusLower = ordersFilterStatus.toLowerCase();
      
      if (filterStatusLower === 'pending') {
        matchesFilter = orderStatus === 'pending';
      } else if (filterStatusLower === 'processing') {
        // Processing includes: confirmed, layout, sizing, printing, press, prod, packing_completing
        // Exclude pending, cancelled, and delivered statuses
        if (orderStatus === 'pending' || 
            orderStatus === 'cancelled' || 
            orderStatus === 'canceled' ||
            orderStatus === 'delivered' ||
            orderStatus === 'picked_up_delivered' ||
            orderStatus === 'picked up delivered') {
          return false;
        }
        const processingStatuses = [
          'confirmed',
          'layout',
          'sizing',
          'printing',
          'press',
          'prod',
          'packing',
          'packing_completing'
        ];
        matchesFilter = processingStatuses.includes(orderStatus);
      } else if (filterStatusLower === 'delivered') {
        // Delivered includes picked_up_delivered and delivered
        // Exclude pending, cancelled, and processing statuses
        if (orderStatus === 'pending' || 
            orderStatus === 'cancelled' || 
            orderStatus === 'canceled' ||
            orderStatus === 'confirmed' ||
            orderStatus === 'layout' ||
            orderStatus === 'sizing' ||
            orderStatus === 'printing' ||
            orderStatus === 'press' ||
            orderStatus === 'prod' ||
            orderStatus === 'packing' ||
            orderStatus === 'packing_completing') {
          return false;
        }
        matchesFilter = orderStatus === 'delivered' ||
                       orderStatus === 'picked_up_delivered' ||
                       orderStatus === 'picked up delivered';
      } else {
        matchesFilter = orderStatus === filterStatusLower;
      }
    } else {
      if (orderStatus === 'cancelled' || orderStatus === 'canceled') {
        return false;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const displayedOrders = showAllOrders ? filteredOrders : filteredOrders.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreOrders = filteredOrders.length > INITIAL_DISPLAY_COUNT && !showAllOrders;

  const getOrdersFilterLabel = () => {
    switch(ordersFilterStatus.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'delivered': return 'Delivered';
      default: return 'All Status';
    }
  };

  const getOrdersFilterIcon = () => {
    return (
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard1-container">
      {/* Main Content */}
      <main className="dashboard1-main">
        {/* Top Cards Section */}
        <div className="dashboard1-top-cards">
          <div className="dashboard1-stat-card dashboard1-sales-card">
            <div className="dashboard1-stat-icon">
              <span style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₱</span>
            </div>
            <div className="dashboard1-stat-content">
              <p className="dashboard1-stat-label">Total Sales</p>
              <h3 className="dashboard1-stat-value">{formatCurrency(dashboardStats.totalSales)}</h3>
              <div className="dashboard1-stat-trend">
                <FontAwesomeIcon icon={faChevronUp} />
                <span>{dashboardStats.salesTrend}</span>
              </div>
            </div>
          </div>

          <div className="dashboard1-stat-card dashboard1-customers-card">
            <div className="dashboard1-stat-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="dashboard1-stat-content">
              <p className="dashboard1-stat-label">Total Customers</p>
              <h3 className="dashboard1-stat-value">{dashboardStats.totalCustomers.toLocaleString()}</h3>
              <div className="dashboard1-stat-trend">
                <FontAwesomeIcon icon={faChevronUp} />
                <span>{dashboardStats.customersTrend}</span>
              </div>
            </div>
          </div>

          <div className="dashboard1-stat-card dashboard1-orders-card">
            <div className="dashboard1-stat-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <div className="dashboard1-stat-content">
              <p className="dashboard1-stat-label">Total Orders</p>
              <h3 className="dashboard1-stat-value">{dashboardStats.totalOrders.toLocaleString()}</h3>
              <div className="dashboard1-stat-trend">
                <FontAwesomeIcon icon={faChevronUp} />
                <span>{dashboardStats.ordersTrend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Chart Section */}
        <div className="dashboard1-chart-section">
          <div className="dashboard1-chart-wrapper">
            <EarningsChart />
          </div>
          
          {/* Low Stock Side Panel */}
          <div className="dashboard1-stock-sidebar dashboard1-chart-sidebar">
            <h4 className="dashboard1-sidebar-title-small">Low-Stock Items</h4>
            {lowStockItems.length === 0 ? (
              <p className="dashboard1-no-low-stock">All items well stocked</p>
            ) : (
              <ul className="dashboard1-low-stock-list">
                {lowStockItems.map((item) => (
                  <li key={item.id} className="dashboard1-low-stock-item">
                    <div className="dashboard1-low-stock-info">
                      <span className="dashboard1-low-stock-name">{item.name}</span>
                      <span 
                        className="dashboard1-low-stock-qty"
                        style={{ 
                          backgroundColor: getStockStatusColor(item.status) + '20',
                          color: getStockStatusColor(item.status)
                        }}
                      >
                        {item.stockQuantity} units
                      </span>
                    </div>
                    <div className="dashboard1-low-stock-bar">
                      <div 
                        className="dashboard1-low-stock-progress"
                        style={{
                          width: `${getProgressPercentage(item.stockQuantity, item.reorderLevel)}%`,
                          backgroundColor: getStockStatusColor(item.status)
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Stock Management Section */}
        <div className="dashboard1-stock-section">
          <div className="dashboard1-stock-main" style={{ width: '100%' }}>
            <div className="dashboard1-stock-header">
              <h3 className="dashboard1-stock-title">Stock Management</h3>
              <div className="dashboard1-stock-controls">
                {showStockSearch && (
                  <input
                    type="text"
                    className="dashboard1-search-input stock-search-input"
                    placeholder="Search by item, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                )}
                <button 
                  className={`dashboard1-search-btn stock-search-btn ${showStockSearch ? 'active' : ''}`}
                  onClick={() => {
                    setShowStockSearch(!showStockSearch);
                    if (showStockSearch) {
                      setSearchTerm('');
                    }
                  }}
                  aria-label="Search"
                  title="Search items"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
                <div className="dashboard1-filter-container">
                  <button 
                    className={`dashboard1-filter-toggle ${showStockFilters ? 'active' : ''}`}
                    onClick={() => setShowStockFilters(!showStockFilters)}
                  >
                    <FontAwesomeIcon icon={faFilter} />
                    <span>Filter</span>
                  </button>
                  {showStockFilters && (
                    <div className="dashboard1-filter-dropdown">
                      <select
                        value={stockFilters.category}
                        onChange={(e) => setStockFilters({...stockFilters, category: e.target.value})}
                        className="dashboard1-filter-select"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{formatCategory(cat)}</option>
                        ))}
                      </select>
                      <select
                        value={stockFilters.status}
                        onChange={(e) => setStockFilters({...stockFilters, status: e.target.value})}
                        className="dashboard1-filter-select"
                      >
                        <option value="">All Status</option>
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <button className="dashboard1-add-btn" onClick={handleAddStock}>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add Stock</span>
                </button>
              </div>
            </div>

            <div className="dashboard1-table-container">
              <table className="dashboard1-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Stock Quantity</th>
                    <th>Last Restocked</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStockItems.map((item) => {
                    const progressPercentage = getProgressPercentage(item.stockQuantity, item.reorderLevel);
                    const statusColor = getStockStatusColor(item.status);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="dashboard1-item-cell">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="dashboard1-item-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{formatCategory(item.category)}</td>
                        <td>
                          <div className="dashboard1-stock-cell">
                            <div className="dashboard1-stock-progress">
                              <div 
                                className="dashboard1-stock-progress-bar"
                                style={{
                                  width: `${progressPercentage}%`,
                                  backgroundColor: statusColor
                                }}
                              />
                            </div>
                            <span className="dashboard1-stock-value">{item.stockQuantity}</span>
                          </div>
                        </td>
                        <td>{formatDate(item.lastRestocked)}</td>
                        <td>
                          <span 
                            className="dashboard1-status-badge"
                            style={{ backgroundColor: statusColor + '20', color: statusColor }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="dashboard1-action-buttons">
                            <button 
                              className="dashboard1-action-btn dashboard1-edit-btn" 
                              title="Edit"
                              onClick={() => handleEdit(item)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="dashboard1-action-btn dashboard1-restock-btn" 
                              title="Restock"
                              onClick={() => handleRestock(item)}
                            >
                              <FontAwesomeIcon icon={faBoxOpen} />
                            </button>
                            <button 
                              className="dashboard1-action-btn dashboard1-delete-btn" 
                              title="Delete"
                              onClick={() => handleDelete(item)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasMoreStockItems && (
                <div className="dashboard1-view-more-container">
                  <button 
                    className="dashboard1-view-more-btn"
                    onClick={() => setShowAllStockItems(true)}
                  >
                    <span>View More</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </button>
                </div>
              )}
              {showAllStockItems && filteredStockItems.length > INITIAL_STOCK_DISPLAY && (
                <div className="dashboard1-view-more-container">
                  <button 
                    className="dashboard1-view-more-btn dashboard1-view-less-btn"
                    onClick={() => {
                      setShowAllStockItems(false);
                      document.querySelector('.dashboard1-table-container')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>Show Less</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Stock Modal */}
        {editingItem && (
          <div className="dashboard1-modal-overlay" onClick={() => setEditingItem(null)}>
            <div className="dashboard1-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard1-modal-header">
                <h3>Edit Stock Item</h3>
                <button className="dashboard1-modal-close" onClick={() => setEditingItem(null)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="dashboard1-modal-body">
                <div className="dashboard1-form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="dashboard1-form-input"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={editingItem.stockQuantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0;
                      setEditingItem({ ...editingItem, stockQuantity: qty });
                    }}
                    className="dashboard1-form-input"
                    min="0"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    value={editingItem.reorderLevel}
                    onChange={(e) => setEditingItem({ ...editingItem, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="dashboard1-form-input"
                    min="0"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="dashboard1-form-input"
                  >
                    <option value="jerseys">Jerseys</option>
                    <option value="t-shirts">T-Shirts</option>
                    <option value="long sleeves">Long Sleeves</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="uniforms">Uniforms</option>
                    <option value="balls">Balls</option>
                    <option value="trophies">Trophies</option>
                  </select>
                </div>
              </div>
              <div className="dashboard1-modal-footer">
                <button 
                  className="dashboard1-btn-cancel"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button 
                  className="dashboard1-btn-save"
                  onClick={() => handleUpdateItem(editingItem)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {restockingItem && (
          <div className="dashboard1-modal-overlay" onClick={() => {
            setRestockingItem(null);
            setRestockQuantity('');
          }}>
            <div className="dashboard1-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard1-modal-header">
                <h3>Restock Item</h3>
                <button className="dashboard1-modal-close" onClick={() => {
                  setRestockingItem(null);
                  setRestockQuantity('');
                }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="dashboard1-modal-body">
                <div className="dashboard1-form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={restockingItem.name}
                    disabled
                    className="dashboard1-form-input"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Current Stock</label>
                  <input
                    type="number"
                    value={restockingItem.stockQuantity}
                    disabled
                    className="dashboard1-form-input"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Quantity to Add</label>
                  <input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    className="dashboard1-form-input"
                    min="1"
                    placeholder="Enter quantity"
                    autoFocus
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>New Stock After Restock</label>
                  <input
                    type="number"
                    value={restockingItem.stockQuantity + (parseInt(restockQuantity) || 0)}
                    disabled
                    className="dashboard1-form-input"
                  />
                </div>
              </div>
              <div className="dashboard1-modal-footer">
                <button 
                  className="dashboard1-btn-cancel"
                  onClick={() => {
                    setRestockingItem(null);
                    setRestockQuantity('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="dashboard1-btn-save"
                  onClick={handleRestockSubmit}
                >
                  Restock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmItem && (
          <div className="dashboard1-modal-overlay" onClick={() => setDeleteConfirmItem(null)}>
            <div className="dashboard1-modal-content dashboard1-delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard1-modal-header">
                <h3>Delete Stock Item</h3>
                <button className="dashboard1-modal-close" onClick={() => setDeleteConfirmItem(null)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="dashboard1-modal-body">
                <div className="dashboard1-delete-warning">
                  <p className="dashboard1-delete-message">
                    Are you sure you want to delete <strong>{deleteConfirmItem.name}</strong>?
                  </p>
                  <p className="dashboard1-delete-submessage">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="dashboard1-modal-footer">
                <button 
                  className="dashboard1-btn-cancel"
                  onClick={() => setDeleteConfirmItem(null)}
                >
                  Cancel
                </button>
                <button 
                  className="dashboard1-btn-delete"
                  onClick={confirmDelete}
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Stock Modal */}
        {showAddStockModal && (
          <div className="dashboard1-modal-overlay" onClick={() => {
            setShowAddStockModal(false);
            setNewStockItem({
              name: '',
              category: '',
              stockQuantity: '',
              reorderLevel: ''
            });
          }}>
            <div className="dashboard1-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard1-modal-header">
                <h3>Add New Stock Item</h3>
                <button className="dashboard1-modal-close" onClick={() => {
                  setShowAddStockModal(false);
                  setNewStockItem({
                    name: '',
                    category: '',
                    stockQuantity: '',
                    reorderLevel: ''
                  });
                }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="dashboard1-modal-body">
                <div className="dashboard1-form-group">
                  <label>Item Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={newStockItem.name}
                    onChange={(e) => setNewStockItem({ ...newStockItem, name: e.target.value })}
                    className="dashboard1-form-input"
                    placeholder="Enter item name"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={newStockItem.category}
                    onChange={(e) => setNewStockItem({ ...newStockItem, category: e.target.value })}
                    className="dashboard1-form-input"
                  >
                    <option value="">Select category</option>
                    {availableCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="dashboard1-form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={newStockItem.stockQuantity}
                    onChange={(e) => setNewStockItem({ ...newStockItem, stockQuantity: e.target.value })}
                    className="dashboard1-form-input"
                    placeholder="Enter initial stock quantity"
                    min="0"
                  />
                </div>
                <div className="dashboard1-form-group">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    value={newStockItem.reorderLevel}
                    onChange={(e) => setNewStockItem({ ...newStockItem, reorderLevel: e.target.value })}
                    className="dashboard1-form-input"
                    placeholder="Enter reorder level"
                    min="0"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Stock status will be marked as "Low Stock" when quantity reaches this level
                  </small>
                </div>
              </div>
              <div className="dashboard1-modal-footer">
                <button 
                  className="dashboard1-btn-cancel"
                  onClick={() => {
                    setShowAddStockModal(false);
                    setNewStockItem({
                      name: '',
                      category: '',
                      stockQuantity: '',
                      reorderLevel: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="dashboard1-btn-save"
                  onClick={handleAddStockSubmit}
                >
                  Add Stock Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders Section */}
        <div className="dashboard1-orders-card recent-orders">
          <div className="dashboard1-stock-header">
            <h3 className="dashboard1-stock-title">Recent Orders</h3>
            <div className="dashboard1-stock-controls">
              {showOrdersSearch && (
                <input
                  type="text"
                  className="dashboard1-search-input stock-search-input"
                  placeholder="Search by email, product, or date..."
                  value={ordersSearchTerm}
                  onChange={handleOrdersSearch}
                  autoFocus
                />
              )}
              <button 
                className={`dashboard1-search-btn stock-search-btn ${showOrdersSearch ? 'active' : ''}`}
                onClick={handleOrdersSearchToggle}
                aria-label="Search"
                title="Search orders"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
              <div className="dashboard1-filter-container">
                <button 
                  className={`dashboard1-filter-toggle ${showOrdersFilterDropdown ? 'active' : ''}`}
                  onClick={handleOrdersFilterToggle}
                  aria-label="Filter"
                  title={`Filter: ${getOrdersFilterLabel()}`}
                >
                  <FontAwesomeIcon icon={faFilter} />
                  <span>Filter</span>
                </button>
                {showOrdersFilterDropdown && (
                  <div className="dashboard1-filter-dropdown">
                    <div 
                      className={`filter-option ${ordersFilterStatus === 'all' ? 'active' : ''}`}
                      onClick={() => handleOrdersFilterSelect('all')}
                    >
                      <span>All Status</span>
                      {ordersFilterStatus === 'all' && <span className="check-mark">✓</span>}
                    </div>
                    <div 
                      className={`filter-option ${ordersFilterStatus === 'pending' ? 'active' : ''}`}
                      onClick={() => handleOrdersFilterSelect('pending')}
                    >
                      <span>Pending</span>
                      {ordersFilterStatus === 'pending' && <span className="check-mark">✓</span>}
                    </div>
                    <div 
                      className={`filter-option ${ordersFilterStatus === 'processing' ? 'active' : ''}`}
                      onClick={() => handleOrdersFilterSelect('processing')}
                    >
                      <span>Processing</span>
                      {ordersFilterStatus === 'processing' && <span className="check-mark">✓</span>}
                    </div>
                    <div 
                      className={`filter-option ${ordersFilterStatus === 'delivered' ? 'active' : ''}`}
                      onClick={() => handleOrdersFilterSelect('delivered')}
                    >
                      <span>Delivered</span>
                      {ordersFilterStatus === 'delivered' && <span className="check-mark">✓</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="table-wrapper">
            {ordersLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <p>{orders.length === 0 ? 'No data order yet' : 'No orders found'}</p>
              </div>
            ) : (
              <>
                <div className="recent-orders-header-row">
                  <div className="recent-orders-header-cell recent-orders-col-email">Users Email</div>
                  <div className="recent-orders-header-cell recent-orders-col-product">Product</div>
                  <div className="recent-orders-header-cell recent-orders-col-date">Date</div>
                  <div className="recent-orders-header-cell recent-orders-col-status">Status</div>
                </div>
                
                {displayedOrders.map((order) => (
                  <div key={order.id} className="recent-orders-row">
                    <div className="recent-orders-cell recent-orders-col-email">
                      {order.email}
                    </div>
                    <div className="recent-orders-cell recent-orders-col-product">
                      {order.product}
                    </div>
                    <div className="recent-orders-cell recent-orders-col-date">
                      {order.date}
                    </div>
                    <div className="recent-orders-cell recent-orders-col-status">
                      <span className={`recent-orders-status-badge ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {hasMoreOrders && (
                  <button 
                    className="view-more-btn"
                    onClick={() => setShowAllOrders(true)}
                  >
                    View More ({filteredOrders.length - INITIAL_DISPLAY_COUNT} more)
                  </button>
                )}
                
                {showAllOrders && filteredOrders.length > INITIAL_DISPLAY_COUNT && (
                  <button 
                    className="view-less-btn"
                    onClick={() => {
                      setShowAllOrders(false);
                      document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Show Less
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard1;

