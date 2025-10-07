import React, { useState } from 'react';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaFacebook } from 'react-icons/fa';
import CheckoutModal from './CheckoutModal';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isTeamOrder, setIsTeamOrder] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ surname: '', number: '', size: 'M' });
  const [singleOrderDetails, setSingleOrderDetails] = useState({ surname: '', number: '', size: 'M' });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  if (!isOpen || !product) return null;

  // Determine what fields are needed based on product category
  const getOrderFields = () => {
    if (!product.category) return { needsSize: false, needsNumber: false, needsSurname: true };
    
    const category = product.category.toLowerCase();
    
    // Accessories that don't need sizes or numbers
    if (['trophies', 'medals', 'awards', 'certificates'].includes(category)) {
      return { needsSize: false, needsNumber: false, needsSurname: true };
    }
    
    // Balls and equipment that might need customization but no size
    if (['balls', 'equipment', 'accessories'].includes(category)) {
      return { needsSize: false, needsNumber: true, needsSurname: true };
    }
    
    // Clothing items that need all fields
    if (['jerseys', 't-shirts', 'long sleeves', 'hoodies', 'uniforms', 'replicated'].includes(category)) {
      return { needsSize: true, needsNumber: true, needsSurname: true };
    }
    
    // Default for unknown categories
    return { needsSize: true, needsNumber: true, needsSurname: true };
  };

  const orderFields = getOrderFields();

  // Mock reviews data - in a real app, this would come from an API
  const reviews = [
    {
      id: 1,
      user: "John D.",
      rating: 5,
      comment: "Excellent quality! The jersey fits perfectly and the material is very comfortable.",
      date: "2024-01-15"
    },
    {
      id: 2,
      user: "Maria S.",
      rating: 4,
      comment: "Great product, fast shipping. Would definitely order again.",
      date: "2024-01-10"
    },
    {
      id: 3,
      user: "Carlos M.",
      rating: 5,
      comment: "Amazing design and quality. Perfect for basketball games!",
      date: "2024-01-08"
    },
    {
      id: 4,
      user: "Sarah L.",
      rating: 5,
      comment: "Love the fit and quality. Great value for money!",
      date: "2024-01-05"
    },
    {
      id: 5,
      user: "Mike R.",
      rating: 4,
      comment: "Good product, fast delivery. Would recommend to others.",
      date: "2024-01-02"
    }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      size: product.size || (orderFields.needsSize ? singleOrderDetails.size : null),
      quantity: isTeamOrder ? teamMembers.length : quantity,
      isTeamOrder: isTeamOrder,
      teamMembers: isTeamOrder ? teamMembers : null,
      singleOrderDetails: (!product.size || orderFields.needsSurname) && !isTeamOrder ? singleOrderDetails : null
    };
    onAddToCart(cartItem);
    const orderType = isTeamOrder ? 'Team Order' : 'Individual';
    const memberCount = isTeamOrder ? teamMembers.length : quantity;
    
    // Build order details based on what fields are needed
    let orderDetails = '';
    if ((!product.size || orderFields.needsSurname) && !isTeamOrder) {
      const details = [];
      if (orderFields.needsSurname && singleOrderDetails.surname) details.push(`Name: ${singleOrderDetails.surname}`);
      if (orderFields.needsNumber && singleOrderDetails.number) details.push(`Number: ${singleOrderDetails.number}`);
      if (orderFields.needsSize && singleOrderDetails.size) details.push(`Size: ${singleOrderDetails.size}`);
      if (details.length > 0) orderDetails = `\nOrder Details: ${details.join(' - ')}`;
    }
    
    const sizeInfo = product.size ? selectedSize : (orderFields.needsSize ? singleOrderDetails.size : 'N/A');
    alert(`Added ${memberCount} ${product.name}${orderFields.needsSize ? ` (Size: ${sizeInfo})` : ''} to cart!\nOrder Type: ${orderType}${orderDetails}`);
  };

  const handleBuyNow = () => {
    const cartItem = {
      ...product,
      size: product.size || (orderFields.needsSize ? singleOrderDetails.size : null),
      quantity: isTeamOrder ? teamMembers.length : quantity,
      isTeamOrder: isTeamOrder,
      teamMembers: isTeamOrder ? teamMembers : null,
      singleOrderDetails: (!product.size || orderFields.needsSurname) && !isTeamOrder ? singleOrderDetails : null
    };
    
    // Add to cart and show checkout
    setCartItems([cartItem]);
    setShowCheckout(true);
  };

  const handleTeamOrderToggle = () => {
    setIsTeamOrder(!isTeamOrder);
    if (!isTeamOrder) {
      setTeamMembers([]);
    }
  };

  const handlePlaceOrder = (orderData) => {
    console.log('Order placed:', orderData);
    alert('Order placed successfully! We will contact you soon for confirmation.');
    setShowCheckout(false);
    onClose();
  };

  const addTeamMember = () => {
    if (newMember.surname.trim()) {
      const member = {
        id: Date.now(),
        surname: newMember.surname.trim(),
        number: newMember.number.trim(),
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

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="modal-content">
          {/* Left Section - Product Image and Details */}
          <div className="left-section">
            <div className="product-image-container">
              {product.main_image ? (
                <img 
                  src={product.main_image} 
                  alt={product.name}
                  className="product-image-large"
                />
              ) : (
                <div className="product-placeholder">
                  <span className="product-emoji-large">🏀</span>
                </div>
              )}
            </div>
            
            <div className="product-title-section">
              <h1 className="product-title">{product.name}</h1>
              <p className="product-subtitle">SUBLIMATION JERSEY</p>
              <p className="product-disclaimer">
                Please note actual colours may vary. It's important to note that they may look different on a real product than what you see on your monitor. We try to edit our photos to show the products as life-like as possible, but please understand the actual colour may vary slightly from your monitor.
              </p>
            </div>

            <div className="brand-logo">
              <div className="crown-icon">👑</div>
              <div className="brand-text">
                <div className="brand-name">YOHANNS</div>
                <div className="brand-subtitle">Sportswear House</div>
              </div>
            </div>

            <div className="contact-info">
              <div className="facebook-link">
                <FaFacebook className="facebook-icon" />
                <span>MIZAEL ARCED / PRINCE YOHANN ARCED / YOHANNS SPORTSWEAR HOUSE FB PAGE</span>
              </div>
              <div className="phone-numbers">
                <span>09123456789 / 09876543210 / 09111222333</span>
              </div>
            </div>
          </div>

          {/* Right Section - Product Configuration */}
          <div className="right-section">
            <div className="product-header">
              <h2 className="product-brand">YOHANN'S SPORTSWEAR</h2>
              <h1 className="product-name">{product.name}</h1>
              <div className="product-price">₱ {parseFloat(product.price).toFixed(2)}</div>
            </div>

            {/* Size Selection */}
            <div className="size-selection">
              <label className="size-label">SIZE</label>
              <div className="size-buttons">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Order Toggle */}
            <div className="team-order-toggle">
              <label className="team-order-checkbox">
                <input
                  type="checkbox"
                  checked={isTeamOrder}
                  onChange={handleTeamOrderToggle}
                />
                <span className="checkmark"></span>
                <FaUsers className="team-icon" />
                Team Orders
              </label>
            </div>

            {/* Team Members Section */}
            {isTeamOrder && (
              <div className="team-members-section">
                <label className="team-members-label">Team Members</label>
                
                {/* Add New Member */}
                <div className="add-member-form">
                  <div className="member-input-row">
                    <input
                      type="text"
                      placeholder="Surname"
                      value={newMember.surname}
                      onChange={(e) => setNewMember({...newMember, surname: e.target.value})}
                      className="member-input"
                    />
                    <input
                      type="text"
                      placeholder="#"
                      value={newMember.number}
                      onChange={(e) => setNewMember({...newMember, number: e.target.value})}
                      className="member-input number-input"
                    />
                    <select
                      value={newMember.size}
                      onChange={(e) => setNewMember({...newMember, size: e.target.value})}
                      className="member-select"
                    >
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <button 
                      className="add-member-btn"
                      onClick={addTeamMember}
                      disabled={!newMember.surname.trim()}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="team-members-list">
                  {teamMembers.map(member => (
                    <div key={member.id} className="team-member-item">
                      <span className="member-name">{member.surname}</span>
                      <span className="member-number">#{member.number}</span>
                      <span className="member-size">Size: {member.size}</span>
                      <button 
                        className="remove-member-btn"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            {!isTeamOrder && (
              <div className="quantity-selection">
                <label className="quantity-label">QUANTITY</label>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
              >
                <FaShoppingCart />
                ADD TO CART
              </button>
              <button 
                className="buy-now-btn"
                onClick={handleBuyNow}
              >
                <FaCreditCard />
                BUY NOW
              </button>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="product-description-section">
          <div className="description-header" onClick={toggleDescription}>
            <span className="description-title">PRODUCT DESCRIPTION</span>
            <FaChevronDown className="description-chevron" />
          </div>
          {isDescriptionExpanded && (
            <div className="description-content">
              <p>{product.description || 'High-quality sportswear designed for comfort and performance.'}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};

export default ProductModal;
