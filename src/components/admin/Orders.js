import React, { useState, useEffect } from 'react';
import './Orders.css';
import orderService from '../../services/orderService';
import designUploadService from '../../services/designUploadService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [uploadingDesign, setUploadingDesign] = useState(null);
  const [designFiles, setDesignFiles] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    dateSort: 'desc', // 'asc' or 'desc'
    priceSort: 'desc', // 'asc' or 'desc'
    quantitySort: 'desc', // 'asc' or 'desc'
    pickupBranch: '',
    status: ''
  });

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderService.getAllOrders();
        const formattedOrders = response.orders.map(order => orderService.formatOrderForDisplay(order));
        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    const applyFilters = async () => {
      try {
        // Check if any filters are applied
        const hasFilters = Object.values(filters).some(value => value !== '' && value !== 'desc');
        
        if (hasFilters) {
          // Use API with filters
          const response = await orderService.getAllOrders(filters);
          const formattedOrders = response.orders.map(order => orderService.formatOrderForDisplay(order));
          setFilteredOrders(formattedOrders);
        } else {
          // No filters, use all orders with sorting
          let sorted = [...orders];
          
          // Apply sorting
          sorted.sort((a, b) => {
            // Date sorting (primary)
            if (filters.dateSort === 'asc') {
              return new Date(a.orderDate) - new Date(b.orderDate);
            } else {
              return new Date(b.orderDate) - new Date(a.orderDate);
            }
          });
          
          setFilteredOrders(sorted);
        }
      } catch (error) {
        console.error('Error applying filters:', error);
        // Fallback to client-side filtering and sorting
        let filtered = [...orders];

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
          // Date sorting (primary)
          if (filters.dateSort === 'asc') {
            return new Date(a.orderDate) - new Date(b.orderDate);
          } else {
            return new Date(b.orderDate) - new Date(a.orderDate);
          }
        });

        setFilteredOrders(filtered);
      }
    };

    applyFilters();
  }, [orders, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateSort: 'desc',
      priceSort: 'desc',
      quantitySort: 'desc',
      pickupBranch: '',
      status: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'blue';
      case 'processing': return 'orange';
      case 'pending': return 'red';
      case 'cancelled': return 'gray';
      case 'delivered': return 'green';
      default: return 'gray';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending': return 'Awaiting design upload';
      case 'processing': return 'In production';
      case 'completed': return 'Ready for pickup';
      case 'delivered': return 'Order delivered to customer';
      case 'cancelled': return 'Order cancelled';
      default: return status;
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleDesignFileUpload = async (orderId, files) => {
    try {
      setUploadingDesign(orderId);
      
      // Upload files to Cloudinary via backend
      const result = await designUploadService.uploadDesignFiles(orderId, files);
      
      // Update local state with the new order data
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                status: 'processing',
                designFiles: result.designFiles 
              }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                status: 'processing',
                designFiles: result.designFiles 
              }
            : order
        )
      );
      
      alert(`Design files uploaded successfully! Order status updated to Processing.`);
    } catch (error) {
      console.error('Error uploading design files:', error);
      alert(`Failed to upload design files: ${error.message}`);
    } finally {
      setUploadingDesign(null);
    }
  };

  const handleFileChange = (orderId, event) => {
    const files = Array.from(event.target.files);
    setDesignFiles(prev => ({
      ...prev,
      [orderId]: files
    }));
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

  const statuses = ['pending', 'processing', 'completed', 'cancelled'];

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Orders Management</h1>
        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-number">{filteredOrders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => o.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => o.status === 'processing').length}
            </span>
            <span className="stat-label">Processing</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => o.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear All
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Sort by Date</label>
            <select
              value={filters.dateSort}
              onChange={(e) => handleFilterChange('dateSort', e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by Price</label>
            <select
              value={filters.priceSort}
              onChange={(e) => handleFilterChange('priceSort', e.target.value)}
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by Quantity</label>
            <select
              value={filters.quantitySort}
              onChange={(e) => handleFilterChange('quantitySort', e.target.value)}
            >
              <option value="desc">Most Items First</option>
              <option value="asc">Least Items First</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Pickup Branch</label>
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <div className="table-header">
          <div className="header-cell">Order #</div>
          <div className="header-cell">Customer</div>
          <div className="header-cell">Items</div>
          <div className="header-cell">Total</div>
          <div className="header-cell">Date</div>
          <div className="header-cell">Status</div>
          <div className="header-cell">Actions</div>
        </div>
        
        {filteredOrders.map((order) => (
          <div key={order.id} className="table-row">
            <div className="table-cell order-number">
              {order.orderNumber}
            </div>
            
            <div className="table-cell customer-info">
              <div className="customer-name">{order.customerName}</div>
              <div className="customer-email">{order.customerEmail}</div>
            </div>
            
            <div className="table-cell items-info">
              <div className="items-count">{order.totalItems} items</div>
              <div className="shipping-method">
                {order.shippingMethod === 'pickup' ? 'Pickup' : 'COD'}
                {order.pickupLocation && ` - ${order.pickupLocation}`}
              </div>
            </div>
            
            <div className="table-cell total-amount">
              ₱{(order.totalAmount || 0).toFixed(2)}
            </div>
            
            <div className="table-cell order-date">
              {formatDate(order.orderDate)}
            </div>
            
            <div className="table-cell status-cell">
              <span className={`status-badge ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <div className="status-description">
                {getStatusDescription(order.status)}
              </div>
            </div>
            
            <div className="table-cell actions">
              <button 
                className="view-details-btn"
                onClick={() => toggleOrderExpansion(order.id)}
              >
                {expandedOrder === order.id ? 'Hide' : 'View'} Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Order Details */}
      {expandedOrder && (
        <div className="order-details-modal">
          {(() => {
            const order = orders.find(o => o.id === expandedOrder);
            if (!order) return null;
            
            return (
              <div className="order-details-content">
                <div className="order-details-header">
                  <h3>Order Details - {order.orderNumber}</h3>
                  <button 
                    className="close-details-btn"
                    onClick={() => setExpandedOrder(null)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="order-details-body">
                  <div className="details-section">
                    <h4>Customer Information</h4>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{order.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{order.customerEmail}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{order.deliveryAddress.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{order.deliveryAddress.address}</span>
                    </div>
                  </div>
                  
                  <div className="details-section">
                    <h4>Order Items</h4>
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-header">
                          <img src={item.image} alt={item.name} className="item-image" />
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">₱{(item.price || 0).toFixed(2)} × {item.quantity}</div>
                          </div>
                        </div>
                        
                        {item.category === 'team' && item.teamMembers && (
                          <div className="team-details">
                            <div className="team-name">Team: {item.teamName}</div>
                            <div className="team-members">
                              {item.teamMembers.map((member, memberIndex) => (
                                <div key={memberIndex} className="member-detail">
                                  <span>{member.surname} #{member.number} ({member.size})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.category === 'single' && item.singleOrderDetails && (
                          <div className="single-details">
                            <div className="single-detail">
                              <span>Team: {item.singleOrderDetails.teamName}</span>
                            </div>
                            <div className="single-detail">
                              <span>{item.singleOrderDetails.surname} #{item.singleOrderDetails.number} ({item.singleOrderDetails.size})</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="details-section">
                    <h4>Order Summary</h4>
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>₱{(order.subtotalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>₱{(order.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₱{(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {order.orderNotes && (
                    <div className="details-section">
                      <h4>Order Notes</h4>
                      <div className="order-notes">{order.orderNotes}</div>
                    </div>
                  )}
                  
                  {order.status === 'pending' && (
                    <div className="details-section">
                      <h4>Design Upload</h4>
                      <div className="design-upload-section">
                        <p className="upload-description">
                          Upload printable layout/design files for the manufacturing branch to process this order.
                        </p>
                        <div className="file-upload-area">
                          <input
                            type="file"
                            id={`design-files-${order.id}`}
                            multiple
                            accept=".pdf,.ai,.psd,.png,.jpg,.jpeg"
                            onChange={(e) => handleFileChange(order.id, e)}
                            style={{ display: 'none' }}
                          />
                          <label 
                            htmlFor={`design-files-${order.id}`}
                            className="file-upload-label"
                          >
                            Choose Design Files
                          </label>
                          {designFiles[order.id] && designFiles[order.id].length > 0 && (
                            <div className="selected-files">
                              <p>Selected files:</p>
                              <ul>
                                {designFiles[order.id].map((file, index) => (
                                  <li key={index}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            className="upload-design-btn"
                            onClick={() => handleDesignFileUpload(order.id, designFiles[order.id])}
                            disabled={!designFiles[order.id] || designFiles[order.id].length === 0 || uploadingDesign === order.id}
                          >
                            {uploadingDesign === order.id ? 'Uploading...' : 'Upload & Start Processing'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'processing' && order.designFiles && order.designFiles.length > 0 && (
                    <div className="details-section">
                      <h4>Design Files</h4>
                      <div className="design-files-section">
                        <p className="files-description">
                          Design files uploaded for manufacturing. Click to download.
                        </p>
                        <div className="design-files-list">
                          {order.designFiles.map((file, index) => (
                            <div key={index} className="design-file-item">
                              <div className="file-info">
                                <span className="file-icon">
                                  {designUploadService.getFileTypeIcon(file.filename)}
                                </span>
                                <div className="file-details">
                                  <span className="file-name">{file.filename}</span>
                                  <span className="file-date">
                                    Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="download-btn"
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Orders;
