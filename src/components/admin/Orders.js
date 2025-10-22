import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaUpload,
  FaDownload,
  FaTrash,
  FaFileAlt,
  FaPalette,
  FaRuler,
  FaPrint,
  FaCog,
  FaIndustry,
  FaShippingFast,
  FaBan,
  FaRedo,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import './Orders.css';
import './FloatingButton.css';
import orderService from '../../services/orderService';
import designUploadService from '../../services/designUploadService';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [uploadingDesign, setUploadingDesign] = useState(null);
  const [designFiles, setDesignFiles] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  
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
    let filtered = [...orders];

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
      'picked_up_delivered': 'DELIVERED',
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
      case 'picked_up_delivered': return 'Order completed';
      case 'cancelled': return 'Order cancelled';
      default: return status;
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

  const handleDesignFileUpload = async (orderId, files) => {
    try {
      setUploadingDesign(orderId);
      
      const result = await designUploadService.uploadDesignFiles(orderId, files);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
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
                designFiles: result.designFiles 
              }
            : order
        )
      );
      
      alert(`Layout files uploaded successfully! You can now proceed to sizing.`);
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      
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
      
      alert(`Order status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} successfully!`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Failed to update order status: ${error.message}`);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDownloadAll = async (files) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const response = await fetch(file.url);
          const blob = await response.blob();
          zip.file(file.filename, blob);
        } catch (error) {
          console.error(`Error downloading file ${file.filename}:`, error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-files-${new Date().toISOString().split('T')[0]}.zip`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try downloading files individually.');
    }
  };

  const handleRemoveDesignFile = async (orderId, file) => {
    if (!window.confirm(`Are you sure you want to remove "${file.filename}"?`)) {
      return;
    }

    try {
      await designUploadService.deleteDesignFile(orderId, file.publicId);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? {
                ...order,
                designFiles: (order.designFiles || []).filter(f => f.publicId !== file.publicId)
              }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? {
                ...order,
                designFiles: (order.designFiles || []).filter(f => f.publicId !== file.publicId)
              }
            : order
        )
      );

      alert('File removed successfully!');
    } catch (error) {
      console.error('Error removing design file:', error);
      alert(`Failed to remove file: ${error.message}`);
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
      {/* Header */}
      <div className="orders-header">
        <h1>Order Management</h1>
        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-number">{filteredOrders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => o.status === 'picked_up_delivered').length}
            </span>
            <span className="stat-label">Delivered</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => ['layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(o.status)).length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {filteredOrders.filter(o => o.status === 'pending').length}
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
        </div>
        
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
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
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Compact Orders Table */}
      <div className="compact-orders-table">
        <div className="table-header">
          <div 
            className="header-cell sortable" 
            onClick={() => handleSort('orderNumber')}
          >
            Order #
            <FaSort className={`sort-icon ${sortConfig.key === 'orderNumber' ? 'active' : ''}`} />
          </div>
          <div 
            className="header-cell sortable" 
            onClick={() => handleSort('customerName')}
          >
            Customer
            <FaSort className={`sort-icon ${sortConfig.key === 'customerName' ? 'active' : ''}`} />
          </div>
          <div className="header-cell">Items</div>
          <div 
            className="header-cell sortable" 
            onClick={() => handleSort('totalAmount')}
          >
            Total
            <FaSort className={`sort-icon ${sortConfig.key === 'totalAmount' ? 'active' : ''}`} />
          </div>
          <div 
            className="header-cell sortable" 
            onClick={() => handleSort('orderDate')}
          >
            Date
            <FaSort className={`sort-icon ${sortConfig.key === 'orderDate' ? 'active' : ''}`} />
          </div>
          <div className="header-cell">Status</div>
          <div className="header-cell">Actions</div>
        </div>
        
        <div className="table-body">
          {filteredOrders.map((order, index) => {
            const dateInfo = formatDate(order.orderDate);
            return (
              <div key={order.id} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                <div className="table-cell order-number">
                  <span 
                    className="order-number-text"
                    title={order.orderNumber}
                  >
                    {truncateOrderNumber(order.orderNumber)}
                  </span>
                </div>
                
                <div className="table-cell customer-info">
                  <div className="customer-name">{order.customerName}</div>
                  <div className="customer-secondary">N/A</div>
                </div>
                
                <div className="table-cell items-info">
                  <div className="items-count">{order.totalItems} item{order.totalItems !== 1 ? 's' : ''}</div>
                  <div className="delivery-method">
                    {order.shippingMethod === 'pickup' ? 'Pickup' : 'COD'}
                    {order.pickupLocation && ` - ${order.pickupLocation}`}
                  </div>
                </div>
                
                <div className="table-cell total-amount">
                  <span className="total-price">₱{(order.totalAmount || 0).toFixed(2)}</span>
                </div>
                
                <div className="table-cell order-date">
                  <div className="date-info">
                    <div className="date-text">{dateInfo.date}</div>
                    <div className="time-text">{dateInfo.time}</div>
                  </div>
                </div>
                
                <div className="table-cell status-cell">
                  <div 
                    className={`status-badge ${getStatusColor(order.status)}`}
                    title={getStatusDescription(order.status)}
                  >
                    {getStatusDisplayName(order.status)}
                  </div>
                </div>
                
                <div className="table-cell actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => toggleOrderExpansion(order.id)}
                    title="View Details"
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Order Details Modal */}
      {expandedOrder && (
        <div className="order-details-modal" onClick={() => setExpandedOrder(null)}>
          {(() => {
            const order = orders.find(o => o.id === expandedOrder);
            if (!order) return null;
            
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
                  <div className="details-section">
                    <h4><FaUser className="section-icon" />Customer Information</h4>
                    <div className="detail-row">
                      <span className="detail-label"><FaUser className="detail-icon" />Name:</span>
                      <span className="detail-value">{order.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><FaEnvelope className="detail-icon" />Email:</span>
                      <span className="detail-value">{order.customerEmail}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><FaPhone className="detail-icon" />Phone:</span>
                      <span className="detail-value">{order.deliveryAddress?.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><FaMapMarkerAlt className="detail-icon" />Address:</span>
                      <span className="detail-value">{order.deliveryAddress?.address || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="details-section">
                    <h4><FaBox className="section-icon" />Order Items</h4>
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-header">
                          <img src={item.image} alt={item.name} className="item-image" />
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">₱{(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} × {item.quantity}</div>
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
                    <h4><FaDollarSign className="section-icon" />Order Summary</h4>
                    <div className="summary-row">
                      <span><FaDollarSign className="summary-icon" />Subtotal:</span>
                      <span>₱{(order.subtotalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span><FaShippingFast className="summary-icon" />Shipping:</span>
                      <span>₱{(order.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                      <span><FaDollarSign className="summary-icon" />Total:</span>
                      <span>₱{(order.totalAmount || 0).toFixed(2)}</span>
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

                      {/* Design Upload Section (for Layout Stage Only) */}
                      {order.status === 'layout' && (
                        <div className="design-upload-section">
                          <h5 className="upload-section-title">
                            <FaPalette className="upload-icon" /> Upload Final Layout Files
                          </h5>
                          <p className="upload-description">
                            Upload the final layout/design files to proceed to sizing stage.
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
                              {uploadingDesign === order.id ? 'Uploading...' : 'Upload Layout Files'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* View Design Files (for all production stages) */}
                      {['confirmed', 'layout', 'sizing', 'printing', 'press', 'prod', 'packing_completing'].includes(order.status) && order.designFiles && order.designFiles.length > 0 && (
                        <div className="design-files-section">
                          <div className="files-header">
                            <h5><FaFileAlt className="files-icon" /> Design Files</h5>
                            <button 
                              className="download-all-btn"
                              onClick={() => handleDownloadAll(order.designFiles)}
                            >
                              <FaDownload className="download-icon" /> Download All
                            </button>
                          </div>
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
                                <div className="file-actions">
                                  <button 
                                    className="download-btn"
                                    onClick={() => handleDownloadFile(file)}
                                  >
                                    <FaDownload className="action-icon" /> Download
                                  </button>
                                  {order.status === 'layout' && (
                                    <button 
                                      className="remove-file-btn"
                                      onClick={() => handleRemoveDesignFile(order.id, file)}
                                      title="Remove this file"
                                    >
                                      <FaTrash className="action-icon" /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
                        
                        {/* Layout - Move to Sizing (requires design files) */}
                        {order.status === 'layout' && (
                          <>
                            <button 
                              className="status-update-btn process-btn"
                              onClick={() => {
                                if (!order.designFiles || order.designFiles.length === 0) {
                                  alert('⚠️ Please upload design files before moving to Sizing stage.');
                                  return;
                                }
                                handleStatusUpdate(order.id, 'sizing');
                              }}
                            >
                              <FaRuler className="status-icon" /> Move to Sizing
                            </button>
                            {(!order.designFiles || order.designFiles.length === 0) && (
                              <div className="status-note">
                                <small><FaUpload className="note-icon" /> Upload design files above before proceeding to sizing</small>
                              </div>
                            )}
                          </>
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
                                if (window.confirm(`Go back to ${getStatusDisplayName(prevStage)}?`)) {
                                  handleStatusUpdate(order.id, prevStage);
                                }
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