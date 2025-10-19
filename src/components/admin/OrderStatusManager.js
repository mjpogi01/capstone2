import React, { useState, useEffect } from 'react';
import orderTrackingService from '../../services/orderTrackingService';
import './OrderStatusManager.css';

const OrderStatusManager = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically fetch from your orders API
      // For now, we'll use mock data
      const mockOrders = [
        {
          id: 1,
          orderNumber: 'ORD-001',
          customerName: 'John Doe',
          status: 'in_store',
          createdAt: new Date().toISOString(),
          items: ['Basketball Jersey', 'Football Jersey']
        },
        {
          id: 2,
          orderNumber: 'ORD-002',
          customerName: 'Jane Smith',
          status: 'on_the_way',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          items: ['Volleyball Jersey']
        },
        {
          id: 3,
          orderNumber: 'ORD-003',
          customerName: 'Mike Johnson',
          status: 'delivered',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          items: ['Basketball Jersey', 'Soccer Jersey']
        }
      ];
      
      setOrders(mockOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);

      await orderTrackingService.updateOrderStatus(orderId, newStatus, {
        updatedBy: 'Admin',
        updateReason: 'Status change by administrator'
      });

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      // Clear selection
      setSelectedOrder(null);

    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      in_store: {
        title: 'In Store Branch',
        description: 'Order is being prepared at store branch',
        icon: '🏪',
        color: '#3B82F6',
        bgColor: '#EFF6FF'
      },
      on_the_way: {
        title: 'On The Way',
        description: 'Order is being delivered',
        icon: '🚚',
        color: '#F59E0B',
        bgColor: '#FFFBEB'
      },
      delivered: {
        title: 'Delivered',
        description: 'Order has been delivered',
        icon: '✅',
        color: '#10B981',
        bgColor: '#ECFDF5'
      }
    };

    return statusMap[status] || {
      title: 'Unknown',
      description: 'Status unknown',
      icon: '❓',
      color: '#6B7280',
      bgColor: '#F9FAFB'
    };
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      in_store: 'on_the_way',
      on_the_way: 'delivered',
      delivered: null // No next status
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="order-status-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-manager">
      <div className="manager-header">
        <h2>Order Status Manager</h2>
        <p>Update and track order statuses</p>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="orders-grid">
        {orders.map(order => {
          const statusInfo = getStatusInfo(order.status);
          const nextStatus = getNextStatus(order.status);
          const nextStatusInfo = nextStatus ? getStatusInfo(nextStatus) : null;

          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>{order.orderNumber}</h3>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="order-details">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Items:</strong> {order.items.join(', ')}</p>
              </div>

              <div 
                className="current-status"
                style={{
                  backgroundColor: statusInfo.bgColor,
                  borderColor: statusInfo.color
                }}
              >
                <div className="status-icon" style={{ color: statusInfo.color }}>
                  {statusInfo.icon}
                </div>
                <div className="status-info">
                  <h4 style={{ color: statusInfo.color }}>{statusInfo.title}</h4>
                  <p>{statusInfo.description}</p>
                </div>
              </div>

              {nextStatus && (
                <div className="status-actions">
                  <button
                    onClick={() => updateOrderStatus(order.id, nextStatus)}
                    disabled={updating}
                    className="update-status-btn"
                    style={{
                      backgroundColor: nextStatusInfo.color,
                      color: '#ffffff'
                    }}
                  >
                    {updating ? 'Updating...' : `Mark as ${nextStatusInfo.title}`}
                  </button>
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="delivered-status">
                  <div className="delivered-icon">✅</div>
                  <p>Order completed successfully</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>No Orders Found</h3>
          <p>There are currently no orders to manage.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatusManager;
