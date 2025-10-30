import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash, faMinus, faPlus, faShoppingBag, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
    closeCart(); // Close cart modal when opening checkout
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
      
      // Remove only the checked out items from cart
      const checkedOutItemIds = orderData.items.map(item => item.uniqueId || item.id);
      console.log('🛒 Removing checked out items from cart:', checkedOutItemIds);
      
      for (const itemId of checkedOutItemIds) {
        await removeFromCart(itemId);
      }
      
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
      {isCartOpen && (
        <div className="mycart-overlay-clean" onClick={closeCart}>
          <div className="mycart-container-clean" onClick={(e) => e.stopPropagation()}>
            <div className="mycart-header-clean">
              <h2>MY CART</h2>
              <button className="mycart-close-btn-clean" onClick={closeCart}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mycart-content-clean">
            {isLoading ? (
              <div className="mycart-loading-state">
                <div className="mycart-loading-spinner"></div>
                <p>Loading cart...</p>
              </div>
            ) : error ? (
              <div className="mycart-error-state">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="mycart-empty-state">
                <FontAwesomeIcon icon={faShoppingBag} className="mycart-empty-icon" />
                <h3>Your cart is empty</h3>
                <p>Add some items to get started!</p>
              </div>
            ) : (
              <>
                <div className="mycart-items-list-clean">
                  {cartItems.map((item, index) => (
                    <div key={item.uniqueId || item.id} className="mycart-item-box">
                      <div className="mycart-checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          checked={isItemSelected(item.uniqueId || item.id)}
                          onChange={() => toggleItemSelection(item.uniqueId || item.id)}
                        />
                      </div>
                
                      <div className="mycart-product-image-wrapper">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = '/images/placeholder-jersey.png';
                          }}
                        />
                      </div>
                      
                      <div className="mycart-product-info-section">
                        <div className="mycart-product-header-line">
                          <h3 className="mycart-product-name">{item.name}</h3>
                          <button 
                            className="mycart-remove-btn-clean"
                            onClick={() => removeFromCart(item.uniqueId || item.id)}
                            title="Remove item"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                        
                        <div className="mycart-order-type-container">
                          {(() => {
                            const isBall = item.category?.toLowerCase() === 'balls';
                            const isTrophy = item.category?.toLowerCase() === 'trophies';
                            const isApparel = !isBall && !isTrophy;

                            return (
                              <>
                                {!isBall && (
                                  <>
                                    <div 
                                      className={`mycart-order-type-header ${expandedOrderIndex === index ? 'expanded' : ''}`}
                                      onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                                    >
                                      <span className="mycart-order-type-label">
                                        {isTrophy ? 'Trophy Details' : (item.isTeamOrder ? 'Team Order' : 'Single Order')}
                                      </span>
                                      <span className="mycart-dropdown-arrow">
                                        <FontAwesomeIcon icon={faChevronDown} />
                                      </span>
                                    </div>
                                    
                                    {expandedOrderIndex === index && (
                                  <div className="mycart-order-details-section">
                                    {/* For Apparel - Team Orders */}
                                    {isApparel && item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0 ? (
                                      <div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Team:</span>
                                          <span className="mycart-detail-value">{item.teamMembers[0]?.teamName || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-team-members-list">
                                          {item.teamMembers.map((member, memberIndex) => (
                                            <div key={memberIndex} className="mycart-team-member-item">
                                              <div className="mycart-detail-line">
                                                <span className="mycart-detail-label">Surname:</span>
                                                <span className="mycart-detail-value">{member.surname || 'N/A'}</span>
                                              </div>
                                              <div className="mycart-detail-line">
                                                <span className="mycart-detail-label">Jersey:</span>
                                                <span className="mycart-detail-value">{member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                              </div>
                                              <div className="mycart-detail-line">
                                                <span className="mycart-detail-label">Size:</span>
                                                <span className="mycart-detail-value">{member.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : isApparel ? (
                                      /* For Apparel - Single Orders */
                                      <div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Team:</span>
                                          <span className="mycart-detail-value">{item.singleOrderDetails?.teamName || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Surname:</span>
                                          <span className="mycart-detail-value">{item.singleOrderDetails?.surname || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Jersey:</span>
                                          <span className="mycart-detail-value">{item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Size:</span>
                                          <span className="mycart-detail-value">{item.singleOrderDetails?.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                        </div>
                                      </div>
                                    ) : isTrophy ? (
                                      /* For Trophies */
                                      <div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Size:</span>
                                          <span className="mycart-detail-value">{item.trophyDetails?.size || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Engraving:</span>
                                          <span className="mycart-detail-value">{item.trophyDetails?.engravingText || 'N/A'}</span>
                                        </div>
                                        <div className="mycart-detail-line">
                                          <span className="mycart-detail-label">Occasion:</span>
                                          <span className="mycart-detail-value">{item.trophyDetails?.occasion || 'N/A'}</span>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                    )}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="mycart-quantity-controls">
                          <button 
                            className="mycart-quantity-btn"
                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity - 1, item.isTeamOrder)}
                            disabled={item.quantity <= 1}
                            title={item.quantity <= 1 ? "Minimum quantity reached" : "Decrease quantity"}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span className="mycart-quantity-display" aria-live="polite">{item.quantity}</span>
                          <button 
                            className="mycart-quantity-btn"
                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity + 1, item.isTeamOrder)}
                            title="Increase quantity"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                        </div>
                        
                        <div className="mycart-price-display">
                          <span className="mycart-item-price">₱{parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mycart-footer-section">
                  <div className="mycart-select-all-row">
                    <input 
                      type="checkbox" 
                      id="select-all" 
                      checked={isAllSelected()}
                      onChange={() => isAllSelected() ? deselectAllItems() : selectAllItems()}
                    />
                    <label htmlFor="select-all">Select All ({cartItems.length})</label>
                  </div>
                  
                  <div className="mycart-total-section">
                    <span className="mycart-total-label">Total ({getCartItemCount()} Item):</span>
                    <span className="mycart-total-amount">₱{getCartTotal().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <button 
                    className="mycart-checkout-btn-clean" 
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
      )}

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
