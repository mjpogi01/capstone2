import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTruck, FaMapMarkerAlt, FaCalendarAlt, FaShoppingBag, FaUsers, FaBan } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import './CustomerOrdersModal.css';

const CustomerOrdersModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserOrders();
    }
  }, [isOpen, user]);

  const loadUserOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // getUserOrders now excludes cancelled orders by default
      const userOrders = await orderService.getUserOrders(user.id);
      setOrders(userOrders);
    } catch (err) {
      console.error('Error loading user orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <div className="loading-spinner">Loading your orders...</div>
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
                        Total: ₱{order.totalAmount.toFixed(2)}
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
                              <div className="item-price">₱{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

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
                          <span>₱{order.subtotalAmount.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Shipping:</span>
                          <span>₱{order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>₱{order.totalAmount.toFixed(2)}</span>
                        </div>
                        {order.orderNotes && (
                          <div className="order-notes">
                            <strong>Notes:</strong> {order.orderNotes}
                          </div>
                        )}
                      </div>

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
    </div>
  );
};

export default CustomerOrdersModal;
