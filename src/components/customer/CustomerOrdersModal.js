import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTruck, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag, FaUsers, FaBan, FaRoute, FaCheckCircle, FaStar, FaCamera, FaLocationArrow } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import orderTrackingService from '../../services/orderTrackingService';
import SimpleOrderReview from './SimpleOrderReview';
import './CustomerOrdersModal.css';

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

    for (const order of userOrders) {
      try {
        // Load tracking data
        const tracking = await orderTrackingService.getOrderTracking(order.id);
        trackingData[order.id] = tracking;

        // Load review data
        const review = await orderTrackingService.getOrderReview(order.id);
        reviewsData[order.id] = review;
      } catch (error) {
        console.error(`Error loading details for order ${order.id}:`, error);
      }
    }

    setOrderTracking(trackingData);
    setOrderReviews(reviewsData);
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
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
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

  const handleCancelOrder = async (orderId) => {
    if (!user) return;
    
    setCancellingOrder(orderId);
    try {
      await orderService.updateOrderStatus(orderId, 'cancelled');
      
      // Remove the cancelled order from the list automatically
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      
      showSuccess('Order Cancelled', 'Your order has been successfully cancelled and removed from your orders list.');
      
      // Trigger event to refresh orders count in header
      window.dispatchEvent(new CustomEvent('orderCancelled'));
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError('Cancellation Failed', 'Failed to cancel order. Please try again or contact support.');
    } finally {
      setCancellingOrder(null);
    }
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
          <h2 className="customer-orders-modal-title">
            <FaShoppingBag /> My Orders
          </h2>
          <button className="customer-orders-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="customer-orders-modal-body">
          {loading && (
            <div className="customer-orders-loading">
              <div className="loading-spinner-container">
                <div className="loading-spinner-circle"></div>
                <p className="loading-text">Loading your orders...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="customer-orders-error">
              <p>{error}</p>
              <button onClick={loadUserOrders} className="retry-btn">
                Try Again
              </button>
            </div>
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
                          {order.orderItems && order.orderItems.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-info">
                                <div className="item-name">{item.name}</div>
                                <div className="item-details">
                                  Size: {item.size} | Qty: {item.quantity}
                                  {item.isTeamOrder && (
                                    <div className="team-order-info">
                                      <FaUsers /> Team Order: {item.teamName}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="item-price">₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            </div>
                          ))}
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
    </div>
  );
};

export default CustomerOrdersModal;
