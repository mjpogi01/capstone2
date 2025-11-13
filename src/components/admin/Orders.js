import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaShoppingCart, 
  FaEye, 
  FaSort, 
  FaFilter, 
  FaChevronDown, 
  FaChevronUp,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBox,
  FaDollarSign,
  FaClock,
  FaCheck,
  FaTimes,
  FaFileAlt,
  FaPalette,
  FaRuler,
  FaPrint,
  FaCog,
  FaIndustry,
  FaShippingFast,
  FaRedo,
  FaArrowLeft,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaCamera,
  FaSearch,
  FaUpload
} from 'react-icons/fa';
import './Orders.css';
import './FloatingButton.css';
import './OrderNotification.css';
import orderService from '../../services/orderService';
import { getApparelSizeVisibility } from '../../utils/orderSizing';
import designUploadService from '../../services/designUploadService';
import chatService from '../../services/chatService';
import OrderNotification from './OrderNotification';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [uploadingDesigns, setUploadingDesigns] = useState({});
  const [notifications, setNotifications] = useState([]);
  const loadingNotificationRef = React.useRef(null);
  const updatingOrdersRef = React.useRef(new Set());
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [orderApprovalStatus, setOrderApprovalStatus] = useState({}); // Track approval status per order
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1
  });

  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    inProgress: 0,
    pending: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    pickupBranch: '',
    status: '',
    searchTerm: ''
  });

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderService.getAllOrders({
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        });
        console.log('📦 [Orders Component] API Response:', response);
        console.log('📦 [Orders Component] Total orders returned:', response.orders?.length);
        console.log('📦 [Orders Component] Pagination info:', response.pagination);
        
        // Add null check for response.orders
        if (response && response.orders && Array.isArray(response.orders)) {
          const formattedOrders = response.orders.map(order => orderService.formatOrderForDisplay(order));
          console.log('📦 [Orders Component] Formatted orders:', formattedOrders.length);
          setOrders(formattedOrders);
          setFilteredOrders(formattedOrders);
          if (response.pagination) {
            setPagination(response.pagination);
          }

          if (response.stats) {
            setStats({
              total: response.stats.total ?? formattedOrders.length,
              delivered: response.stats.delivered ?? formattedOrders.filter(o => o.status === 'picked_up_delivered').length,
              inProgress: response.stats.inProgress ?? formattedOrders.filter(o => ['layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(o.status)).length,
              pending: response.stats.pending ?? formattedOrders.filter(o => o.status === 'pending').length
            });
          } else {
            setStats({
              total: formattedOrders.length,
              delivered: formattedOrders.filter(o => o.status === 'picked_up_delivered').length,
              inProgress: formattedOrders.filter(o => ['layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(o.status)).length,
              pending: formattedOrders.filter(o => o.status === 'pending').length
            });
          }
        } else {
          console.warn('No orders data received or invalid format:', response);
          setOrders([]);
          setFilteredOrders([]);
          setStats({
            total: 0,
            delivered: 0,
            inProgress: 0,
            pending: 0
          });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setFilteredOrders([]);
        setStats({
          total: 0,
          delivered: 0,
          inProgress: 0,
          pending: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters.pickupBranch, filters.status, pagination.page, pagination.limit]);

  // Apply filters and sorting
  useEffect(() => {
    // Safety check to ensure orders is always an array
    let filtered = Array.isArray(orders) ? [...orders] : [];

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Pickup branch filter
    if (filters.pickupBranch) {
      filtered = filtered.filter(order => 
        order.pickupLocation === filters.pickupBranch
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => 
        order.status === filters.status
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'orderDate') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      if (sortConfig.key === 'totalAmount') {
        return sortConfig.direction === 'asc' 
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    setFilteredOrders(filtered);
  }, [orders, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      pickupBranch: '',
      status: '',
      searchTerm: ''
    });
    setSortConfig({ key: 'orderDate', direction: 'desc' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up_delivered': return 'green';
      case 'packing_completing': return 'blue';
      case 'prod': return 'blue';
      case 'press': return 'blue';
      case 'printing': return 'blue';
      case 'sizing': return 'blue';
      case 'layout': return 'blue';
      case 'confirmed': return 'blue';
      case 'pending': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusDisplayName = (status) => {
    const displayNames = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'layout': 'LAYOUT',
      'sizing': 'SIZING',
      'printing': 'PRINTING',
      'press': 'PRESS',
      'prod': 'PROD',
      'packing_completing': 'PACKING',
      'picked_up_delivered': 'PICKED UP/DELIVERED',
      'cancelled': 'CANCELLED'
    };
    return displayNames[status] || status.toUpperCase();
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending': return 'Awaiting confirmation';
      case 'confirmed': return 'Design upload ready';
      case 'layout': return 'Layout in progress';
      case 'sizing': return 'Sizing stage';
      case 'printing': return 'Printing stage';
      case 'press': return 'Press operations';
      case 'prod': return 'Production stage';
      case 'packing_completing': return 'Packing stage';
      case 'picked_up_delivered': return 'Order picked up or delivered';
      case 'cancelled': return 'Order cancelled';
      default: return 'Unknown status';
    }
  };

  const truncateOrderNumber = (orderNumber) => {
    if (!orderNumber || typeof orderNumber !== 'string') {
      return 'N/A';
    }
    if (orderNumber.length > 12) {
      return orderNumber.substring(0, 8) + '...' + orderNumber.substring(orderNumber.length - 4);
    }
    return orderNumber;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Notification helper functions with deduplication
  const addNotification = (notification) => {
    // Create a unique key for deduplication
    const notificationKey = `${notification.type}-${notification.orderNumber}-${notification.message}`;
    const id = Date.now() + Math.random();
    
    setNotifications(prev => {
      // Remove any existing notifications with the same key to prevent duplicates
      const filtered = prev.filter(n => {
        const existingKey = `${n.type}-${n.orderNumber}-${n.message}`;
        return existingKey !== notificationKey;
      });
      
      // Add the new notification
      const newNotification = {
        id,
        key: notificationKey,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        orderNumber: notification.orderNumber,
        status: notification.status,
        duration: notification.duration || 5000,
        autoClose: notification.autoClose !== false,
        ...notification
      };
      return [...filtered, newNotification];
    });
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper function to get readable status name for notifications
  const getNotificationStatusName = (status) => {
    const statusNames = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      layout: 'Layout',
      sizing: 'Sizing',
      printing: 'Printing',
      press: 'Press',
      prod: 'Production',
      packing_completing: 'Packing/Completing',
      picked_up_delivered: 'Picked Up/Delivered',
      cancelled: 'Cancelled'
    };
    return statusNames[status] || status;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // Prevent duplicate updates for the same order
      if (updatingOrdersRef.current.has(orderId)) {
        console.log(`⚠️ Order ${orderId} is already being updated, skipping duplicate request`);
        return;
      }
      
      // Mark this order as being updated
      updatingOrdersRef.current.add(orderId);
      
      console.log(`🔄 Frontend: Updating order ${orderId} to status: ${newStatus}`);
      
      // Find the order to get its details
      const order = orders.find(o => o.id === orderId);
      const orderNumber = order?.orderNumber || `#${orderId}`;
      const oldStatus = order?.status || 'unknown';
      
      // Check role-based restrictions
      const userRole = user?.user_metadata?.role || 'customer';
      
      if (newStatus === 'sizing' && userRole !== 'artist') {
        updatingOrdersRef.current.delete(orderId);
        addNotification({
          type: 'error',
          title: 'Permission Denied',
          message: 'Only artists can move orders to sizing status',
          orderNumber: orderNumber,
          status: oldStatus,
          duration: 4000
        });
        return;
      }
      
      // Optimistic update - update UI immediately for faster response
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Show success notification immediately
      addNotification({
        type: 'success',
        title: 'Order Status Updated',
        message: `Order successfully moved to ${getNotificationStatusName(newStatus)}`,
        orderNumber: orderNumber,
        status: newStatus,
        duration: 3000
      });
      
      // Make API call in background (non-blocking)
      orderService.updateOrderStatus(orderId, newStatus)
        .then(() => {
          console.log(`✅ Frontend: Order status update successful`);
          updatingOrdersRef.current.delete(orderId);
        })
        .catch((error) => {
          console.error('Error updating order status:', error);
          
          // Revert optimistic update on error
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === orderId
                ? { ...order, status: oldStatus }
                : order
            )
          );
          setFilteredOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === orderId
                ? { ...order, status: oldStatus }
                : order
            )
          );
          
          // Handle specific error messages from backend
          let errorTitle = 'Update Failed';
          let errorMessage = error.message || 'Failed to update order status. Please try again.';
          
          if (error.message && error.message.includes('Only artists can move orders to sizing status')) {
            errorTitle = 'Permission Denied';
            errorMessage = 'Only artists can move orders to sizing status';
          } else if (error.message && error.message.includes('Design files must be uploaded')) {
            errorTitle = 'Design Files Required';
            errorMessage = 'Design files must be uploaded before moving to sizing status';
          } else if (error.message && error.message.includes('Order must be in layout status')) {
            errorTitle = 'Invalid Status Transition';
            errorMessage = 'Order must be in layout status before moving to sizing';
          }
          
          addNotification({
            type: 'error',
            title: errorTitle,
            message: errorMessage,
            orderNumber: orderNumber,
            status: oldStatus,
            duration: 4000
          });
          
          updatingOrdersRef.current.delete(orderId);
        });
    } catch (error) {
      console.error('Unexpected error in handleStatusUpdate:', error);
      updatingOrdersRef.current.delete(orderId);
    }
  };

  // Check if design is approved or review timed out (1 hour)
  const checkDesignApprovalStatus = useCallback(async (orderId) => {
    try {
      // Get chat room for this order
      const chatRoom = await chatService.getChatRoomByOrder(orderId);
      if (!chatRoom) {
        return false; // No chat room means no review request yet
      }

      // Get all messages for the chat room
      const messages = await chatService.getChatRoomMessages(chatRoom.id);
      if (!messages || messages.length === 0) {
        return false;
      }

      // Sort messages by created_at to process in chronological order
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      // Find the most recent review_request
      const reviewRequests = sortedMessages.filter(msg => 
        msg.message_type === 'review_request' && msg.sender_type === 'artist'
      );

      if (reviewRequests.length === 0) {
        return false; // No review request found
      }

      const mostRecentReviewRequest = reviewRequests[reviewRequests.length - 1];
      const reviewRequestTime = new Date(mostRecentReviewRequest.created_at);
      const now = new Date();
      const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const timeSinceRequest = now - reviewRequestTime;

      // Check if there's an approval response after the review request
      const approvalResponse = sortedMessages.find(msg => {
        const msgTime = new Date(msg.created_at);
        return msg.message_type === 'review_response' &&
               msg.sender_type === 'customer' &&
               msgTime > reviewRequestTime &&
               msg.message.toLowerCase().includes('design approved');
      });

      // Return true if:
      // 1. Customer approved the design, OR
      // 2. 1 hour has passed since review request with no response
      const isApproved = !!approvalResponse;
      const isTimedOut = timeSinceRequest >= oneHourInMs && !approvalResponse;

      return isApproved || isTimedOut;
    } catch (error) {
      console.error(`Error checking approval status for order ${orderId}:`, error);
      return false; // Default to false on error
    }
  }, []);

  // Check approval status for all orders when they're loaded
  useEffect(() => {
    const checkAllApprovalStatuses = async () => {
      if (!user || user?.user_metadata?.role !== 'artist') {
        return; // Only check for artists
      }

      const statusMap = {};
      for (const order of filteredOrders) {
        // Only check orders that are in confirmed or layout status
        if (order.status === 'confirmed' || order.status === 'layout') {
          const isApproved = await checkDesignApprovalStatus(order.id);
          statusMap[order.id] = isApproved;
        }
      }
      setOrderApprovalStatus(statusMap);
    };

    if (filteredOrders.length > 0 && !loading) {
      checkAllApprovalStatuses();
    }

    // Set up interval to check every 5 minutes (for 1-hour timeout detection)
    const interval = setInterval(() => {
      if (filteredOrders.length > 0 && !loading && user?.user_metadata?.role === 'artist') {
        checkAllApprovalStatuses();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [filteredOrders, loading, user, checkDesignApprovalStatus]);

  // Handle design file upload
  const handleDesignUpload = async (orderId, files) => {
    if (!files || files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    const userRole = user?.user_metadata?.role || 'customer';
    if (userRole !== 'artist') {
      alert('❌ Only artists can upload design files');
      return;
    }

    try {
      setUploadingDesigns(prev => ({ ...prev, [orderId]: true }));
      
      console.log(`🎨 Uploading design files for order ${orderId}:`, files.length, 'files');
      
      const result = await designUploadService.uploadDesignFiles(orderId, files);
      
      console.log('🎨 Design upload result:', result);
      
      // Update the order in the state with new design files and status
      const updatedDesignFiles = Array.isArray(result.designFiles) ? result.designFiles : [];

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                designFiles: updatedDesignFiles,
                design_files: updatedDesignFiles,
                status: result.newStatus || order.status
              }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                designFiles: updatedDesignFiles,
                design_files: updatedDesignFiles,
                status: result.newStatus || order.status
              }
            : order
        )
      );
      
      // Show success message
      if (result.statusChanged) {
        alert(`✅ Design files uploaded successfully! Order automatically moved to ${result.newStatus} status.`);
      } else {
        alert('✅ Design files uploaded successfully!');
      }
      
    } catch (error) {
      console.error('Error uploading design files:', error);
      alert(`❌ Failed to upload design files: ${error.message}`);
    } finally {
      setUploadingDesigns(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const branches = [
    'MAIN (SAN PASCUAL)',
    'MUZON',
    'ROSARIO',
    'BATANGAS CITY',
    'PINAMALAYAN',
    'CALACA',
    'LEMERY',
    'CALAPAN',
    'BAUAN'
  ];

  const statuses = [
    'pending', 'confirmed', 'layout', 'sizing', 
    'printing', 'press', 'prod', 'packing_completing', 
    'picked_up_delivered', 'cancelled'
  ];

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      {/* Notification System */}
      <OrderNotification 
        notifications={notifications}
        removeNotification={removeNotification}
      />
      
      {/* Confirmation Dialog */}
      {confirmDialog && confirmDialog.show && (
        <div className="confirm-dialog-overlay" onClick={() => confirmDialog.onCancel()}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h3>{confirmDialog.title}</h3>
              <button className="confirm-dialog-close" onClick={() => confirmDialog.onCancel()}>
                <FaTimes />
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p className="confirm-dialog-message">{confirmDialog.message}</p>
              <div className="confirm-dialog-status-change">
                <span className="status-from">{confirmDialog.currentStatus}</span>
                <FaArrowRight className="status-arrow-icon" />
                <span className="status-to">{confirmDialog.newStatus}</span>
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <button className="confirm-btn-cancel" onClick={() => confirmDialog.onCancel()}>
                Cancel
              </button>
              <button className="confirm-btn-ok" onClick={() => confirmDialog.onConfirm()}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="orders-header">
        <h1>Order Management</h1>
        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total ?? pagination.total ?? filteredOrders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {stats.delivered ?? filteredOrders.filter(o => o.status === 'picked_up_delivered').length}
            </span>
            <span className="stat-label">Delivered</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {stats.inProgress ?? filteredOrders.filter(o => ['layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(o.status)).length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {stats.pending ?? filteredOrders.filter(o => o.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="compact-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
        
        <div className="filter-toggle-container">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="filter-icon" />
            Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {showFilters && (
            <div className="filter-dropdown">
            <div className="filter-group">
              <label>Branch</label>
              <select
                value={filters.pickupBranch}
                onChange={(e) => handleFilterChange('pickupBranch', e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusDisplayName(status)}
                  </option>
                ))}
              </select>
            </div>
            
            <button className="clear-filters-btn" onClick={clearFilters}>
              <FaTimes />
              Clear All
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Yohann's Orders Table - Redesigned */}
      <div className="yh-orders-table-wrapper">
        <div className="yh-orders-table-header">
          <div 
            className="yh-orders-header-cell yh-orders-sortable" 
            onClick={() => handleSort('orderNumber')}
          >
            <span className="yh-orders-header-title">Order #</span>
            <FaSort className={`yh-orders-sort-icon ${sortConfig.key === 'orderNumber' ? 'yh-orders-active' : ''}`} />
          </div>
          <div 
            className="yh-orders-header-cell yh-orders-sortable" 
            onClick={() => handleSort('customerName')}
          >
            <span className="yh-orders-header-title">Customer</span>
            <FaSort className={`yh-orders-sort-icon ${sortConfig.key === 'customerName' ? 'yh-orders-active' : ''}`} />
          </div>
          <div className="yh-orders-header-cell">
            <span className="yh-orders-header-title">Items</span>
          </div>
          <div 
            className="yh-orders-header-cell yh-orders-sortable" 
            onClick={() => handleSort('totalAmount')}
          >
            <span className="yh-orders-header-title">Total</span>
            <FaSort className={`yh-orders-sort-icon ${sortConfig.key === 'totalAmount' ? 'yh-orders-active' : ''}`} />
          </div>
          <div 
            className="yh-orders-header-cell yh-orders-sortable" 
            onClick={() => handleSort('orderDate')}
          >
            <span className="yh-orders-header-title">Date</span>
            <FaSort className={`yh-orders-sort-icon ${sortConfig.key === 'orderDate' ? 'yh-orders-active' : ''}`} />
          </div>
          <div className="yh-orders-header-cell">
            <span className="yh-orders-header-title">Status</span>
          </div>
          <div className="yh-orders-header-cell">
            <span className="yh-orders-header-title">Actions</span>
          </div>
        </div>
        
        <div className="yh-orders-table-body">
          {(filteredOrders || []).map((order, index) => {
            const dateInfo = formatDate(order.orderDate);
            return (
              <div key={order.id} className={`yh-orders-table-row ${index % 2 === 0 ? 'yh-orders-row-even' : 'yh-orders-row-odd'}`}>
                <div className="yh-orders-table-cell yh-orders-cell-order-number">
                  <span 
                    className="yh-orders-number-text"
                    title={order.orderNumber}
                  >
                    {truncateOrderNumber(order.orderNumber)}
                  </span>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-customer">
                  <div className="yh-orders-customer-name">{order.customerName}</div>
                  <div className="yh-orders-customer-email">{order.customerEmail || 'N/A'}</div>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-items">
                  <div className="yh-orders-items-count">{order.totalItems} item{order.totalItems !== 1 ? 's' : ''}</div>
                  <div className="yh-orders-delivery-method">
                    {order.shippingMethod === 'pickup' ? 'Pickup' : 'COD'}
                    {order.pickupLocation && ` - ${order.pickupLocation.substring(0, 15)}...`}
                  </div>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-total">
                  <span className="yh-orders-total-price">₱{(order.totalAmount || 0).toFixed(2)}</span>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-date">
                  <div className="yh-orders-date-wrapper">
                    <div className="yh-orders-date-text">{dateInfo.date}</div>
                    <div className="yh-orders-time-text">{dateInfo.time}</div>
                  </div>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-status">
                  <div 
                    className={`yh-orders-status-badge yh-orders-status-${getStatusColor(order.status)}`}
                    title={getStatusDescription(order.status)}
                  >
                    {getStatusDisplayName(order.status)}
                  </div>
                </div>
                
                <div className="yh-orders-table-cell yh-orders-cell-actions">
                  <button 
                    className="yh-orders-view-btn"
                    onClick={() => toggleOrderExpansion(order.id)}
                    title="View Details"
                  >
                    <FaEye className="yh-orders-btn-icon" />
                    <span className="yh-orders-btn-text">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls - shown only when filters are applied */}
      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-btn prev-btn"
              onClick={() => setPagination(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
              disabled={pagination.page === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${pagination.page === pageNum ? 'active' : ''}`}
                    onClick={() => setPagination(prev => ({...prev, page: pageNum}))}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className="pagination-btn next-btn"
              onClick={() => setPagination(prev => ({...prev, page: Math.min(pagination.totalPages, prev.page + 1)}))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      )}
      
      {/* Show all orders count when no filters are applied */}
      <div className="orders-count-info">
        Showing {filteredOrders.length} orders on this page (limit {pagination.limit}) out of {stats.total ?? pagination.total ?? filteredOrders.length} total
      </div>

      {/* Expanded Order Details Modal */}
      {expandedOrder && (
        <div className="order-details-modal" onClick={() => setExpandedOrder(null)}>
          {(() => {
            const order = orders.find(o => o.id === expandedOrder);
            if (!order) return null;
            const userRole = user?.user_metadata?.role || 'customer';
            const designFiles = Array.isArray(order.designFiles)
              ? order.designFiles
              : Array.isArray(order.design_files)
                ? order.design_files
                : [];
            const canViewDesignFiles = ['admin', 'owner'].includes(userRole);
            
            return (
              <div className="order-details-content" onClick={(e) => e.stopPropagation()}>
                <div className="order-details-header">
                  <h3>Order Details - {order.orderNumber}</h3>
                  <button 
                    className="close-details-btn"
                    onClick={() => setExpandedOrder(null)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                
                <div className="order-details-body">
                  <div className="yh-customer-section">
                    <h4 className="yh-customer-heading">
                      <FaUser className="yh-customer-heading-icon" />
                      {order.orderItems?.[0]?.product_type === 'custom_design' ? 'Custom Design Client Information' : 'Customer Information'}
                    </h4>
                    <div className="yh-customer-info-grid">
                      <div className="yh-customer-info-row">
                        <span className="yh-customer-label">
                          <FaUser className="yh-customer-icon" />
                          Name:
                        </span>
                        <span className="yh-customer-value">
                          {order.orderItems?.[0]?.product_type === 'custom_design' 
                            ? order.orderItems[0]?.client_name || order.customerName
                            : order.customerName
                          }
                        </span>
                      </div>
                      <div className="yh-customer-info-row">
                        <span className="yh-customer-label">
                          <FaEnvelope className="yh-customer-icon" />
                          Email:
                        </span>
                        <span className="yh-customer-value yh-customer-value-email">
                          {order.orderItems?.[0]?.product_type === 'custom_design' 
                            ? order.orderItems[0]?.client_email || order.customerEmail
                            : order.customerEmail
                          }
                        </span>
                      </div>
                      <div className="yh-customer-info-row">
                        <span className="yh-customer-label">
                          <FaPhone className="yh-customer-icon" />
                          Phone:
                        </span>
                        <span className="yh-customer-value yh-customer-value-phone">
                          {order.orderItems?.[0]?.product_type === 'custom_design' 
                            ? order.orderItems[0]?.client_phone || order.deliveryAddress?.phone || 'N/A'
                            : order.deliveryAddress?.phone || 'N/A'
                          }
                        </span>
                      </div>
                      <div className="yh-customer-info-row">
                        <span className="yh-customer-label">
                          <FaMapMarkerAlt className="yh-customer-icon" />
                          Address:
                        </span>
                        <span className="yh-customer-value yh-customer-value-address">
                          {order.deliveryAddress?.address || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="details-section">
                    <h4><FaBox className="section-icon" />Order Items</h4>
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="order-item">
                        {item.product_type === 'custom_design' ? (
                          <div className="custom-design-item">
                            <div className="custom-design-header">
                              <div className="custom-design-icon">🎨</div>
                              <div className="custom-design-info">
                                <div className="custom-design-title">Custom Design Order</div>
                                <div className="custom-design-subtitle">Team: {item.team_name}</div>
                              </div>
                            </div>
                            
                            {/* Team Information */}
                            <div className="custom-design-team-section">
                              <h5 className="custom-design-section-title">
                                <FaUsers className="section-icon" />
                                Team Information
                              </h5>
                              <div className="custom-design-team-name">
                                <strong>Team Name:</strong> {item.team_name}
                              </div>
                              <div className="custom-design-members">
                                <strong>Team Members ({item.team_members?.length || 0}):</strong>
                                <div className="custom-design-members-list">
                                  {item.team_members?.map((member, memberIndex) => (
                                    <div key={memberIndex} className="custom-design-member">
                                      <span className="member-number">#{member.number}</span>
                                      <span className="member-surname">{member.surname}</span>
                                      <span className="member-size">Size: {member.size}</span>
                                      <span className="member-sizing-type">({member.sizingType})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Design Images */}
                            {item.design_images && item.design_images.length > 0 && (
                              <div className="custom-design-images-section">
                                <h5 className="custom-design-section-title">
                                  <FaCamera className="section-icon" />
                                  Design Images ({item.design_images.length})
                                </h5>
                                <div className="custom-design-images-grid">
                                  {item.design_images.map((image, imageIndex) => (
                                    <div key={imageIndex} className="custom-design-image-item">
                                      <img 
                                        src={image.url} 
                                        alt={`Design ${imageIndex + 1}`}
                                        className="custom-design-image"
                                        onClick={() => window.open(image.url, '_blank')}
                                      />
                                      <div className="custom-design-image-name">
                                        {image.originalname || `Design ${imageIndex + 1}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Design Upload Section - Artist Only */}
                            {/* Show upload button only if: customer approved OR 1 hour passed since review request */}
                            {user?.user_metadata?.role === 'artist' && 
                             (item.status === 'confirmed' || item.status === 'layout') && 
                             orderApprovalStatus[item.id] && (
                              <div className="design-upload-section">
                                <h5 className="custom-design-section-title">
                                  <FaUpload className="section-icon" />
                                  Upload Design Files
                                </h5>
                                <div className="design-upload-area">
                                  <input
                                    type="file"
                                    id={`design-upload-${item.id}`}
                                    multiple
                                    accept="image/*,.pdf,.ai,.psd"
                                    onChange={(e) => handleDesignUpload(item.id, e.target.files)}
                                    style={{ display: 'none' }}
                                    disabled={uploadingDesigns[item.id]}
                                  />
                                  <label 
                                    htmlFor={`design-upload-${item.id}`}
                                    className={`design-upload-label ${uploadingDesigns[item.id] ? 'uploading' : ''}`}
                                  >
                                    {uploadingDesigns[item.id] ? (
                                      <>
                                        <FaClock className="upload-icon" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <FaUpload className="upload-icon" />
                                        Click to upload design files
                                      </>
                                    )}
                                  </label>
                                  <p className="design-upload-hint">
                                    Upload design files to automatically move order to sizing status
                                    <br />
                                    <small style={{ fontSize: '0.85em', opacity: 0.8 }}>
                                      (Button appears after customer approval or 1 hour after review request)
                                    </small>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Pickup Information */}
                            {item.pickup_branch_id && (
                              <div className="custom-design-pickup-section">
                                <h5 className="custom-design-section-title">
                                  <FaMapMarkerAlt className="section-icon" />
                                  Pickup Information
                                </h5>
                                <div className="custom-design-pickup-details">
                                  <strong>Pickup Branch:</strong> {item.pickup_branch_id}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="regular-order-item">
                            <div className="item-header">
                              <img src={item.image} alt={item.name} className="item-image" />
                              <div className="item-info">
                                <div className="item-name">{item.name}</div>
                                <div className="item-price">₱{(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} × {item.quantity}</div>
                              </div>
                            </div>
                            
                            {item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0 && (
                              <div className="team-details">
                                <div className="team-name">Team: {item.teamName || item.team_name || item.teamMembers?.[0]?.teamName || item.teamMembers?.[0]?.team_name || 'N/A'}</div>
                                <div className="team-members-table">
                                  {(() => {
                                    const fallbackVisibility = {
                                      jersey: item.teamMembers.some(member => Boolean(member?.jerseySize || member?.size)),
                                      shorts: item.teamMembers.some(member => Boolean(member?.shortsSize))
                                    };
                                    const { showJersey: showTeamJerseySize, showShorts: showTeamShortsSize } = getApparelSizeVisibility(item, fallbackVisibility);
                                    return (
                                     <table className="jersey-details-table">
                                       <thead>
                                         <tr>
                                           <th>Surname</th>
                                           <th>Jersey #</th>
                                           {showTeamJerseySize && <th>Jersey Size</th>}
                                           {showTeamShortsSize && <th>Shorts Size</th>}
                                           <th>Type</th>
                                         </tr>
                                       </thead>
                                       <tbody>
                                         {item.teamMembers.map((member, memberIndex) => (
                                           <tr key={memberIndex}>
                                             <td>{member.surname || 'N/A'}</td>
                                             <td>{member.number || 'N/A'}</td>
                                             {showTeamJerseySize && <td>{member.jerseySize || member.size || 'N/A'}</td>}
                                             {showTeamShortsSize && <td>{member.shortsSize || 'N/A'}</td>}
                                             <td>{member.sizingType || item.sizeType || 'Adult'}</td>
                                           </tr>
                                         ))}
                                       </tbody>
                                     </table>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            {!item.isTeamOrder && item.singleOrderDetails && (
                              <div className="single-details">
                                <div className="single-details-table">
                                  {(() => {
                                    const fallbackVisibility = {
                                      jersey: Boolean(item.singleOrderDetails?.jerseySize || item.singleOrderDetails?.size),
                                      shorts: Boolean(item.singleOrderDetails?.shortsSize)
                                    };
                                    const { showJersey: showSingleJerseySize, showShorts: showSingleShortsSize } = getApparelSizeVisibility(item, fallbackVisibility);
                                    return (
                                      <table className="jersey-details-table">
                                        <thead>
                                          <tr>
                                            <th>Team</th>
                                            <th>Surname</th>
                                            <th>Jersey #</th>
                                            {showSingleJerseySize && <th>Jersey Size</th>}
                                            {showSingleShortsSize && <th>Shorts Size</th>}
                                            <th>Type</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td>{item.singleOrderDetails.teamName || 'N/A'}</td>
                                            <td>{item.singleOrderDetails.surname || 'N/A'}</td>
                                            <td>{item.singleOrderDetails.number || 'N/A'}</td>
                                            {showSingleJerseySize && (
                                              <td>{item.singleOrderDetails.jerseySize || item.singleOrderDetails.size || 'N/A'}</td>
                                            )}
                                            {showSingleShortsSize && (
                                              <td>{item.singleOrderDetails.shortsSize || 'N/A'}</td>
                                            )}
                                            <td>{item.singleOrderDetails.sizingType || item.sizeType || 'Adult'}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Redesigned Order Summary */}
                  <div className="details-section yh-summary-section">
                    <h4 className="yh-summary-heading">
                      <FaDollarSign className="yh-summary-heading-icon" />
                      Order Summary
                    </h4>
                    <div className="yh-summary-container">
                      <div className="yh-summary-item yh-summary-subtotal">
                        <div className="yh-summary-label">
                          <FaDollarSign className="yh-summary-icon" />
                          <span className="yh-summary-label-text">Subtotal</span>
                        </div>
                        <span className="yh-summary-value">₱{(order.subtotalAmount || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="yh-summary-item yh-summary-shipping">
                        <div className="yh-summary-label">
                          <FaShippingFast className="yh-summary-icon" />
                          <span className="yh-summary-label-text">Shipping</span>
                        </div>
                        <span className="yh-summary-value">₱{(order.shippingCost || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="yh-summary-divider"></div>
                      
                      <div className="yh-summary-item yh-summary-total">
                        <div className="yh-summary-label">
                          <FaDollarSign className="yh-summary-icon yh-summary-total-icon" />
                          <span className="yh-summary-label-text yh-summary-total-label">Total Amount</span>
                        </div>
                        <span className="yh-summary-value yh-summary-total-value">₱{(order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {order.orderNotes && (
                    <div className="details-section">
                      <h4><FaFileAlt className="section-icon" />Order Notes</h4>
                      <div className="order-notes">{order.orderNotes}</div>
                    </div>
                  )}
                  
                  {/* Status Update Section */}
                  <div className="details-section">
                    <h4><FaCog className="section-icon" />Order Status Management</h4>
                    <div className="status-update-section">
                      <div className="current-status-display">
                        <div className="status-info-card">
                          <span className="status-label">Current Status:</span>
                          <span className={`status-value status-${order.status}`}>
                            {getStatusDisplayName(order.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="status-description">
                        Update the order status as it progresses through fulfillment.
                      </p>

                      {canViewDesignFiles && (
                        <div className="design-files-section inside-status">
                          <h5 className="design-files-heading">
                            <FaFileAlt className="design-files-heading-icon" />
                            Submitted Design Files
                            {designFiles.length > 0 && (
                              <span className="design-files-count">({designFiles.length})</span>
                            )}
                          </h5>

                          {designFiles.length > 0 ? (
                            <div className="design-files-grid">
                              {designFiles.map((file, index) => (
                                <a
                                  key={file.publicId || `${index}-${file.url}`}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="design-file-card"
                                  title={file.filename || `Design File ${index + 1}`}
                                >
                                  <div className="design-file-icon-wrapper">
                                    <span className="design-file-icon">
                                      {designUploadService.getFileTypeIcon(file.filename || '')}
                                    </span>
                                  </div>
                                  <div className="design-file-info">
                                    <div className="design-file-name">
                                      {file.filename || `Design File ${index + 1}`}
                                    </div>
                                    {file.uploadedAt && (
                                      <div className="design-file-timestamp">
                                        Uploaded {new Date(file.uploadedAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="design-file-open">View</div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="design-files-empty">
                              No design files submitted yet.
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="status-buttons">
                        {/* Pending Orders */}
                        {order.status === 'pending' && (
                          <>
                            <button 
                              className="status-update-btn confirm-btn"
                              onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            >
                              <FaCheck className="status-icon" /> Confirm Order
                            </button>
                            <button 
                              className="status-update-btn cancel-btn"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this order?')) {
                                  handleStatusUpdate(order.id, 'cancelled');
                                }
                              }}
                            >
                              <FaTimes className="status-icon" /> Cancel Order
                            </button>
                          </>
                        )}
                        
                        {/* Confirmed - Start Layout */}
                        {order.status === 'confirmed' && (
                          <button 
                            className="status-update-btn process-btn"
                            onClick={() => handleStatusUpdate(order.id, 'layout')}
                          >
                            <FaPalette className="status-icon" /> Start Layout
                          </button>
                        )}
                        
                        {/* Layout - Move to Sizing */}
                        {order.status === 'layout' && (
                          <button 
                            className={`status-update-btn process-btn ${user?.user_metadata?.role !== 'artist' ? 'disabled-btn' : ''}`}
                            onClick={() => handleStatusUpdate(order.id, 'sizing')}
                            disabled={user?.user_metadata?.role !== 'artist'}
                            title={user?.user_metadata?.role !== 'artist' ? 'Only artists can move orders to sizing status' : 'Move to Sizing'}
                          >
                            <FaRuler className="status-icon" /> 
                            {user?.user_metadata?.role !== 'artist' ? 'Artist Only - Move to Sizing' : 'Move to Sizing'}
                          </button>
                        )}
                        
                        {/* Sizing - Move to Printing */}
                        {order.status === 'sizing' && (
                          <button 
                            className="status-update-btn process-btn"
                            onClick={() => handleStatusUpdate(order.id, 'printing')}
                          >
                            <FaPrint className="status-icon" /> Move to Printing
                          </button>
                        )}
                        
                        {/* Printing - Move to Press */}
                        {order.status === 'printing' && (
                          <button 
                            className="status-update-btn process-btn"
                            onClick={() => handleStatusUpdate(order.id, 'press')}
                          >
                            <FaCog className="status-icon" /> Move to Press
                          </button>
                        )}
                        
                        {/* Press - Move to Prod */}
                        {order.status === 'press' && (
                          <button 
                            className="status-update-btn process-btn"
                            onClick={() => handleStatusUpdate(order.id, 'prod')}
                          >
                            <FaIndustry className="status-icon" /> Move to Prod
                          </button>
                        )}
                        
                        {/* Prod - Move to Packing */}
                        {order.status === 'prod' && (
                          <button 
                            className="status-update-btn process-btn"
                            onClick={() => handleStatusUpdate(order.id, 'packing_completing')}
                          >
                            <FaBox className="status-icon" /> Move to Packing/Completing
                          </button>
                        )}
                        
                        {/* Packing - Mark as Picked Up/Delivered */}
                        {order.status === 'packing_completing' && (
                          <button 
                            className="status-update-btn complete-btn"
                            onClick={() => handleStatusUpdate(order.id, 'picked_up_delivered')}
                          >
                            <FaCheck className="status-icon" /> Mark as Picked Up/Delivered
                          </button>
                        )}
                        
                        {/* Picked Up/Delivered - Final Status */}
                        {order.status === 'picked_up_delivered' && (
                          <div className="status-complete-message">
                            <span className="complete-icon"><FaCheck /></span>
                            <p>This order has been completed and delivered.</p>
                          </div>
                        )}
                        
                        {/* Cancelled Orders */}
                        {order.status === 'cancelled' && (
                          <div className="status-cancelled-message">
                            <span className="cancelled-icon"><FaTimes /></span>
                            <p>This order has been cancelled.</p>
                            <button 
                              className="status-update-btn reactivate-btn"
                              onClick={() => {
                                if (window.confirm('Reactivate this cancelled order?')) {
                                  handleStatusUpdate(order.id, 'pending');
                                }
                              }}
                            >
                              <FaRedo className="status-icon" /> Reactivate Order
                            </button>
                          </div>
                        )}
                        
                        {/* Go Back Option (for any production stage) */}
                        {['layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(order.status) && (
                          <button 
                            className="status-update-btn reopen-btn"
                            onClick={() => {
                              const stages = ['confirmed', 'layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'];
                              const currentIndex = stages.indexOf(order.status);
                              if (currentIndex > 0) {
                                const prevStage = stages[currentIndex - 1];
                                setConfirmDialog({
                                  show: true,
                                  title: 'Go Back One Stage',
                                  message: `Are you sure you want to go back to ${getStatusDisplayName(prevStage)}?`,
                                  currentStatus: getStatusDisplayName(order.status),
                                  newStatus: getStatusDisplayName(prevStage),
                                  onConfirm: () => {
                                    handleStatusUpdate(order.id, prevStage);
                                    setConfirmDialog(null);
                                  },
                                  onCancel: () => setConfirmDialog(null)
                                });
                              }
                            }}
                          >
                            <FaArrowLeft className="status-icon" /> Go Back One Stage
                          </button>
                        )}
                      </div>
                      
                      {/* Order Status Flow Guide */}
                      <div className="status-flow-guide">
                        <h5><FaArrowRight className="flow-icon" /> Order Status Flow:</h5>
                        <div className="flow-steps">
                          {['pending', 'confirmed', 'layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing', 'picked_up_delivered'].map((stage, index, arr) => {
                            const stageIndex = arr.indexOf(order.status);
                            const currentStageIndex = arr.indexOf(stage);
                            const isActive = order.status === stage;
                            const isCompleted = stageIndex > currentStageIndex && stageIndex >= 0;
                            
                            return (
                              <React.Fragment key={stage}>
                                <span className={`flow-step ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                                  {getStatusDisplayName(stage)}
                                </span>
                                {index < arr.length - 1 && <span className="flow-arrow"><FaArrowRight /></span>}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating Walk-in Order Button */}
      <button 
        className="floating-walkin-btn"
        onClick={() => navigate('/admin/walk-in-orders')}
        title="Walk-in Order"
      >
        <FaShoppingCart />
        <span className="btn-text">Walk-in Order</span>
      </button>
    </div>
  );
};

export default Orders;