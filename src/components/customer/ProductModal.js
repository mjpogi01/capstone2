import React, { useState, useEffect, useCallback } from 'react';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
import CheckoutModal from './CheckoutModal';
import SizeChartModal from './SizeChartModal';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderService from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import './ProductModal.css';

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
      ? existingCartItemData.teamMembers.map(member => ({
          ...member,
          id: member.id || Date.now() + Math.random(),
          teamName: member.teamName || member.team_name || '',
          surname: member.surname || '',
          number: member.number || member.jerseyNo || member.jerseyNumber || '',
          jerseySize: member.jerseySize || member.size || 'M',
          shortsSize: member.shortsSize || member.size || 'M'
        }))
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
      console.log('🛒 ProductModal: Buy Now item set:', buyNowItem.name);
    }
  }, [buyNowItem]);

  // Define loadProductReviews first (before useEffect that calls it)
  const loadProductReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      // Fetch reviews specifically for this product
      const productReviews = await orderService.getProductReviews(product.id);
      
      console.log('📦 Loaded reviews for product', product.id, ':', productReviews.length, 'reviews');
      
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
      // Ensure each team member has all required fields with default values
      const loadedTeamMembers = existingCartItemData.teamMembers || [];
      const normalizedTeamMembers = loadedTeamMembers.map(member => ({
        ...member,
        id: member.id || Date.now() + Math.random(),
        teamName: member.teamName || member.team_name || '',
        surname: member.surname || '',
        number: member.number || member.jerseyNo || member.jerseyNumber || '',
        jerseySize: member.jerseySize || member.size || 'M',
        shortsSize: member.shortsSize || member.size || 'M'
      }));
      setTeamMembers(normalizedTeamMembers.length > 0 ? normalizedTeamMembers : [{ id: Date.now(), teamName: '', surname: '', number: '', jerseySize: 'M', shortsSize: 'M' }]);
      setTeamName(existingCartItemData.teamMembers?.[0]?.teamName || existingCartItemData.teamMembers?.[0]?.team_name || '');
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

  // Constants for sizes - defined before early return so hooks can use them
  const adultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const kidsSizes = ['S6', 'S8', 'S10', 'S12', 'S14'];
  const trophySizes = Array.from({ length: 12 }, (_, i) => (i + 10).toString()); // 10 to 21 inches
  
  // Get available sizes from product, or fall back to default sizes
  const getAvailableSizes = useCallback(() => {
    const isTrophyCategory = product?.category?.toLowerCase() === 'trophies';
    
    // For trophies, prioritize product-specific available_sizes
    if (isTrophyCategory) {
      // Check if product has available_sizes stored
      if (product?.available_sizes) {
        let productSizes = [];
        if (Array.isArray(product.available_sizes)) {
          productSizes = product.available_sizes;
        } else if (typeof product.available_sizes === 'string' && product.available_sizes.trim()) {
          productSizes = product.available_sizes.split(',').map(s => s.trim()).filter(s => s);
        }
        
        // If admin has selected specific sizes, use ONLY those sizes
        if (productSizes.length > 0) {
          // Sort trophy sizes numerically for better UX
          return productSizes.sort((a, b) => parseInt(a) - parseInt(b));
        }
      }
      // If no sizes selected by admin, fall back to default trophy sizes
      return trophySizes;
    }
    
    // For other categories (apparel, balls, etc.)
    if (product?.available_sizes) {
      let productSizes = [];
      if (Array.isArray(product.available_sizes)) {
        productSizes = product.available_sizes;
      } else if (typeof product.available_sizes === 'string' && product.available_sizes.trim()) {
        productSizes = product.available_sizes.split(',').map(s => s.trim()).filter(s => s);
      }
      
      if (productSizes.length > 0) {
        // For apparel, still use sizeType to filter
        const isApparel = product?.category?.toLowerCase() !== 'balls';
        if (isApparel) {
          const defaultSizes = sizeType === 'adult' ? adultSizes : kidsSizes;
          // Return intersection of product sizes and default sizes, or just product sizes if all match
          return productSizes.filter(s => defaultSizes.includes(s)).length > 0 
            ? productSizes.filter(s => defaultSizes.includes(s))
            : productSizes;
        }
        return productSizes;
      }
    }
    
    // Fall back to default sizes for non-trophy categories
    return sizeType === 'adult' ? adultSizes : kidsSizes;
  }, [product?.available_sizes, product?.category, sizeType, trophySizes, adultSizes, kidsSizes]);
  
  // Calculate sizes reactively based on product available_sizes and sizeType
  const sizes = React.useMemo(() => {
    if (!product) return adultSizes; // Default fallback if product is null
    return getAvailableSizes();
  }, [getAvailableSizes, product, adultSizes]);

  if (!isOpen || !product) return null;

  // Determine product category
  const isBall = product.category?.toLowerCase() === 'balls';
  const isTrophy = product.category?.toLowerCase() === 'trophies';
  const isApparel = !isBall && !isTrophy;

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

      console.log('🛒 handleAddToCart called for product:', product.name, 'ID:', product.id);

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
      
      // Validate trophy details - all fields required
      if (isTrophy) {
        if (!trophyDetails.size || !trophyDetails.size.trim()) {
          errors.trophySize = 'Required';
        }
        if (!trophyDetails.engravingText || !trophyDetails.engravingText.trim()) {
          errors.trophyEngravingText = 'Required';
        }
        if (!trophyDetails.occasion || !trophyDetails.occasion.trim()) {
          errors.trophyOccasion = 'Required';
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
      
      // Get team name from first member or main teamName state - preserve exact value
      const finalTeamName = isTeamOrder && teamMembers.length > 0 
        ? (teamMembers[0]?.teamName || teamName || '')
        : null;

      console.log('🛒 Final team name before adding to cart:', finalTeamName);
      console.log('🛒 First member teamName:', teamMembers[0]?.teamName);
      console.log('🛒 Main teamName state:', teamName);
      console.log('🛒 All team members:', teamMembers);

      const cartOptions = {
        size: selectedSize,
        quantity: isTeamOrder ? teamMembers.length : quantity,
        isTeamOrder: isTeamOrder,
        teamMembers: isTeamOrder ? teamMembers : null,
        teamName: finalTeamName, // Use team name from first member or main state - preserve exact case
        singleOrderDetails: !isTeamOrder && isApparel ? singleOrderDetails : null,
        sizeType: sizeType,
        price: finalPrice, // Use discounted price for kids
        isReplacement: isFromCart, // Mark as replacement when coming from cart
        category: product.category, // Include category
        ballDetails: isBall ? ballDetails : null,
        trophyDetails: isTrophy ? trophyDetails : null
      };

      console.log('🛒 Cart options:', cartOptions);

      // Use onConfirm callback if provided (for wishlist), otherwise continue with regular flow
      if (onConfirm) {
        console.log('🛒 Using onConfirm callback');
        onConfirm(product, cartOptions);
        return;
      }

      // Use callback if provided (for walk-in ordering), otherwise use context
      if (onAddToCart) {
        console.log('🛒 Using onAddToCart callback');
        onAddToCart(product, cartOptions);
        onClose();
        return;
      }

      if (!user) {
        showError('Login Required', 'Please log in to add items to cart.');
        return;
      }

      console.log('🛒 Adding to cart for user:', user.id);

      // If this is from cart, remove the existing item first
      if (isFromCart && existingCartItemId) {
        console.log('🛒 Removing existing cart item:', existingCartItemId);
        await removeFromCart(existingCartItemId);
        // Add a small delay to ensure the removal is processed
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('🛒 Calling addToCart context function');
      await addToCart(product, cartOptions);
      
      console.log('✅ Item added to cart successfully');
      // The notification is already handled by CartContext
      // Close the modal after adding to cart
      onClose();
    } catch (error) {
      console.error('❌ Error updating cart:', error);
      
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
      
      // Validate trophy details for Buy Now - all fields required
      if (isTrophy) {
        if (!trophyDetails.size || !trophyDetails.size.trim()) {
          errors.trophySize = 'Required';
        }
        if (!trophyDetails.engravingText || !trophyDetails.engravingText.trim()) {
          errors.trophyEngravingText = 'Required';
        }
        if (!trophyDetails.occasion || !trophyDetails.occasion.trim()) {
          errors.trophyOccasion = 'Required';
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
    const newMember = {
      id: Date.now() + Math.random(), // Ensure unique ID
      teamName: teamName || '',
      surname: '',
      number: '',
      jerseySize: 'M',
      shortsSize: 'M'
    };
    setTeamMembers([...teamMembers, newMember]);
    console.log('✅ New team member row added with ID:', newMember.id);
  };

  const updateTeamMember = (index, field, value) => {
    setTeamMembers(prev => {
      const updated = prev.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      );
      if (field === 'surname') {
        console.log(`📝 Updating surname for member ${index}:`, value);
        console.log('📋 All member surnames:', updated.map((m, idx) => `Member ${idx}: "${m.surname}"`));
      }
      return updated;
    });
  };

  const removeTeamMember = (id) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    console.log('✅ Team member row removed');
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

                {/* Team Members Roster - Multiple Input Rows */}
                <div className="modal-members-roster">
                  {teamMembers.map((member, index) => (
                    <div key={member.id} className="team-order-form-card">
                      {/* Row 1: Team Name Only */}
                      <div className="team-order-form-row-1">
                        <div className="team-order-form-input-wrapper team-order-form-teamname-wrapper">
                          <input
                            type="text"
                            placeholder="TEAM NAME"
                            value={member.teamName || teamName}
                            onChange={(e) => {
                              const newTeamName = e.target.value; // Preserve exact input value
                              console.log('📝 Team name input changed:', newTeamName);
                              updateTeamMember(index, 'teamName', newTeamName);
                              // Update the main team name to match the first member's team name
                              // If this is the first member, or if all members should share the same team name
                              if (index === 0 || teamMembers.length === 1) {
                                setTeamName(newTeamName);
                                console.log('📝 Updated main teamName state:', newTeamName);
                              }
                              // If this is not the first member, update first member's teamName too
                              if (index !== 0 && teamMembers.length > 0) {
                                updateTeamMember(0, 'teamName', newTeamName);
                                setTeamName(newTeamName);
                                console.log('📝 Updated first member and main teamName:', newTeamName);
                              }
                            }}
                            className="team-order-form-input team-order-form-teamname-input"
                          />
                        </div>
                        {teamMembers.length > 1 && (
                          <button 
                            type="button"
                            className="team-order-form-remove-btn"
                            onClick={() => removeTeamMember(member.id)}
                            title="Remove Team Member"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      
                      {/* Row 2: Jersey No. and Surname */}
                      <div className="team-order-form-row-2">
                        <div className="team-order-form-input-wrapper team-order-form-jerseyno-wrapper">
                          <input
                            type="text"
                            placeholder="JERSEY NO."
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
                            className={`team-order-form-input team-order-form-jerseyno-input ${validationErrors[`teamMember_${index}_number`] ? 'error' : ''}`}
                          />
                          {validationErrors[`teamMember_${index}_number`] && (
                            <span className="team-order-form-error-message">{validationErrors[`teamMember_${index}_number`]}</span>
                          )}
                        </div>
                        <div className="team-order-form-input-wrapper team-order-form-surname-wrapper">
                          <input
                            type="text"
                            placeholder="SURNAME"
                            value={member.surname || ''}
                            onChange={(e) => {
                              updateTeamMember(index, 'surname', e.target.value);
                              if (validationErrors[`teamMember_${index}_surname`]) {
                                const newErrors = {...validationErrors};
                                delete newErrors[`teamMember_${index}_surname`];
                                setValidationErrors(newErrors);
                              }
                            }}
                            className={`team-order-form-input team-order-form-surname-input ${validationErrors[`teamMember_${index}_surname`] ? 'error' : ''}`}
                          />
                          {validationErrors[`teamMember_${index}_surname`] && (
                            <span className="team-order-form-error-message">{validationErrors[`teamMember_${index}_surname`]}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Row 3: Jersey Size and Shorts Size Dropdowns */}
                      <div className="team-order-form-row-3">
                        <div className="team-order-form-size-wrapper team-order-form-jerseysize-wrapper">
                          <label className="team-order-form-size-label">JERSEY SIZE</label>
                          <select
                            value={member.jerseySize || member.size || 'M'}
                            onChange={(e) => updateTeamMember(index, 'jerseySize', e.target.value)}
                            className="team-order-form-select team-order-form-jerseysize-select"
                          >
                            {sizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="team-order-form-size-wrapper team-order-form-shortssize-wrapper">
                          <label className="team-order-form-size-label">SHORTS SIZE</label>
                          <select
                            value={member.shortsSize || member.size || 'M'}
                            onChange={(e) => updateTeamMember(index, 'shortsSize', e.target.value)}
                            className="team-order-form-select team-order-form-shortssize-select"
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
              <div className="single-order-form-section">
                <div className="single-order-form-card">
                  {/* Row 1: Team Name Only */}
                  <div className="single-order-form-row-1">
                    <div className="single-order-form-input-wrapper single-order-form-teamname-wrapper">
                      <input
                        type="text"
                        placeholder="TEAM NAME"
                        value={singleOrderDetails.teamName}
                        onChange={(e) => {
                          setSingleOrderDetails({...singleOrderDetails, teamName: e.target.value});
                          if (validationErrors.singleTeamName) {
                            setValidationErrors({...validationErrors, singleTeamName: ''});
                          }
                        }}
                        className={`single-order-form-input single-order-form-teamname-input ${validationErrors.singleTeamName ? 'error' : ''}`}
                      />
                      {validationErrors.singleTeamName && (
                        <span className="single-order-form-error-message">{validationErrors.singleTeamName}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Row 2: Jersey No. and Surname */}
                  <div className="single-order-form-row-2">
                    <div className="single-order-form-input-wrapper single-order-form-jerseyno-wrapper">
                      <input
                        type="text"
                        placeholder="JERSEY NO."
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
                        className={`single-order-form-input single-order-form-jerseyno-input ${validationErrors.singleNumber ? 'error' : ''}`}
                      />
                      {validationErrors.singleNumber && (
                        <span className="single-order-form-error-message">{validationErrors.singleNumber}</span>
                      )}
                    </div>
                    <div className="single-order-form-input-wrapper single-order-form-surname-wrapper">
                      <input
                        type="text"
                        placeholder="SURNAME"
                        value={singleOrderDetails.surname}
                        onChange={(e) => {
                          setSingleOrderDetails({...singleOrderDetails, surname: e.target.value});
                          if (validationErrors.singleSurname) {
                            setValidationErrors({...validationErrors, singleSurname: ''});
                          }
                        }}
                        className={`single-order-form-input single-order-form-surname-input ${validationErrors.singleSurname ? 'error' : ''}`}
                      />
                      {validationErrors.singleSurname && (
                        <span className="single-order-form-error-message">{validationErrors.singleSurname}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Row 3: Jersey Size and Shorts Size Dropdowns */}
                  <div className="single-order-form-row-3">
                    <div className="single-order-form-size-wrapper single-order-form-jerseysize-wrapper">
                      <label className="single-order-form-size-label">JERSEY SIZE</label>
                      <select
                        value={singleOrderDetails.jerseySize || singleOrderDetails.size || 'M'}
                        onChange={(e) => setSingleOrderDetails({...singleOrderDetails, jerseySize: e.target.value})}
                        className="single-order-form-select single-order-form-jerseysize-select"
                      >
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div className="single-order-form-size-wrapper single-order-form-shortssize-wrapper">
                      <label className="single-order-form-size-label">SHORTS SIZE</label>
                      <select
                        value={singleOrderDetails.shortsSize || singleOrderDetails.size || 'M'}
                        onChange={(e) => setSingleOrderDetails({...singleOrderDetails, shortsSize: e.target.value})}
                        className="single-order-form-select single-order-form-shortssize-select"
                      >
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ball Details Form - Hidden (balls can be added without size selection) */}

            {/* Trophy Details Form */}
            {isTrophy && (
              <div className="modal-trophy-details-section">
                <div className="modal-trophy-details-label">TROPHY DETAILS</div>
                <div className="modal-trophy-details-form">
                  <div className="modal-input-wrapper">
                    <select
                      value={trophyDetails.size}
                      onChange={(e) => setTrophyDetails({...trophyDetails, size: e.target.value})}
                      className={`modal-trophy-details-input ${validationErrors.trophySize ? 'error' : ''}`}
                    >
                      <option value="">Select Size *</option>
                      {sizes && sizes.length > 0 ? (
                        sizes.map(size => (
                          <option key={size} value={`${size}"`}>
                            {size}" {size === '10' ? '(Small)' : size === '12' ? '(Medium)' : size === '14' ? '(Large)' : size === '16' ? '(Extra Large)' : size === '18' ? '(Premium)' : size === '20' ? '(Large Premium)' : size === '21' ? '(Ultra Premium)' : ''}
                          </option>
                        ))
                      ) : (
                        // Fallback - should only show if admin didn't select any sizes
                        product?.available_sizes ? null : (
                          <>
                            <option value='10"'>10" (Small)</option>
                            <option value='12"'>12" (Medium)</option>
                            <option value='14"'>14" (Large)</option>
                            <option value='16"'>16" (Extra Large)</option>
                            <option value='18"'>18" (Premium)</option>
                            <option value='21"'>21" (Ultra Premium)</option>
                          </>
                        )
                      )}
                    </select>
                    {validationErrors.trophySize && (
                      <span className="modal-error-message">{validationErrors.trophySize}</span>
                    )}
                  </div>
                  <div className="modal-input-wrapper">
                    <textarea
                      placeholder="Engraving Text *"
                      value={trophyDetails.engravingText}
                      onChange={(e) => setTrophyDetails({...trophyDetails, engravingText: e.target.value})}
                      className={`modal-trophy-details-textarea ${validationErrors.trophyEngravingText ? 'error' : ''}`}
                      rows={3}
                    />
                    {validationErrors.trophyEngravingText && (
                      <span className="modal-error-message">{validationErrors.trophyEngravingText}</span>
                    )}
                  </div>
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="Occasion (e.g., Championship 2025) *"
                      value={trophyDetails.occasion}
                      onChange={(e) => setTrophyDetails({...trophyDetails, occasion: e.target.value})}
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