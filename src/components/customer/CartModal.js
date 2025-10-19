import React, { useState } from 'react';
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import CheckoutModal from './CheckoutModal';
import ProductModal from './ProductModal';
import './CartModal.css';

const CartModal = () => {
  const {
    cartItems,
    selectedItems,
    isCartOpen,
    isLoading,
    error,
    closeCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartItemCount,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isAllSelected,
    isItemSelected,
    clearCart
  } = useCart();
  const { user } = useAuth();
  const { showOrderConfirmation, showError } = useNotification();

  const [showCheckout, setShowCheckout] = useState(false);
  const [expandedOrderIndex, setExpandedOrderIndex] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (!isCartOpen) return null;

  const handleQuantityChange = (itemId, newQuantity, isTeamOrder) => {
    if (isTeamOrder) {
      // For team orders, redirect to product modal for customization
      const cartItem = cartItems.find(item => (item.uniqueId || item.id) === itemId);
      if (cartItem) {
        // Create a product object from the cart item
        
        const product = {
          id: cartItem.id,
          name: cartItem.name,
          price: cartItem.price,
          main_image: cartItem.image,
          category: cartItem.isTeamOrder ? 'team' : 'single',
          uniqueId: cartItem.uniqueId,
          cartItemData: {
            size: cartItem.size,
            quantity: cartItem.quantity,
            isTeamOrder: cartItem.isTeamOrder,
            teamMembers: cartItem.teamMembers,
            singleOrderDetails: cartItem.singleOrderDetails,
            sizeType: cartItem.sizeType
          }
        };
        
        setSelectedProduct(product);
        setShowProductModal(true);
      }
    } else {
      // For single orders, just update quantity
      if (newQuantity < 1) {
        removeFromCart(itemId);
      } else {
        updateQuantity(itemId, newQuantity);
      }
    }
  };

  const handleCheckout = () => {
    const selectedItemsList = cartItems.filter(item => selectedItems.has(item.uniqueId || item.id));
    console.log('🛒 Proceeding to checkout with items:', selectedItemsList.length);
    console.log('🛒 Selected items:', selectedItemsList.map(item => ({ id: item.uniqueId || item.id, name: item.name })));
    setShowCheckout(true);
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      if (!user) {
        showError('Login Required', 'Please log in to place an order.');
        return;
      }

      console.log('🛒 Creating order from cart with data:', orderData);

      // Format order data for database
      const formattedOrderData = {
        user_id: user.id,
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        shipping_method: orderData.shippingMethod,
        pickup_location: orderData.selectedLocation || null,
        delivery_address: orderData.deliveryAddress,
        order_notes: orderData.orderNotes || null,
        subtotal_amount: orderData.subtotalAmount,
        shipping_cost: orderData.shippingCost,
        total_amount: orderData.totalAmount,
        total_items: orderData.totalItems,
        order_items: orderData.items
      };

      console.log('🛒 Formatted order data:', formattedOrderData);

      // Create order in database
      const createdOrder = await orderService.createOrder(formattedOrderData);
      
      console.log('✅ Order created successfully:', createdOrder);
      
      // Show success notification
      showOrderConfirmation(createdOrder.order_number, orderData.totalAmount);
      
      // Clear the entire cart after successful checkout
      await clearCart();
      
      // Trigger a custom event to refresh orders count in header
      window.dispatchEvent(new CustomEvent('orderPlaced'));
      
      // Close modals
      setShowCheckout(false);
      closeCart();
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      showError('Order Failed', `Failed to place order: ${error.message}. Please try again.`);
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="cart-modal-overlay" onClick={closeCart}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h2>MY CART</h2>
            <button className="close-btn" onClick={closeCart}>
              <FaTimes />
            </button>
          </div>

                  <div className="cart-content">
                    {isLoading ? (
                      <div className="loading-cart">
                        <div className="loading-spinner"></div>
                        <p>Loading cart...</p>
                      </div>
                    ) : error ? (
                      <div className="error-cart">
                        <p>Error: {error}</p>
                        <button onClick={() => window.location.reload()}>Retry</button>
                      </div>
                    ) : cartItems.length === 0 ? (
                      <div className="empty-cart">
                        <FaShoppingBag className="empty-cart-icon" />
                        <h3>Your cart is empty</h3>
                        <p>Add some items to get started!</p>
                      </div>
                    ) : (
              <>
                        <div className="cart-items-list">
                          {cartItems.map((item, index) => (
                            <div key={item.uniqueId || item.id} className="cart-item-card">
                              <div className="item-checkbox">
                                <input 
                                  type="checkbox" 
                                  checked={isItemSelected(item.uniqueId || item.id)}
                                  onChange={() => toggleItemSelection(item.uniqueId || item.id)}
                                />
                              </div>
                      
                      <div className="item-image">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = '/images/placeholder-jersey.png';
                          }}
                        />
                      </div>
                      
                      <div className="item-details">
                        <div className="item-header">
                          <div className="item-name">{item.name}</div>
                          <button 
                            className="remove-btn-top"
                            onClick={() => removeFromCart(item.uniqueId)}
                            title="Remove item"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        
                        <div className="compact-order-container">
                          <div 
                            className="compact-order-header"
                            onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                          >
                            <span className="order-type-text">{item.isTeamOrder ? 'Team Order' : 'Single Order'}</span>
                            <span className="dropdown-arrow">
                              {expandedOrderIndex === index ? '▲' : '▼'}
                            </span>
                          </div>
                          
                          {expandedOrderIndex === index && (
                            <div className="compact-order-details">
                              {item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0 ? (
                                <div className="compact-team-details">
                                  <div className="team-name-header">
                                    <span className="compact-detail team-name-detail">Team: {item.teamMembers[0]?.teamName || 'N/A'}</span>
                                  </div>
                                  <div className="team-divider"></div>
                                  {item.teamMembers.map((member, memberIndex) => (
                                    <div key={memberIndex} className="compact-member">
                                      <span className="compact-detail surname-detail">Surname: {member.surname || 'N/A'}</span>
                                      <span className="compact-detail">Jersey: {member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                      <span className="compact-detail">Size: {member.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="compact-single-details">
                                  <span className="compact-detail team-name-detail">Team: {item.singleOrderDetails?.teamName || 'N/A'}</span>
                                  <span className="compact-detail surname-detail">Surname: {item.singleOrderDetails?.surname || 'N/A'}</span>
                                  <span className="compact-detail">Jersey: {item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || 'N/A'}</span>
                                  <span className="compact-detail">Size: {item.singleOrderDetails?.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="quantity-selector">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity - 1, item.isTeamOrder)}
                          >
                            <FaMinus />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity + 1, item.isTeamOrder)}
                          >
                            <FaPlus />
                          </button>
                        </div>
                        
                        <div className="price-section">
                          <div className="item-price">₱{parseFloat(item.price).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                        <div className="cart-footer">
                          <div className="select-all">
                            <input 
                              type="checkbox" 
                              id="select-all" 
                              checked={isAllSelected()}
                              onChange={() => isAllSelected() ? deselectAllItems() : selectAllItems()}
                            />
                            <label htmlFor="select-all">Select All ({cartItems.length})</label>
                          </div>
                          
                          <div className="total-summary">
                            <span>Total ({getCartItemCount()} Item): ₱{getCartTotal().toFixed(2)}</span>
                          </div>
                          
                          <button 
                            className="checkout-btn" 
                            onClick={handleCheckout}
                            disabled={selectedItems.size === 0}
                          >
                            CHECK OUT ({selectedItems.size} items)
                          </button>
                        </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cartItems={cartItems.filter(item => selectedItems.has(item.uniqueId || item.id))}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {showProductModal && selectedProduct && (
        <>
          <ProductModal
            isOpen={showProductModal}
            onClose={handleCloseProductModal}
            product={selectedProduct}
            isFromCart={true}
            existingCartItemId={selectedProduct.uniqueId}
            existingCartItemData={selectedProduct.cartItemData}
          />
        </>
      )}
    </>
  );
};

export default CartModal;
