import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTruck, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag, FaUsers, FaBan, FaRoute, FaCheckCircle, FaStar, FaCamera, FaLocationArrow, FaComments, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import orderTrackingService from '../../services/orderTrackingService';
import SimpleOrderReview from './SimpleOrderReview';
import DesignChat from './DesignChat';
import { supabase } from '../../lib/supabase';
import './CustomerOrdersModal.css';
import Loading from '../Loading';
import ErrorState from '../ErrorState';

const CustomerOrdersModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [orderTracking, setOrderTracking] = useState({});
  const [orderReviews, setOrderReviews] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserOrders();
    }
  }, [isOpen, user]);

  const loadUserOrders = async () => {
    if (!user) {
      console.warn('📦 No user logged in, cannot load orders');
      return;
    }
    
    console.log('📦 Loading orders for user:', user.id, user.email);
    setLoading(true);
    setError(null);
    try {
      // getUserOrders now excludes cancelled orders by default
      const userOrders = await orderService.getUserOrders(user.id);
      console.log('📦 Fetched user orders:', userOrders.length, 'orders');
      console.log('📦 Orders:', userOrders);
      setOrders(userOrders);
      
      // Load tracking, reviews, and delivery proof for each order
      await loadOrderDetails(userOrders);
    } catch (err) {
      console.error('❌ Error loading user orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (userOrders) => {
    const trackingData = {};
    const reviewsData = {};
    const artistData = {};

    for (const order of userOrders) {
      try {
        // Load tracking data
        const tracking = await orderTrackingService.getOrderTracking(order.id);
        trackingData[order.id] = tracking;

        // Load review data
        const review = await orderTrackingService.getOrderReview(order.id);
        reviewsData[order.id] = review;

        // Load assigned artist data directly from Supabase
        try {
          const { data: artistTask, error: taskError } = await supabase
            .from('artist_tasks')
            .select(`
              artist_id,
              artist_profiles(
                id,
                artist_name,
                is_active
              )
            `)
            .eq('order_id', order.id)
            .maybeSingle();

          console.log(`🎨 Raw artist task query result for order ${order.id}:`, { artistTask, taskError });

          if (taskError) {
            console.error(`❌ Error getting artist task for order ${order.id}:`, taskError);
            artistData[order.id] = null;
          } else if (artistTask && artistTask.artist_profiles) {
            const profile = Array.isArray(artistTask.artist_profiles) 
              ? artistTask.artist_profiles[0] 
              : artistTask.artist_profiles;
            
            if (profile && profile.is_active) {
              artistData[order.id] = profile;
              console.log(`✅ Found active artist for order ${order.id}:`, profile.artist_name);
            } else {
              console.log(`⚠️ Artist profile not active or not found for order ${order.id}`);
              artistData[order.id] = null;
            }
          } else {
            console.log(`⚠️ No artist task found for order ${order.id}`);
            artistData[order.id] = null;
          }
        } catch (artistError) {
          console.log(`⚠️ Error loading artist for order ${order.id}:`, artistError);
          artistData[order.id] = null;
        }
      } catch (error) {
        console.error(`Error loading details for order ${order.id}:`, error);
      }
    }

    setOrderTracking(trackingData);
    setOrderReviews(reviewsData);
    
    // Update orders with artist information
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => {
        const artist = artistData[order.id];
        console.log(`🎨 Updating order ${order.id} with artist:`, artist);
        return {
          ...order,
          assignedArtist: artist || null
        };
      });
      console.log('🎨 Updated orders with artist data:', updatedOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber, hasArtist: !!o.assignedArtist, artistName: o.assignedArtist?.artist_name })));
      return updatedOrders;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'layout':
      case 'sizing':
      case 'printing':
      case 'press':
      case 'prod':
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': 
      case 'picked_up_delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusDescription = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Your order is being reviewed';
      case 'confirmed': return 'Order confirmed, preparing items';
      case 'layout': return 'Creating design layout';
      case 'sizing': return 'Determining item sizes';
      case 'printing': return 'Printing items';
      case 'press': return 'Heat press application in progress';
      case 'prod': return 'In final production stages';
      case 'packing_completing': return 'Packing and final checks';
      case 'picked_up_delivered': return 'Order has been picked up or delivered ✓';
      case 'processing': return 'Items are being prepared';
      case 'shipped': return 'Order is on the way';
      case 'delivered': return 'Order has been delivered';
      case 'cancelled': return 'Order has been cancelled';
      default: return 'Order status unknown';
    }
  };

  const handleCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelReason(true);
    setCancelReason('');
  };

  const handleSubmitCancellation = async () => {
    if (!cancelReason) {
      showError('Reason Required', 'Please select a cancellation reason');
      return;
    }

    if (!user) return;
    
    setCancellingOrder(orderToCancel);
    setShowCancelReason(false);
    
    try {
      await orderService.updateOrderStatus(orderToCancel, 'cancelled');
      
      // Remove the cancelled order from the list automatically
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderToCancel)
      );
      
      showSuccess('Order Cancelled', `Your order has been successfully cancelled. Reason: ${cancelReason}`);
      
      // Trigger event to refresh orders count in header
      window.dispatchEvent(new CustomEvent('orderCancelled'));
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError('Cancellation Failed', 'Failed to cancel order. Please try again or contact support.');
    } finally {
      setCancellingOrder(null);
      setOrderToCancel(null);
      setCancelReason('');
    }
  };

  const handleCloseCancelDialog = () => {
    setShowCancelReason(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const handleOpenChat = (order) => {
    setSelectedOrderForChat(order);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedOrderForChat(null);
  };

  const handleEditCustomOrder = (order) => {
    // TODO: Implement edit functionality
    console.log('Edit custom order:', order);
    showSuccess('Edit Order', 'Edit functionality will be implemented soon.');
  };

  const handleDeleteCustomOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to delete order #${order.orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Only allow deletion of pending orders
      if (order.status.toLowerCase() !== 'pending') {
        showError('Cannot Delete', 'Only pending orders can be deleted.');
        return;
      }

      await orderService.updateOrderStatus(order.id, 'cancelled');
      
      // Remove the order from the list
      setOrders(prevOrders => 
        prevOrders.filter(o => o.id !== order.id)
      );
      
      showSuccess('Order Deleted', `Order #${order.orderNumber} has been successfully deleted.`);
      
      // Trigger event to refresh orders count in header
      window.dispatchEvent(new CustomEvent('orderCancelled'));
      
    } catch (error) {
      console.error('Error deleting order:', error);
      showError('Delete Failed', 'Failed to delete order. Please try again or contact support.');
    }
  };

  const hasCustomDesign = (order) => {
    // Check both order_items and orderItems for compatibility
    const items = order.order_items || order.orderItems || [];
    const hasDesign = items.some(item => 
      item.design_images && item.design_images.length > 0
    );
    
    // Debug logging
    console.log(`🔍 Order ${order.orderNumber || order.order_number}:`, {
      hasOrderItems: !!order.order_items,
      hasOrderItemsAlt: !!order.orderItems,
      itemsLength: items.length,
      hasDesignImages: items.some(item => item.design_images && item.design_images.length > 0),
      hasDesign: hasDesign,
      orderKeys: Object.keys(order)
    });
    
    return hasDesign;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReviewSubmit = async () => {
    if (!selectedOrderForReview || !user) return;

    try {
      await orderTrackingService.addOrderReview(
        selectedOrderForReview.id,
        user.id,
        reviewData.rating,
        reviewData.comment
      );

      // Update local state
      setOrderReviews(prev => ({
        ...prev,
        [selectedOrderForReview.id]: {
          rating: reviewData.rating,
          comment: reviewData.comment,
          created_at: new Date().toISOString()
        }
      }));

      showSuccess('Review Submitted', 'Thank you for your review!');
      setShowReviewModal(false);
      setSelectedOrderForReview(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Review Failed', 'Failed to submit review. Please try again.');
    }
  };

  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewData({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const getTrackingStatus = (orderId) => {
    const tracking = orderTracking[orderId] || [];
    if (tracking.length === 0) return null;
    
    const latest = tracking[tracking.length - 1];
    return {
      status: latest.status,
      location: latest.location,
      description: latest.description,
      timestamp: latest.timestamp
    };
  };

  const getLocationIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return <FaMapMarkerAlt className="location-icon main-branch" />;
      case 'layout':
      case 'sizing':
      case 'printing':
      case 'press':
      case 'prod':
      case 'packing_completing':
      case 'processing':
        return <FaRoute className="location-icon processing" />;
      case 'shipped':
        return <FaTruck className="location-icon on-the-way" />;
      case 'picked_up_delivered':
      case 'delivered':
        return <FaCheckCircle className="location-icon delivered" />;
      default:
        return <FaMapMarkerAlt className="location-icon" />;
    }
  };

  const getLocationText = (status, location) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return 'At Main Branch - Yohanns';
      case 'layout':
        return 'Creating Design Layout';
      case 'sizing':
        return 'Determining Sizes';
      case 'printing':
        return 'Printing in Progress';
      case 'press':
        return 'Heat Press Application';
      case 'prod':
        return 'Final Production Stage';
      case 'packing_completing':
        return 'Packing & Final Checks';
      case 'processing':
        return 'Being Prepared';
      case 'shipped':
        return `On the way to ${location || 'your location'}`;
      case 'picked_up_delivered':
      case 'delivered':
        return 'Delivered Successfully';
      default:
        return 'Status Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="customer-orders-modal-overlay" onClick={onClose}>
      <div className="customer-orders-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="customer-orders-modal-header">
          <div className="customer-orders-header-content">
            <h2 className="customer-orders-modal-title">
              <FaShoppingBag /> My Orders
            </h2>
            {!loading && !error && orders.length > 0 && (
              <div className="customer-orders-count-badge">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </div>
            )}
          </div>
          <button className="customer-orders-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="customer-orders-modal-body">
          {loading && <Loading message="Loading your orders..." />}

          {error && (
            <ErrorState message={error} onRetry={loadUserOrders} retryLabel="Try Again" />
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="customer-orders-empty">
              <FaShoppingBag className="empty-icon" />
              <h3>No Orders Yet</h3>
              <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="customer-orders-list">
              {orders.map((order) => (
                <div key={order.id} className="customer-order-card">
                  <div className="customer-order-header" onClick={() => toggleOrderExpansion(order.id)}>
                    <div className="customer-order-info">
                      <div className="customer-order-number">
                        <strong>Order #{order.orderNumber}</strong>
                      </div>
                      <div className="customer-order-date">
                        <FaCalendarAlt /> {formatDate(order.orderDate)}
                      </div>
                      <div className="customer-order-total">
                        Total: ₱{parseFloat(order.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      {order.assignedArtist && (
                        <div className="customer-order-artist">
                          <FaUsers /> Assigned Artist: {order.assignedArtist.artist_name}
                        </div>
                      )}
                    </div>
                    <div className="customer-order-status">
                      <span className={`status-badge ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <div className="status-description">
                        {getStatusDescription(order.status)}
                      </div>
                    </div>
                    <div className="customer-order-toggle">
                      <FaEye className={expandedOrder === order.id ? 'expanded' : ''} />
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="customer-order-details">
                      <div className="customer-order-items">
                        <h4>Order Items ({order.totalItems} items)</h4>
                        <div className="items-list">
                          {order.orderItems && order.orderItems.map((item, index) => {
                            // Check if this is a custom design order
                            const isCustomDesign = item.product_type === 'custom_design';
                            
                            // Determine product category (balls, trophies, or apparel)
                            const isBall = item.category?.toLowerCase() === 'balls';
                            const isTrophy = item.category?.toLowerCase() === 'trophies';
                            const isApparel = !isBall && !isTrophy && !isCustomDesign; // jerseys, t-shirts, etc.

                            return (
                              <div key={index} className="order-item">
                                {isCustomDesign ? (
                                  <>
                                    <div className="item-info">
                                      <div className="item-name">Custom Design Order</div>
                                      <div className="item-details">
                                        <div className="team-order-details-expanded">
                                          <div className="team-order-header-info">
                                            <FaUsers className="team-order-icon" /> Custom Design Order
                                          </div>
                                          <div className="team-order-teamname-section">
                                            <div className="team-order-teamname-row">
                                              <span className="team-order-teamname-label">Team Name:</span>
                                              <span className="team-order-teamname-value">{item.team_name || 'N/A'}</span>
                                            </div>
                                          </div>
                                          {item.team_members && item.team_members.length > 0 && (
                                            <div className="team-order-members-list">
                                              {item.team_members.map((member, memberIndex) => (
                                                <div key={memberIndex} className="team-member-detail-item">
                                                  <div className="member-detail-row">
                                                    <span className="member-detail-label">Surname:</span>
                                                    <span className="member-detail-value">{member.surname || 'N/A'}</span>
                                                  </div>
                                                  <div className="member-detail-row">
                                                    <span className="member-detail-label">Jersey #:</span>
                                                    <span className="member-detail-value">{member.number || 'N/A'}</span>
                                                  </div>
                                                  <div className="member-detail-row">
                                                    <span className="member-detail-label">Jersey Size:</span>
                                                    <span className="member-detail-value">{member.jerseySize || member.size || 'N/A'}</span>
                                                  </div>
                                                  <div className="member-detail-row">
                                                    <span className="member-detail-label">Shorts Size:</span>
                                                    <span className="member-detail-value">{member.shortsSize || member.size || 'N/A'}</span>
                                                  </div>
                                                  {member.sizingType && (
                                                    <div className="member-detail-row">
                                                      <span className="member-detail-label">Type:</span>
                                                      <span className="member-detail-value">{member.sizingType}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {item.design_images && item.design_images.length > 0 && (
                                            <div className="com-custom-design-images-section">
                                              <div className="member-detail-row">
                                                <span className="member-detail-label">Design Images:</span>
                                                <span className="member-detail-value">{item.design_images.length} image(s)</span>
                                              </div>
                                              <div className="com-custom-design-images-preview">
                                                {item.design_images.map((image, imageIndex) => (
                                                  <img 
                                                    key={imageIndex}
                                                    src={image.url} 
                                                    alt={`Design ${imageIndex + 1}`}
                                                    className="com-custom-design-preview-image"
                                                    onClick={() => window.open(image.url, '_blank')}
                                                    title={image.originalname || `Design ${imageIndex + 1}`}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {item.pickup_branch_id && (
                                            <div className="member-detail-row">
                                              <span className="member-detail-label">Pickup Branch:</span>
                                              <span className="member-detail-value">{item.pickup_branch_id}</span>
                                            </div>
                                          )}
                                          <div className="team-order-quantity-info">
                                            <span className="quantity-text">Quantity: {item.quantity || 1}</span>
                                            <span className="quantity-price">₱{(item.price * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="item-info">
                                      <div className="item-name">{item.name}</div>
                                    
                                      {/* For Apparel (Jerseys, T-shirts, etc.) */}
                                      {isApparel && (
                                        <div className="item-details">
                                          {item.isTeamOrder ? (
                                            <div className="team-order-details-expanded">
                                              <div className="team-order-header-info">
                                                <FaUsers className="team-order-icon" /> Team Order
                                              </div>
                                              <div className="team-order-teamname-section">
                                                <div className="team-order-teamname-row">
                                                  <span className="team-order-teamname-label">Team Name:</span>
                                                  <span className="team-order-teamname-value">{item.teamName || item.team_name || item.teamMembers?.[0]?.teamName || item.teamMembers?.[0]?.team_name || 'N/A'}</span>
                                                </div>
                                              </div>
                                              <div className="team-order-members-list">
                                                {item.teamMembers && item.teamMembers.length > 0 ? (
                                                  item.teamMembers.map((member, memberIndex) => {
                                                    // Calculate member price - prioritize stored totalPrice, then calculate from components
                                                    let memberPrice = 0;
                                                    if (member.totalPrice && member.totalPrice > 0) {
                                                      memberPrice = member.totalPrice;
                                                    } else if (member.basePrice !== undefined || member.fabricSurcharge !== undefined || member.cutTypeSurcharge !== undefined || member.sizeSurcharge !== undefined) {
                                                      memberPrice = (member.basePrice || 0) + (member.fabricSurcharge || 0) + (member.cutTypeSurcharge || 0) + (member.sizeSurcharge || 0);
                                                    } else {
                                                      // Fallback: divide total by number of members
                                                      const perUnitTotal = Number(item.price || 0);
                                                      memberPrice = perUnitTotal / Math.max(1, item.teamMembers?.length || 1);
                                                    }
                                                    
                                                    return (
                                                      <div key={memberIndex} className="team-member-detail-item">
                                                        <div className="member-detail-row">
                                                          <span className="member-detail-label">Surname:</span>
                                                          <span className="member-detail-value">{member.surname || 'N/A'}</span>
                                                        </div>
                                                        <div className="member-detail-row">
                                                          <span className="member-detail-label">Jersey #:</span>
                                                          <span className="member-detail-value">{member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                                        </div>
                                                        <div className="member-detail-row">
                                                          <span className="member-detail-label">Jersey Size:</span>
                                                          <span className="member-detail-value">{member.jerseySize || member.size || 'N/A'}</span>
                                                        </div>
                                                        <div className="member-detail-row">
                                                          <span className="member-detail-label">Shorts Size:</span>
                                                          <span className="member-detail-value">{member.shortsSize || member.size || 'N/A'}</span>
                                                        </div>
                                                        {member.fabricOption || member.fabric_option ? (
                                                          <div className="member-detail-row">
                                                            <span className="member-detail-label">Fabric:</span>
                                                            <span className="member-detail-value">{member.fabricOption || member.fabric_option || 'N/A'}</span>
                                                          </div>
                                                        ) : null}
                                                        <div className="member-detail-row">
                                                          <span className="member-detail-label">Cut Type:</span>
                                                          <span className="member-detail-value">{member.cutType || member.cut_type || 'N/A'}</span>
                                                        </div>
                                                        {member.sizingType || item.sizeType ? (
                                                          <div className="member-detail-row">
                                                            <span className="member-detail-label">Type:</span>
                                                            <span className="member-detail-value">{member.sizingType || item.sizeType || 'Adult'}</span>
                                                          </div>
                                                        ) : null}
                                                        <div className="member-detail-row member-price-row">
                                                          <span className="member-detail-label">Price:</span>
                                                          <span className="member-detail-value member-price-value">₱{memberPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                ) : (
                                                  <div className="team-order-no-members">No team members found</div>
                                                )}
                                              </div>
                                              <div className="team-order-quantity-info">
                                                <span className="quantity-text">Quantity: {item.quantity}</span>
                                                <span className="quantity-price">₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="single-order-details-expanded">
                                              <div className="single-order-header-info">
                                                <span className="header-order-text">Single Order | Qty: {item.quantity}</span>
                                                <span className="header-price-text">₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                              </div>
                                              <div className="single-order-details-list">
                                                {item.singleOrderDetails?.teamName && (
                                                  <div className="order-detail-row">
                                                    <span className="order-detail-label">Team Name:</span>
                                                    <span className="order-detail-value">{item.singleOrderDetails.teamName}</span>
                                                  </div>
                                                )}
                                                {item.singleOrderDetails?.surname && (
                                                  <div className="order-detail-row">
                                                    <span className="order-detail-label">Surname:</span>
                                                    <span className="order-detail-value">{item.singleOrderDetails.surname}</span>
                                                  </div>
                                                )}
                                                {item.singleOrderDetails?.number && (
                                                  <div className="order-detail-row">
                                                    <span className="order-detail-label">Jersey #:</span>
                                                    <span className="order-detail-value">{item.singleOrderDetails.number || item.singleOrderDetails.jerseyNo || item.singleOrderDetails.jerseyNumber || 'N/A'}</span>
                                                  </div>
                                                )}
                                                <div className="order-detail-row">
                                                  <span className="order-detail-label">Jersey Size:</span>
                                                  <span className="order-detail-value">{item.singleOrderDetails?.jerseySize || item.singleOrderDetails?.size || item.size || 'N/A'}</span>
                                                </div>
                                                <div className="order-detail-row">
                                                  <span className="order-detail-label">Shorts Size:</span>
                                                  <span className="order-detail-value">{item.singleOrderDetails?.shortsSize || item.singleOrderDetails?.size || item.size || 'N/A'}</span>
                                                </div>
                                                {(item.fabricOption || item.singleOrderDetails?.fabricOption) && (
                                                  <div className="order-detail-row">
                                                    <span className="order-detail-label">Fabric:</span>
                                                    <span className="order-detail-value">{item.fabricOption || item.singleOrderDetails?.fabricOption || 'N/A'}</span>
                                                  </div>
                                                )}
                                                <div className="order-detail-row">
                                                  <span className="order-detail-label">Cut Type:</span>
                                                  <span className="order-detail-value">{item.cutType || item.singleOrderDetails?.cutType || 'N/A'}</span>
                                                </div>
                                                {(item.singleOrderDetails?.sizingType || item.sizeType) && (
                                                  <div className="order-detail-row">
                                                    <span className="order-detail-label">Type:</span>
                                                    <span className="order-detail-value">{item.singleOrderDetails?.sizingType || item.sizeType || 'Adult'}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* For Balls */}
                                      {isBall && (
                                        <div className="item-details ball-details">
                                          <div className="detail-badge ball-badge">🏀 Ball</div>
                                          <div className="ball-info-grid">
                                            {item.ballDetails?.sportType && (
                                              <div className="detail-item">
                                                <span className="detail-label">Sport:</span>
                                                <span className="detail-value">{item.ballDetails.sportType}</span>
                                              </div>
                                            )}
                                            {item.ballDetails?.brand && (
                                              <div className="detail-item">
                                                <span className="detail-label">Brand:</span>
                                                <span className="detail-value">{item.ballDetails.brand}</span>
                                              </div>
                                            )}
                                            {item.ballDetails?.ballSize && (
                                              <div className="detail-item">
                                                <span className="detail-label">Size:</span>
                                                <span className="detail-value">{item.ballDetails.ballSize}</span>
                                              </div>
                                            )}
                                            {item.ballDetails?.material && (
                                              <div className="detail-item">
                                                <span className="detail-label">Material:</span>
                                                <span className="detail-value">{item.ballDetails.material}</span>
                                              </div>
                                            )}
                                            <div className="detail-item">
                                              <span className="detail-label">Quantity:</span>
                                              <span className="detail-value">{item.quantity}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* For Trophies */}
                                      {isTrophy && (
                                        <div className="item-details trophy-details">
                                          <div className="detail-badge trophy-badge">🏆 Trophy</div>
                                          <div className="trophy-info-grid">
                                            {item.trophyDetails?.trophyType && (
                                              <div className="detail-item">
                                                <span className="detail-label">Type:</span>
                                                <span className="detail-value">{item.trophyDetails.trophyType}</span>
                                              </div>
                                            )}
                                            {item.trophyDetails?.size && (
                                              <div className="detail-item">
                                                <span className="detail-label">Size:</span>
                                                <span className="detail-value">{item.trophyDetails.size}</span>
                                              </div>
                                            )}
                                            {item.trophyDetails?.material && (
                                              <div className="detail-item">
                                                <span className="detail-label">Material:</span>
                                                <span className="detail-value">{item.trophyDetails.material}</span>
                                              </div>
                                            )}
                                            {item.trophyDetails?.engravingText && (
                                              <div className="detail-item detail-item-full">
                                                <span className="detail-label">Engraving:</span>
                                                <span className="detail-value engraving-text">{item.trophyDetails.engravingText}</span>
                                              </div>
                                            )}
                                            {item.trophyDetails?.occasion && (
                                              <div className="detail-item">
                                                <span className="detail-label">Occasion:</span>
                                                <span className="detail-value">{item.trophyDetails.occasion}</span>
                                              </div>
                                            )}
                                            <div className="detail-item">
                                              <span className="detail-label">Quantity:</span>
                                              <span className="detail-value">{item.quantity}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {!isApparel && (
                                      <div className="item-price">₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Assigned Artist Section */}
                      {order.assignedArtist && order.assignedArtist.artist_name && (
                        <div className="customer-order-artist-section">
                          <h4>Assigned Artist</h4>
                          <div className="artist-info-card">
                            <div className="artist-icon">
                              <FaUsers />
                            </div>
                            <div className="artist-details">
                              <div className="artist-name-label">Artist Name:</div>
                              <div className="artist-name-value">{order.assignedArtist.artist_name}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Order Tracking Section - Only for COD orders */}
                      {order.shippingMethod === 'cod' && (
                        <div className="customer-order-tracking">
                          <h4>Order Tracking</h4>
                          <div className="tracking-info">
                            {(() => {
                              const trackingStatus = getTrackingStatus(order.id);
                              return (
                                <div className="tracking-status">
                                  <div className="tracking-icon">
                                    {getLocationIcon(trackingStatus?.status)}
                                  </div>
                                  <div className="tracking-details">
                                    <div className="tracking-location">
                                      {getLocationText(trackingStatus?.status, trackingStatus?.location)}
                                    </div>
                                    {trackingStatus?.description && (
                                      <div className="tracking-description">
                                        {trackingStatus.description}
                                      </div>
                                    )}
                                    {trackingStatus?.timestamp && (
                                      <div className="tracking-time">
                                        {formatDate(trackingStatus.timestamp)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="customer-order-shipping">
                        <h4>Shipping Information</h4>
                        <div className="shipping-info">
                          <div className="shipping-method">
                            <FaTruck /> 
                            {order.shippingMethod === 'pickup' ? 'Pickup' : 'Cash on Delivery'}
                            {order.pickupLocation && (
                              <span className="pickup-location">
                                <FaMapMarkerAlt /> {order.pickupLocation}
                              </span>
                            )}
                          </div>
                          {order.deliveryAddress && order.shippingMethod === 'cod' && (
                            <div className="delivery-address">
                              <strong>Delivery Address:</strong>
                              <div>{order.deliveryAddress.fullName}</div>
                              <div>{order.deliveryAddress.phone}</div>
                              <div>
                                {order.deliveryAddress.streetAddress}, {order.deliveryAddress.barangay}
                              </div>
                              <div>
                                {order.deliveryAddress.city}, {order.deliveryAddress.province} {order.deliveryAddress.postalCode}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="customer-order-summary">
                        <h4>Order Summary</h4>
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>₱{parseFloat(order.subtotalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="summary-row">
                          <span>Shipping:</span>
                          <span>₱{parseFloat(order.shippingCost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>₱{parseFloat(order.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        {order.orderNotes && (
                          <div className="order-notes">
                            <strong>Notes:</strong> {order.orderNotes}
                          </div>
                        )}
                      </div>

                      {/* Simple Review Section - Only for delivered/picked up orders */}
                      {(order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'picked_up_delivered') && (
                        <div className="simple-review-section">
                          <SimpleOrderReview 
                            orderId={order.id}
                            orderNumber={order.orderNumber}
                            onReviewSubmit={(review) => {
                              setOrderReviews(prev => ({
                                ...prev,
                                [order.id]: review
                              }));
                            }}
                          />
                        </div>
                      )}

                       {/* Chat Button - Show for orders with custom designs */}
                       {hasCustomDesign(order) && (
                         <div className="customer-order-chat-actions">
                           <button
                             className="customer-chat-with-artist-btn"
                             onClick={() => handleOpenChat(order)}
                             title="Chat with artist about design"
                           >
                             <FaComments />
                             Chat with Artist
                           </button>
                         </div>
                       )}

                       {/* Edit and Delete Buttons - Show for custom design orders */}
                       {hasCustomDesign(order) && (
                         <div className="customer-order-custom-actions">
                           <button
                             className="customer-edit-order-btn"
                             onClick={() => handleEditCustomOrder(order)}
                             title="Edit Custom Order"
                           >
                             <FaEdit />
                             Edit
                           </button>
                           <button
                             className="customer-delete-order-btn"
                             onClick={() => handleDeleteCustomOrder(order)}
                             title="Delete Custom Order"
                             disabled={order.status.toLowerCase() !== 'pending'}
                           >
                             <FaTrash />
                             Delete
                           </button>
                         </div>
                       )}

                      {/* Cancel Button - Only show for pending orders */}
                      {order.status.toLowerCase() === 'pending' && (
                        <div className="order-actions">
                          <button
                            className="cancel-order-btn"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrder === order.id}
                          >
                            <FaBan />
                            {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedOrderForReview && (
        <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Leave a Review</h3>
              <button 
                className="review-modal-close" 
                onClick={() => setShowReviewModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="review-modal-body">
              <div className="review-order-info">
                <h4>Order #{selectedOrderForReview.orderNumber}</h4>
                <p>Total: ₱{parseFloat(selectedOrderForReview.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              
              <div className="review-rating-input">
                <label>Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <FaStar
                      key={rating}
                      className={rating <= reviewData.rating ? 'star-filled' : 'star-empty'}
                      onClick={() => setReviewData(prev => ({ ...prev, rating }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="review-comment-input">
                <label>Comment (optional):</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us about your experience..."
                  rows={4}
                />
              </div>
              
              <div className="review-modal-actions">
                <button 
                  className="cancel-review-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="submit-review-btn"
                  onClick={handleReviewSubmit}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Dialog */}
      {showCancelReason && (
        <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirmation-modal cancel-reason-modal">
            <h3>Cancel Order</h3>
            <p>Please select a reason for cancelling:</p>
            
            <div className="cancel-reasons">
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Ordered by mistake"
                  checked={cancelReason === 'Ordered by mistake'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Ordered by mistake</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Changed my mind"
                  checked={cancelReason === 'Changed my mind'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Changed my mind</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Wrong product or size selected"
                  checked={cancelReason === 'Wrong product or size selected'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Wrong product or size selected</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Payment or checkout issue"
                  checked={cancelReason === 'Payment or checkout issue'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Payment or checkout issue</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Personal reasons (other)"
                  checked={cancelReason === 'Personal reasons (other)'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Personal reasons (other)</span>
              </label>
            </div>
            
            <div className="confirmation-buttons">
              <button className="confirm-btn submit-cancel-btn" onClick={handleSubmitCancellation}>
                Submit
              </button>
              <button className="confirm-btn back-btn" onClick={handleCloseCancelDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Chat Modal */}
      {showChat && selectedOrderForChat && (
        <DesignChat
          orderId={selectedOrderForChat.id}
          isOpen={showChat}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default CustomerOrdersModal;