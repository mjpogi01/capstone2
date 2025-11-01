import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
import CheckoutModal from './CheckoutModal';
import SizeChartModal from './SizeChartModal';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import './ProductModal.css';

const DEFAULT_TROPHY_SIZES = ['6" (Small)', '10" (Medium)', '14" (Large)', '18" (Extra Large)', '24" (Premium)'];

const parseTrophySizes = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim());
    }
  } catch (error) {
    console.warn('Unable to parse trophy sizes:', error.message);
  }

  return [];
};

const ProductModal = ({ isOpen, onClose, product, isFromCart = false, existingCartItemId = null, existingCartItemData = null, onAddToCart, onBuyNow, onConfirm }) => {
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
  const [teamMembers, setTeamMembers] = useState(
    existingCartItemData?.teamMembers && existingCartItemData.teamMembers.length > 0
      ? existingCartItemData.teamMembers
      : [{ id: Date.now(), teamName: '', surname: '', number: '', jerseySize: 'M', shortsSize: 'M' }]
  );
  const [teamName, setTeamName] = useState(existingCartItemData?.teamMembers?.[0]?.teamName || '');
  const [singleOrderDetails, setSingleOrderDetails] = useState(existingCartItemData?.singleOrderDetails || { teamName: '', surname: '', number: '', jerseySize: 'M', shortsSize: 'M' });
  const [sizeType, setSizeType] = useState(existingCartItemData?.sizeType || 'adult'); // 'adult' or 'kids'
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Ball and Trophy specific details
  const [ballDetails, setBallDetails] = useState(existingCartItemData?.ballDetails || {
    sportType: '',
    brand: '',
    ballSize: '',
    material: ''
  });
  const [trophyDetails, setTrophyDetails] = useState(existingCartItemData?.trophyDetails || {
    trophyType: '',
    size: '',
    material: '',
    engravingText: '',
    occasion: ''
  });

  // Debug: Monitor Buy Now item changes
  useEffect(() => {
    if (buyNowItem) {
      console.log('≡ƒ¢Æ ProductModal: Buy Now item set:', buyNowItem.name);
    }
  }, [buyNowItem]);

  // Define loadProductReviews first (before useEffect that calls it)
  const loadProductReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      // Fetch reviews specifically for this product
      const productReviews = await orderService.getProductReviews(product.id);
      
      console.log('≡ƒôª Loaded reviews for product', product.id, ':', productReviews.length, 'reviews');
      
      // Format reviews to display properly
      const formattedReviews = productReviews.map(review => ({
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
  }, [product?.id]);

  // Reset form when modal opens with existing cart data
  useEffect(() => {
    if (isOpen && existingCartItemData) {
      setSelectedSize(existingCartItemData.size || 'M');
      setQuantity(existingCartItemData.quantity || 1);
      setIsTeamOrder(existingCartItemData.isTeamOrder || false);
      setTeamMembers(existingCartItemData.teamMembers || []);
      setTeamName(existingCartItemData.teamMembers?.[0]?.teamName || '');
      setSingleOrderDetails(existingCartItemData.singleOrderDetails || { teamName: '', surname: '', number: '', jerseySize: 'M', shortsSize: 'M' });
    }
  }, [isOpen, existingCartItemData]);

  // Load reviews for the product
  useEffect(() => {
    if (isOpen && product?.id) {
      loadProductReviews();
    }
  }, [isOpen, product?.id, loadProductReviews]);

  // Refresh reviews when modal opens (in case new reviews were added)
  useEffect(() => {
    if (isOpen && product?.id) {
      // Small delay to ensure any recent review submissions are processed
      const refreshTimer = setTimeout(() => {
        loadProductReviews();
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [isOpen, product?.id, loadProductReviews]);

  const trophySizeOptions = useMemo(() => {
    if (!product) {
      return DEFAULT_TROPHY_SIZES;
    }

    if (Array.isArray(product.available_sizes) && product.available_sizes.length > 0) {
      return product.available_sizes;
    }

    const parsed = parseTrophySizes(product.size);
    if (parsed.length > 0) {
      return parsed;
    }

    return DEFAULT_TROPHY_SIZES;
  }, [product]);

  if (!isOpen || !product) return null;

  // Determine product category
  const isBall = product.category?.toLowerCase() === 'balls';
  const isTrophy = product.category?.toLowerCase() === 'trophies';
  const isApparel = !isBall && !isTrophy;

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

      console.log('≡ƒ¢Æ handleAddToCart called for product:', product.name, 'ID:', product.id);

      // Clear previous errors
      const errors = {};

      // Validate order details before adding to cart
      if (isApparel && !isTeamOrder) {
        // Validate single order details
        if (!singleOrderDetails.teamName || !singleOrderDetails.teamName.trim()) {
          errors.singleTeamName = 'Required';
        }
        if (!singleOrderDetails.surname || !singleOrderDetails.surname.trim()) {
          errors.singleSurname = 'Required';
        }
        if (!singleOrderDetails.number || !singleOrderDetails.number.trim()) {
          errors.singleNumber = 'Required';
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsAddingToCart(false);
          return;
        }
      }
      
      if (isApparel && isTeamOrder) {
        // Validate team name
        if (!teamName || !teamName.trim()) {
          errors.teamName = 'Required';
        }
        // Validate team members - check if all members have required fields
        teamMembers.forEach((member, index) => {
          if (!member.surname || !member.surname.trim()) {
            errors[`teamMember_${index}_surname`] = 'Required';
          }
          if (!member.number || !member.number.trim()) {
            errors[`teamMember_${index}_number`] = 'Required';
          }
        });
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsAddingToCart(false);
          return;
        }
      }
      
      // Removed ball size validation - balls can be added without size selection
      
      if (isTrophy) {
        // Validate trophy details
        if (!trophyDetails.size || !trophyDetails.size.trim()) {
          errors.trophySize = 'Please select trophy size';
        }
        if (!trophyDetails.occasion || !trophyDetails.occasion.trim()) {
          errors.trophyOccasion = 'Please enter occasion';
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsAddingToCart(false);
          return;
        }
      }
      
      // Clear validation errors if all passed
      setValidationErrors({});

      // Calculate price based on size type
      const finalPrice = sizeType === 'kids' ? parseFloat(product.price) - 200 : parseFloat(product.price);
      
      const cartOptions = {
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        teamName: isTeamOrder ? teamName : null, // Add teamName for team orders
        singleOrderDetails: !isTeamOrder && isApparel ? singleOrderDetails : null,
        sizeType: sizeType,
        price: finalPrice, // Use discounted price for kids
        isReplacement: isFromCart, // Mark as replacement when coming from cart
        category: product.category, // Include category
        ballDetails: isBall ? ballDetails : null,
        trophyDetails: isTrophy ? trophyDetails : null
      };

      console.log('≡ƒ¢Æ Cart options:', cartOptions);

      // Use onConfirm callback if provided (for wishlist), otherwise continue with regular flow
      if (onConfirm) {
        console.log('≡ƒ¢Æ Using onConfirm callback');
        onConfirm(product, cartOptions);
        return;
      }

      // Use callback if provided (for walk-in ordering), otherwise use context
      if (onAddToCart) {
        console.log('≡ƒ¢Æ Using onAddToCart callback');
        onAddToCart(product, cartOptions);
        onClose();
        return;
      }

      if (!user) {
        showError('Login Required', 'Please log in to add items to cart.');
        return;
      }

      console.log('≡ƒ¢Æ Adding to cart for user:', user.id);

      // If this is from cart, remove the existing item first
      if (isFromCart && existingCartItemId) {
        console.log('≡ƒ¢Æ Removing existing cart item:', existingCartItemId);
        await removeFromCart(existingCartItemId);
        // Add a small delay to ensure the removal is processed
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('≡ƒ¢Æ Calling addToCart context function');
      await addToCart(product, cartOptions);
      
      console.log('Γ£à Item added to cart successfully');
      // The notification is already handled by CartContext
      // Close the modal after adding to cart
      onClose();
    } catch (error) {
      console.error('Γ¥î Error updating cart:', error);
      
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
      console.log('≡ƒ¢Æ Buy Now clicked for product:', product.name);
      
      // Clear previous errors
      const errors = {};
      
      // Validate order details before proceeding
      if (isApparel && !isTeamOrder) {
        // Validate single order details
        if (!singleOrderDetails.teamName || !singleOrderDetails.teamName.trim()) {
          errors.singleTeamName = 'Required';
        }
        if (!singleOrderDetails.surname || !singleOrderDetails.surname.trim()) {
          errors.singleSurname = 'Required';
        }
        if (!singleOrderDetails.number || !singleOrderDetails.number.trim()) {
          errors.singleNumber = 'Required';
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
      
      if (isApparel && isTeamOrder) {
        // Validate team name
        if (!teamName || !teamName.trim()) {
          errors.teamName = 'Required';
        }
        // Validate team members - check if all members have required fields
        teamMembers.forEach((member, index) => {
          if (!member.surname || !member.surname.trim()) {
            errors[`teamMember_${index}_surname`] = 'Required';
          }
          if (!member.number || !member.number.trim()) {
            errors[`teamMember_${index}_number`] = 'Required';
          }
        });
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
      
      // Removed ball size validation for Buy Now - balls can be purchased without size selection
      
      if (isTrophy) {
        // Validate trophy details
        if (!trophyDetails.size || !trophyDetails.size.trim()) {
          errors.trophySize = 'Please select trophy size before you buy';
        }
        if (!trophyDetails.occasion || !trophyDetails.occasion.trim()) {
          errors.trophyOccasion = 'Please enter occasion before you buy';
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
      
      // Clear validation errors if all passed
      setValidationErrors({});
      
      // Calculate price based on size type
      const finalPrice = sizeType === 'kids' ? parseFloat(product.price) - 200 : parseFloat(product.price);
      
      const buyNowOptions = {
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        singleOrderDetails: !isTeamOrder && isApparel ? singleOrderDetails : null,
        sizeType: sizeType,
        price: finalPrice,
        category: product.category, // Include category
        ballDetails: isBall ? ballDetails : null,
        trophyDetails: isTrophy ? trophyDetails : null
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
        singleOrderDetails: !isTeamOrder && isApparel ? singleOrderDetails : null,
        sizeType: sizeType,
        isBuyNow: true, // Mark as Buy Now item
        uniqueId: `buynow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        category: product.category, // Include category
        ballDetails: isBall ? ballDetails : null,
        trophyDetails: isTrophy ? trophyDetails : null
      };
      
      console.log('≡ƒ¢Æ Buy Now item created:', buyNowItem);
      console.log('≡ƒ¢Æ Opening checkout with Buy Now item only');
      
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

      console.log('≡ƒ¢Æ Creating order with data:', orderData);

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

      console.log('≡ƒ¢Æ Formatted order data:', formattedOrderData);

      // Create order in database
      const createdOrder = await orderService.createOrder(formattedOrderData);
      
      console.log('Γ£à Order created successfully:', createdOrder);
      
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
      console.error('Γ¥î Error creating order:', error);
      showError('Order Failed', `Failed to place order: ${error.message}. Please try again.`);
    }
  };

  const addTeamMember = () => {
    const newMember = {
      id: Date.now(),
      teamName: teamName,
      surname: '',
      number: '',
      jerseySize: 'M',
      shortsSize: 'M'
    };
    setTeamMembers([...teamMembers, newMember]);
    console.log('Γ£à New team member row added');
  };

  const updateTeamMember = (index, field, value) => {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const removeTeamMember = (id) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    console.log('Γ£à Team member row removed');
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
          <AiFillStar className="modal-star filled" />
        ) : (
          <AiOutlineStar className="modal-star" />
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
                  <span className="modal-image-emoji">≡ƒÅÇ</span>
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


            {/* Order Type Switch - Only for Apparel */}
            {isApparel && (
              <div className="modal-order-switch">
                <div className="modal-switch-container">
                  <button
                    className={`modal-switch-option ${!isTeamOrder ? 'active' : ''}`}
                    onClick={() => {
                      setIsTeamOrder(false);
                      // Clear team order errors when switching to single order
                      setValidationErrors({});
                    }}
                  >
                    <span className="modal-switch-text">Single Order</span>
                  </button>
                  <button
                    className={`modal-switch-option ${isTeamOrder ? 'active' : ''}`}
                    onClick={() => {
                      setIsTeamOrder(true);
                      // Clear single order errors when switching to team order
                      setValidationErrors({});
                    }}
                  >
                    <FaUsers className="modal-switch-icon" />
                    <span className="modal-switch-text">Team Order</span>
                  </button>
                </div>
              </div>
            )}

            {/* Size Type Toggle for Team Orders - Only for Apparel */}
            {isApparel && isTeamOrder && (
              <div className="modal-size-type-section">
                <div className="modal-size-type-label">SIZE TYPE <a href="#" onClick={(e) => { e.preventDefault(); setShowSizeChart(true); }} className="modal-size-chart-link">Size chart</a></div>
                <div className="modal-size-type-buttons">
                  <button
                    className={`modal-size-type-button ${sizeType === 'adult' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('adult');
                      setSingleOrderDetails({...singleOrderDetails, jerseySize: 'M', shortsSize: 'M'});
                    }}
                  >
                    Adult
                  </button>
                  <button
                    className={`modal-size-type-button ${sizeType === 'kids' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('kids');
                      setSingleOrderDetails({...singleOrderDetails, jerseySize: 'M', shortsSize: 'M'});
                    }}
                  >
                    Kids
                  </button>
                </div>
              </div>
            )}

            {/* Team Members Section - Only for Apparel */}
            {isApparel && isTeamOrder && (
              <div className="modal-team-section">
                <div className="modal-team-header">
                  <div className="modal-team-label">Team Members</div>
                  <button 
                    type="button"
                    className="modal-add-member-button"
                    onClick={addTeamMember}
                    title="Add Team Member"
                  >
                    <FaPlus />
                  </button>
                </div>
                
                {/* Team Name Input */}
                <div className="modal-team-name-section">
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="Team Name"
                      value={teamName}
                      onChange={(e) => {
                        const newTeamName = e.target.value;
                        setTeamName(newTeamName);
                        // Update the first team member's teamName
                        if (teamMembers.length > 0) {
                          setTeamMembers(prev => prev.map((member, index) => 
                            index === 0 ? { ...member, teamName: newTeamName } : member
                          ));
                        }
                        if (validationErrors.teamName && newTeamName.trim()) {
                          setValidationErrors({...validationErrors, teamName: ''});
                        }
                      }}
                      className={`modal-team-name-input ${validationErrors.teamName ? 'error' : ''}`}
                    />
                    {validationErrors.teamName && (
                      <span className="modal-error-message">{validationErrors.teamName}</span>
                    )}
                  </div>
                </div>

                {/* Team Members Roster - Multiple Input Rows */}
                <div className="modal-members-roster">
                  {teamMembers.map((member, index) => (
                    <div key={member.id} className="modal-member-card">
                      <div className="modal-member-tag">
                        Member {index + 1}
                      </div>
                      <div className="modal-member-row-row-1">
                        <div className="modal-input-wrapper modal-member-wrapper">
                          <input
                            type="text"
                            placeholder="Surname"
                            value={member.surname}
                            onChange={(e) => {
                              updateTeamMember(index, 'surname', e.target.value);
                              if (validationErrors[`teamMember_${index}_surname`]) {
                                const newErrors = {...validationErrors};
                                delete newErrors[`teamMember_${index}_surname`];
                                setValidationErrors(newErrors);
                              }
                            }}
                            className={`modal-member-input ${validationErrors[`teamMember_${index}_surname`] ? 'error' : ''}`}
                          />
                          {validationErrors[`teamMember_${index}_surname`] && (
                            <span className="modal-error-message">{validationErrors[`teamMember_${index}_surname`]}</span>
                          )}
                        </div>
                        <div className="modal-input-wrapper modal-member-wrapper">
                          <input
                            type="text"
                            placeholder="Jersey No."
                            value={member.number}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              updateTeamMember(index, 'number', value);
                              if (validationErrors[`teamMember_${index}_number`]) {
                                const newErrors = {...validationErrors};
                                delete newErrors[`teamMember_${index}_number`];
                                setValidationErrors(newErrors);
                              }
                            }}
                            className={`modal-member-input number-input ${validationErrors[`teamMember_${index}_number`] ? 'error' : ''}`}
                          />
                          {validationErrors[`teamMember_${index}_number`] && (
                            <span className="modal-error-message">{validationErrors[`teamMember_${index}_number`]}</span>
                          )}
                        </div>
                        {teamMembers.length > 1 && (
                          <button 
                            type="button"
                            className="modal-remove-member-button"
                            onClick={() => removeTeamMember(member.id)}
                            title="Remove Team Member"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      <div className="modal-member-row-row-2">
                        <div className="modal-member-size-wrapper">
                          <label className="modal-member-size-label">Shirt Size</label>
                          <select
                            value={member.jerseySize}
                            onChange={(e) => updateTeamMember(index, 'jerseySize', e.target.value)}
                            className="modal-member-select"
                          >
                            {sizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="modal-member-size-wrapper">
                          <label className="modal-member-size-label">Short Size</label>
                          <select
                            value={member.shortsSize}
                            onChange={(e) => updateTeamMember(index, 'shortsSize', e.target.value)}
                            className="modal-member-select"
                          >
                            {sizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Size Type Toggle - Only for Apparel */}
            {isApparel && !isTeamOrder && (
              <div className="modal-size-type-section">
                <div className="modal-size-type-label">SIZE TYPE <a href="#" onClick={(e) => { e.preventDefault(); setShowSizeChart(true); }} className="modal-size-chart-link">Size chart</a></div>
                <div className="modal-size-type-buttons">
                  <button
                    className={`modal-size-type-button ${sizeType === 'adult' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('adult');
                      setSingleOrderDetails({...singleOrderDetails, jerseySize: 'M', shortsSize: 'M'});
                    }}
                  >
                    Adult
                  </button>
                  <button
                    className={`modal-size-type-button ${sizeType === 'kids' ? 'active' : ''}`}
                    onClick={() => {
                      setSizeType('kids');
                      setSingleOrderDetails({...singleOrderDetails, jerseySize: 'M', shortsSize: 'M'});
                    }}
                  >
                    Kids
                  </button>
                </div>
              </div>
            )}

            {/* Single Order Form - Only for Apparel */}
            {isApparel && !isTeamOrder && (
              <div className="modal-single-order-section">
                <div className="modal-single-order-label">Order Details</div>
                <div className="modal-single-order-form">
                  {/* Row 1: Team Name - Full Width */}
                  <div className="modal-input-wrapper modal-single-order-form-row-1">
                    <input
                      type="text"
                      placeholder="Team Name"
                      value={singleOrderDetails.teamName}
                      onChange={(e) => {
                        setSingleOrderDetails({...singleOrderDetails, teamName: e.target.value});
                        if (validationErrors.singleTeamName) {
                          setValidationErrors({...validationErrors, singleTeamName: ''});
                        }
                      }}
                      className={`modal-single-order-input ${validationErrors.singleTeamName ? 'error' : ''}`}
                    />
                    {validationErrors.singleTeamName && (
                      <span className="modal-error-message">{validationErrors.singleTeamName}</span>
                    )}
                  </div>
                  
                  {/* Row 2: Surname and Jersey No. - Side by Side */}
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="Surname"
                      value={singleOrderDetails.surname}
                      onChange={(e) => {
                        setSingleOrderDetails({...singleOrderDetails, surname: e.target.value});
                        if (validationErrors.singleSurname) {
                          setValidationErrors({...validationErrors, singleSurname: ''});
                        }
                      }}
                      className={`modal-single-order-input ${validationErrors.singleSurname ? 'error' : ''}`}
                    />
                    {validationErrors.singleSurname && (
                      <span className="modal-error-message">{validationErrors.singleSurname}</span>
                    )}
                  </div>
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="Jersey No."
                      value={singleOrderDetails.number}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Check if user tried to enter non-numeric characters
                        if (inputValue && /[^\d]/.test(inputValue)) {
                          setValidationErrors({...validationErrors, singleNumber: 'Numbers only'});
                        } else if (validationErrors.singleNumber === 'Numbers only') {
                          setValidationErrors({...validationErrors, singleNumber: ''});
                        }
                        // Only allow numbers
                        const value = inputValue.replace(/[^\d]/g, '');
                        setSingleOrderDetails({...singleOrderDetails, number: value});
                        // Clear required error when typing
                        if (validationErrors.singleNumber === 'Required' && value) {
                          setValidationErrors({...validationErrors, singleNumber: ''});
                        }
                      }}
                      className={`modal-single-order-input ${validationErrors.singleNumber ? 'error' : ''}`}
                    />
                    {validationErrors.singleNumber && (
                      <span className="modal-error-message">{validationErrors.singleNumber}</span>
                    )}
                  </div>
                  
                  {/* Row 3: Shirt Size and Short Size - With Labels */}
                  <div className="modal-single-order-size-wrapper">
                    <label className="modal-single-order-size-label">Shirt Size</label>
                    <select
                      value={singleOrderDetails.jerseySize}
                      onChange={(e) => setSingleOrderDetails({...singleOrderDetails, jerseySize: e.target.value})}
                      className="modal-single-order-select"
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-single-order-size-wrapper">
                    <label className="modal-single-order-size-label">Short Size</label>
                    <select
                      value={singleOrderDetails.shortsSize}
                      onChange={(e) => setSingleOrderDetails({...singleOrderDetails, shortsSize: e.target.value})}
                      className="modal-single-order-select"
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Ball Details Form - Hidden (balls can be added without size selection) */}

            {/* Trophy Details Form */}
            {isTrophy && (
              <div className="modal-trophy-details-section">
                <div className="modal-trophy-details-label">Trophy Details</div>
                <div className="modal-trophy-details-form">
                  <div className="modal-input-wrapper">
                    <select
                      value={trophyDetails.size}
                      onChange={(e) => {
                        setTrophyDetails({...trophyDetails, size: e.target.value});
                        if (validationErrors.trophySize) {
                          setValidationErrors({...validationErrors, trophySize: ''});
                        }
                      }}
                      className={`modal-trophy-details-input ${validationErrors.trophySize ? 'error' : ''}`}
                    >
                      <option value="">Select Size</option>
                      {trophySizeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {validationErrors.trophySize && (
                      <span className="modal-error-message">{validationErrors.trophySize}</span>
                    )}
                  </div>
                  <textarea
                    placeholder="Engraving Text (Optional)"
                    value={trophyDetails.engravingText}
                    onChange={(e) => setTrophyDetails({...trophyDetails, engravingText: e.target.value})}
                    className="modal-trophy-details-textarea"
                    rows={3}
                  />
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="Occasion (e.g., Championship 2025)"
                      value={trophyDetails.occasion}
                      onChange={(e) => {
                        setTrophyDetails({...trophyDetails, occasion: e.target.value});
                        if (validationErrors.trophyOccasion) {
                          setValidationErrors({...validationErrors, trophyOccasion: ''});
                        }
                      }}
                      className={`modal-trophy-details-input ${validationErrors.trophyOccasion ? 'error' : ''}`}
                    />
                    {validationErrors.trophyOccasion && (
                      <span className="modal-error-message">{validationErrors.trophyOccasion}</span>
                    )}
                  </div>
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
      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
      />
    </div>
  );
};

export default ProductModal;
