import React, { useState, useEffect, useCallback } from 'react';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
import CheckoutModal from './CheckoutModal';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, isFromCart = false, existingCartItemId = null, existingCartItemData = null, onAddToCart, onBuyNow }) => {
  // Always call hooks, but only use CartContext when in customer mode (no callbacks provided)
  const isAdminMode = !!(onAddToCart && onBuyNow);
  const cartContext = useCart();
  const { addToCart: contextAddToCart, removeFromCart: contextRemoveFromCart, cartItems, selectedItems, clearCart } = cartContext;
  
  // Use context functions only when NOT in admin mode
  const addToCart = isAdminMode ? null : contextAddToCart;
  const removeFromCart = isAdminMode ? null : contextRemoveFromCart;
  
  const { user } = useAuth();
  const { showOrderConfirmation, showError } = useNotification();
  const [selectedSize, setSelectedSize] = useState(existingCartItemData?.size || 'M');
  const [quantity, setQuantity] = useState(existingCartItemData?.quantity || 1);
  const [isTeamOrder, setIsTeamOrder] = useState(existingCartItemData?.isTeamOrder || false);
  const [teamMembers, setTeamMembers] = useState(existingCartItemData?.teamMembers || []);
  const [teamName, setTeamName] = useState(existingCartItemData?.teamMembers?.[0]?.teamName || '');
  const [newMember, setNewMember] = useState({ surname: '', number: '', size: 'M' });
  const [singleOrderDetails, setSingleOrderDetails] = useState(existingCartItemData?.singleOrderDetails || { teamName: '', surname: '', number: '', size: 'M' });
  const [sizeType, setSizeType] = useState(existingCartItemData?.sizeType || 'adult'); // 'adult' or 'kids'
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Debug: Monitor Buy Now item changes
  useEffect(() => {
    if (buyNowItem) {
      console.log('🛒 ProductModal: Buy Now item set:', buyNowItem.name);
    }
  }, [buyNowItem]);

  // Define loadProductReviews first (before useEffect that calls it)
  const loadProductReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      // Fetch all reviews for completed orders
      const allOrders = await orderService.getAllOrdersWithReviews();
      
      // Flatten all reviews from all orders
      const allReviews = allOrders.flatMap(order => order.reviews || []);
      
      console.log('📦 Loaded all reviews:', allReviews.length);
      console.log('📦 Sample reviews:', allReviews.slice(0, 3));
      
      // Format reviews to display properly
      const formattedReviews = allReviews.map(review => ({
        id: review.id,
        user: review.user_id || 'Anonymous',
        rating: review.rating || 0,
        comment: review.comment || '',
        date: new Date(review.created_at).toLocaleDateString()
      }));
      
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error loading product reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // Reset form when modal opens with existing cart data
  useEffect(() => {
    if (isOpen && existingCartItemData) {
      setSelectedSize(existingCartItemData.size || 'M');
      setQuantity(existingCartItemData.quantity || 1);
      setIsTeamOrder(existingCartItemData.isTeamOrder || false);
      setTeamMembers(existingCartItemData.teamMembers || []);
      setTeamName(existingCartItemData.teamMembers?.[0]?.teamName || '');
      setSingleOrderDetails(existingCartItemData.singleOrderDetails || { teamName: '', surname: '', number: '', size: 'M' });
    }
  }, [isOpen, existingCartItemData]);

  // Load reviews for the product
  useEffect(() => {
    if (isOpen && product?.id) {
      loadProductReviews();
    }
  }, [isOpen, product?.id, loadProductReviews]);

  if (!isOpen || !product) return null;

  const adultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const kidsSizes = ['2XS', 'XS', 'S', 'M', 'L', 'XL'];
  const sizes = sizeType === 'adult' ? adultSizes : kidsSizes;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleAddToCart = async () => {
    if (isAddingToCart) return; // Prevent multiple clicks
    
    try {
      setIsAddingToCart(true);
      
      // Validate required fields
      if (!product || !product.id || !product.name) {
        showError('Invalid Product', 'Product information is missing. Please try again.');
        return;
      }

      // Calculate price based on size type
      const finalPrice = sizeType === 'kids' ? parseFloat(product.price) - 200 : parseFloat(product.price);
      
      const cartOptions = {
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        singleOrderDetails: !isTeamOrder ? singleOrderDetails : null,
        sizeType: sizeType,
        price: finalPrice, // Use discounted price for kids
        isReplacement: isFromCart // Mark as replacement when coming from cart
      };

      // Use callback if provided (for walk-in ordering), otherwise use context
      if (onAddToCart) {
        onAddToCart(product, cartOptions);
        onClose();
        return;
      }

      if (!user) {
        showError('Login Required', 'Please log in to add items to cart.');
        return;
      }

      // If this is from cart, remove the existing item first
      if (isFromCart && existingCartItemId) {
        await removeFromCart(existingCartItemId);
        // Add a small delay to ensure the removal is processed
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      await addToCart(product, cartOptions);
      
      // The notification is already handled by CartContext
      // Close the modal after adding to cart
      onClose();
    } catch (error) {
      console.error('Error updating cart:', error);
      
      // Show specific error message based on error type
      if (error.message.includes('Invalid product data')) {
        showError('Invalid Product', 'Product information is missing. Please try again.');
      } else if (error.message.includes('User not authenticated')) {
        showError('Login Required', 'Please log in to add items to cart.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        showError('Network Error', 'Please check your internet connection and try again.');
      } else {
        showError('Cart Error', 'Error updating cart. Please try again.');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      console.log('🛒 Buy Now clicked for product:', product.name);
      
      // Calculate price based on size type
      const finalPrice = sizeType === 'kids' ? parseFloat(product.price) - 200 : parseFloat(product.price);
      
      const buyNowOptions = {
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        singleOrderDetails: !isTeamOrder ? singleOrderDetails : null,
        sizeType: sizeType,
        price: finalPrice
      };

      // Use callback if provided (for walk-in ordering), otherwise use default flow
      if (onBuyNow) {
        onBuyNow(product, buyNowOptions);
        onClose();
        return;
      }
      
      // Create a standalone order item for Buy Now (not added to cart)
      const buyNowItem = {
        id: product.id,
        name: product.name,
        price: finalPrice,
        image: product.main_image,
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        singleOrderDetails: !isTeamOrder ? singleOrderDetails : null,
        sizeType: sizeType,
        isBuyNow: true, // Mark as Buy Now item
        uniqueId: `buynow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Generate unique ID
      };
      
      console.log('🛒 Buy Now item created:', buyNowItem);
      console.log('🛒 Opening checkout with Buy Now item only');
      
      // Store the Buy Now item in component state and open checkout
      setBuyNowItem(buyNowItem);
      setShowCheckout(true);
      
    } catch (error) {
      console.error('Error creating Buy Now item:', error);
      alert('Error processing Buy Now. Please try again.');
    }
  };

  // Removed unused handleTeamOrderToggle function

  const handlePlaceOrder = async (orderData) => {
    try {
      if (!user) {
        showError('Login Required', 'Please log in to place an order.');
        return;
      }

      console.log('🛒 Creating order with data:', orderData);

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
      
      setShowCheckout(false);
      setBuyNowItem(null); // Clear Buy Now item
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      showError('Order Failed', `Failed to place order: ${error.message}. Please try again.`);
    }
  };

  const addTeamMember = () => {
    if (newMember.surname.trim()) {
      const member = {
        id: Date.now(),
        teamName: teamName,
        surname: newMember.surname,
        number: newMember.number,
        size: newMember.size
      };
      setTeamMembers([...teamMembers, member]);
      setNewMember({ surname: '', number: '', size: 'M' });
    }
  };

  const removeTeamMember = (id) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const toggleReviews = () => {
    setIsReviewsExpanded(!isReviewsExpanded);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <AiFillStar className="star filled" />
        ) : (
          <AiOutlineStar className="star" />
        )}
      </span>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-button" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Main Modal Content - Single Container */}
        <div className="modal-main-content">
          {/* Left Panel - Product Image Only */}
          <div className="modal-left-panel">
            {/* Product Image */}
            <div className="modal-image-container">
              {product.main_image ? (
                <img 
                  src={product.main_image} 
                  alt={product.name}
                  className="modal-image"
                />
              ) : (
                <div className="modal-image-placeholder">
                  <span className="modal-image-emoji">🏀</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Product Configuration */}
          <div className="modal-right-panel">
            {/* Content Section - Scrollable */}
            <div className="modal-content-section">
              {/* Header Section - Now scrolls with content */}
              <div className="modal-header-section">
                {/* Brand Header */}
                <div className="modal-brand-header"></div>

                {/* Product Name */}
                <div className="modal-product-title">{product.name}</div>

                {/* Price */}
                <div className="modal-product-price">
                  {sizeType === 'kids' ? (
                    <>
                      <span className="discounted-price">₱ {(parseFloat(product.price) - 200).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      <span className="original-price">₱ {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </>
                  ) : (
                    `₱ ${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  )}
                </div>
              </div>


            {/* Order Type Switch */}
            <div className="modal-order-switch">
              <div className="modal-switch-container">
                <button
                  className={`modal-switch-option ${!isTeamOrder ? 'active' : ''}`}
                  onClick={() => setIsTeamOrder(false)}
                >
                  <span className="modal-switch-text">Single Order</span>
                </button>
                <button
                  className={`modal-switch-option ${isTeamOrder ? 'active' : ''}`}
                  onClick={() => setIsTeamOrder(true)}
                >
                  <FaUsers className="modal-switch-icon" />
                  <span className="modal-switch-text">Team Order</span>
                </button>
              </div>
            </div>

            {/* Size Type Toggle for Team Orders */}
            {isTeamOrder && (
              <div className="modal-size-type-section">
                <div className="modal-size-type-label">SIZE TYPE</div>
                <div className="modal-size-type-buttons">
                  <button
                    className={`modal-size-type-button ${sizeType === 'adult' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('adult');
                      setNewMember({...newMember, size: 'M'});
                    }}
                  >
                    Adult
                  </button>
                  <button
                    className={`modal-size-type-button ${sizeType === 'kids' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('kids');
                      setNewMember({...newMember, size: 'M'});
                    }}
                  >
                    Kids
                  </button>
                </div>
              </div>
            )}

            {/* Team Members Section */}
            {isTeamOrder && (
              <div className="modal-team-section">
                <div className="modal-team-label">Team Members</div>
                
                {/* Team Name Input */}
                <div className="modal-team-name-section">
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="modal-team-name-input"
                  />
                </div>
                
                {/* Add New Member */}
                <div className="modal-add-member-form">
                  <div className="modal-member-inputs">
                    <input
                      type="text"
                      placeholder="Surname"
                      value={newMember.surname}
                      onChange={(e) => setNewMember({...newMember, surname: e.target.value})}
                      className="modal-member-input"
                    />
                    <input
                      type="text"
                      placeholder="#"
                      value={newMember.number}
                      onChange={(e) => setNewMember({...newMember, number: e.target.value})}
                      className="modal-member-input number-input"
                    />
                    <select
                      value={newMember.size}
                      onChange={(e) => setNewMember({...newMember, size: e.target.value})}
                      className="modal-member-select"
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <button 
                      className="modal-add-member-button"
                      onClick={addTeamMember}
                      disabled={!newMember.surname.trim()}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="modal-members-list">
                  {teamMembers.map(member => (
                    <div key={member.id} className="modal-member-item">
                      <span className="modal-member-name">{member.surname}</span>
                      <span className="modal-member-number">#{member.number}</span>
                      <span className="modal-member-size">Size: {member.size}</span>
                      <button 
                        className="modal-remove-member-button"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Size Type Toggle */}
            {!isTeamOrder && (
              <div className="modal-size-type-section">
                <div className="modal-size-type-label">SIZE TYPE</div>
                <div className="modal-size-type-buttons">
                  <button
                    className={`modal-size-type-button ${sizeType === 'adult' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('adult');
                      setSingleOrderDetails({...singleOrderDetails, size: 'M'});
                    }}
                  >
                    Adult
                  </button>
                  <button
                    className={`modal-size-type-button ${sizeType === 'kids' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('kids');
                      setSingleOrderDetails({...singleOrderDetails, size: 'M'});
                    }}
                  >
                    Kids
                  </button>
                </div>
              </div>
            )}

            {/* Single Order Form */}
            {!isTeamOrder && (
              <div className="modal-single-order-section">
                <div className="modal-single-order-label">Order Details</div>
                <div className="modal-single-order-form">
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={singleOrderDetails.teamName}
                    onChange={(e) => setSingleOrderDetails({...singleOrderDetails, teamName: e.target.value})}
                    className="modal-single-order-input"
                  />
                  <input
                    type="text"
                    placeholder="Surname"
                    value={singleOrderDetails.surname}
                    onChange={(e) => setSingleOrderDetails({...singleOrderDetails, surname: e.target.value})}
                    className="modal-single-order-input"
                  />
                  <input
                    type="text"
                    placeholder="Number"
                    value={singleOrderDetails.number}
                    onChange={(e) => setSingleOrderDetails({...singleOrderDetails, number: e.target.value})}
                    className="modal-single-order-input"
                  />
                  <select
                    value={singleOrderDetails.size}
                    onChange={(e) => setSingleOrderDetails({...singleOrderDetails, size: e.target.value})}
                    className="modal-single-order-select"
                  >
                    {sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quantity Section */}
            {!isTeamOrder && (
              <div className="modal-quantity-section">
                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-controls">
                  <button 
                    className="modal-quantity-button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="modal-quantity-display">{quantity}</span>
                  <button 
                    className="modal-quantity-button"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-action-buttons">
              <button 
                  className="modal-add-cart-button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                <FaShoppingCart />
                {isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
              </button>
              <button 
                  className="modal-buy-now-button"
                onClick={handleBuyNow}
              >
                <FaCreditCard />
                BUY NOW
              </button>
            </div>

            {/* Product Description */}
            <div className="modal-description-section">
              <div className="modal-description-header" onClick={toggleDescription}>
                <span className="modal-description-title">PRODUCT DESCRIPTION</span>
                <FaChevronDown className="modal-description-chevron" />
              </div>
              {isDescriptionExpanded && (
                <div className="modal-description-content">
                  <p>{product.description || 'High-quality sportswear designed for comfort and performance.'}</p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="modal-reviews-section">
              <div className="modal-reviews-header" onClick={toggleReviews}>
                <div className="modal-reviews-title-row">
                  <span className="modal-reviews-title">CUSTOMER REVIEWS</span>
                  <div className="modal-average-rating">
                    <div className="modal-stars-display">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="modal-rating-text">({averageRating.toFixed(1)})</span>
                  </div>
                </div>
                <FaChevronDown className="modal-reviews-chevron" />
              </div>
              {isReviewsExpanded && (
                <div className="modal-reviews-content">
                  {reviewsLoading ? (
                    <p>Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p>No reviews yet for this product. Be the first to leave one!</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="modal-review-item">
                        <div className="modal-review-header">
                          <span className="modal-review-user">{review.user}</span>
                          <div className="modal-review-rating">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="modal-review-comment">{review.comment}</p>
                        <span className="modal-review-date">{review.date}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={buyNowItem ? [buyNowItem] : cartItems.filter(item => selectedItems.has(item.uniqueId || item.id))}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};

export default ProductModal;