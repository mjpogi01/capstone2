import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTruck, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag, FaUsers, FaBan, FaRoute, FaCheckCircle, FaStar, FaCamera, FaLocationArrow, FaComments } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import orderTrackingService from '../../services/orderTrackingService';
import SimpleOrderReview from './SimpleOrderReview';
import DesignChat from './DesignChat';
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

        // Load assigned artist data
        try {
          const orderWithArtist = await orderService.getOrderWithArtist(order.id);
          artistData[order.id] = orderWithArtist.assignedArtist;
        } catch (artistError) {
          console.log(`No artist assigned to order ${order.id}`);
          artistData[order.id] = null;
        }
      } catch (error) {
        console.error(`Error loading details for order ${order.id}:`, error);
      }
    }

    setOrderTracking(trackingData);
    setOrderReviews(reviewsData);
    
    // Update orders with artist information
    setOrders(prevOrders => 
      prevOrders.map(order => ({
        ...order,
        assignedArtist: artistData[order.id] || null
      }))
    );
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
                                  <div className="custom-design-order-item">
                                    <div className="custom-design-header">
                                      <div className="custom-design-icon">🎨</div>
                                      <div className="custom-design-info">
                                        <div className="custom-design-title">Custom Design Order</div>
                                        <div className="custom-design-subtitle">Team: {item.team_name}</div>
                                      </div>
                                    </div>
                                    
                                    {/* Team Information */}
                                    <div className="custom-design-team-info">
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
                                      <div className="custom-design-images-info">
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

                                    {/* Pickup Information */}
                                    {item.pickup_branch_id && (
                                      <div className="custom-design-pickup-info">
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
                                  <>
                                    <div className="item-info">
                                      <div className="item-name">{item.name}</div>
                                    
                                      {/* For Apparel (Jerseys, T-shirts, etc.) */}
                                      {isApparel && (
                                        <div className="item-details">
                                          Size: {item.size} | Qty: {item.quantity}
                                          {item.isTeamOrder && (
                                            <div className="team-order-info">
                                              <FaUsers /> Team Order: {item.teamName}
                                            </div>
                                          )}
                                          {!item.isTeamOrder && item.singleOrderDetails && (
                                            <div className="single-order-info">
                                              {item.singleOrderDetails.teamName && (
                                                <div>Team: {item.singleOrderDetails.teamName}</div>
                                              )}
                                              {item.singleOrderDetails.surname && (
                                                <div>Surname: {item.singleOrderDetails.surname}</div>
                                              )}
                                              {item.singleOrderDetails.number && (
                                                <div>Number: {item.singleOrderDetails.number}</div>
                                              )}
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
                                    <div className="item-price">₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

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
                        {order.assignedArtist && (
                          <div className="summary-row artist-info">
                            <span><FaUsers /> Assigned Artist:</span>
                            <span className="artist-name">{order.assignedArtist.artist_name}</span>
                          </div>
                        )}
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
