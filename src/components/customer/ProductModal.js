import React, { useState } from 'react';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isTeamOrder, setIsTeamOrder] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ surname: '', number: '', size: 'M' });
  const [singleOrderDetails, setSingleOrderDetails] = useState({ surname: '', number: '', size: 'M' });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

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

  if (!isOpen || !product) return null;

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
    alert(`Proceeding to checkout with ${memberCount} ${product.name}${orderFields.needsSize ? ` (Size: ${sizeInfo})` : ''}\nOrder Type: ${orderType}\nTotal: ${product.price}${orderDetails}`);
    onAddToCart(cartItem);
    onClose();
  };

  const handleTeamOrderToggle = () => {
    setIsTeamOrder(!isTeamOrder);
    if (!isTeamOrder) {
      setTeamMembers([]);
    }
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
          {/* Product Image Section */}
          <div className="product-image-section">
            <div className="product-image-container">
              {product.main_image ? (
                <img 
                  src={product.main_image} 
                  alt={product.name}
                  className="product-image-large"
                />
              ) : (
                <span className="product-emoji-large">🏀</span>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="product-details-section">
            <div className="product-header">
              <h2 className="product-brand">Yohann's Sportswear</h2>
              <h1 className="product-title">{product.name}</h1>
              <div className="product-price-large">
                ₱ {parseFloat(product.price).toFixed(2)}
              </div>
            </div>

            {/* Product Description */}
            <div className="product-description">
              <div className="description-header" onClick={toggleDescription}>
                <h3>Description</h3>
                <button className="description-toggle-btn">
                  {isDescriptionExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {isDescriptionExpanded && (
                <div className="description-content">
                  <p>
                    {product.description || 'High-quality sportswear designed for comfort and performance. Made with premium materials that provide excellent breathability and durability. Perfect for sports activities, training sessions, and casual wear.'}
                  </p>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {product.size && (
              <div className="size-selection">
                <h3>Size</h3>
                <div className="size-options">
                  {sizes.map(size => (
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
            )}
            
            {(!product.size || orderFields.needsSurname) && !isTeamOrder && (
              <div className="single-order-form">
                <h3>Order Details</h3>
                <div className={`order-form-row ${!orderFields.needsSize && !orderFields.needsNumber ? 'single-column' : ''}`}>
                  {orderFields.needsSurname && (
                    <div className="form-group">
                      <label>Surname</label>
                      <input
                        type="text"
                        placeholder="Enter surname"
                        value={singleOrderDetails.surname}
                        onChange={(e) => setSingleOrderDetails({...singleOrderDetails, surname: e.target.value})}
                        className="order-input"
                      />
                    </div>
                  )}
                  {orderFields.needsNumber && (
                    <div className="form-group">
                      <label>Number</label>
                      <input
                        type="text"
                        placeholder="Enter number"
                        value={singleOrderDetails.number}
                        onChange={(e) => setSingleOrderDetails({...singleOrderDetails, number: e.target.value})}
                        className="order-input"
                      />
                    </div>
                  )}
                  {orderFields.needsSize && (
                    <div className="form-group">
                      <label>Size</label>
                      <select
                        value={singleOrderDetails.size}
                        onChange={(e) => setSingleOrderDetails({...singleOrderDetails, size: e.target.value})}
                        className="order-select"
                      >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                  )}
                </div>
                {!orderFields.needsSize && !orderFields.needsNumber && (
                  <div className="accessory-note">
                    <p>This item will be customized with your details.</p>
                  </div>
                )}
              </div>
            )}

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
                Team Order
              </label>
            </div>

            {/* Team Customization */}
            {isTeamOrder && (
              <div className="team-customization">
                <h3>Team Members ({teamMembers.length})</h3>
                
                {/* Add New Member */}
                <div className="add-member-form">
                  <div className="form-row">
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
                      {sizes.map(size => (
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
                      <div className="member-display">
                        <div className="member-info">
                          <span className="member-surname">{member.surname}</span>
                          {member.number && <span className="member-number">#{member.number}</span>}
                          <span className="member-size">Size: {member.size}</span>
                        </div>
                        <button 
                          className="remove-member-btn"
                          onClick={() => removeTeamMember(member.id)}
                          title="Remove member"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection (for individual orders) */}
            {!isTeamOrder && (
              <div className="quantity-selection">
                <h3>Quantity</h3>
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
                Add to Cart
              </button>
              <button 
                className="buy-now-btn"
                onClick={handleBuyNow}
              >
                <FaCreditCard />
                Buy Now
              </button>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
              <div className="reviews-header" onClick={toggleReviews}>
                <h3>Customer Reviews</h3>
                <button className="reviews-toggle-btn">
                  {isReviewsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              
              <div className="rating-summary">
                <div className="average-rating">
                  <span className="rating-number">{averageRating.toFixed(1)}</span>
                  <div className="rating-stars">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="rating-count">({reviews.length} reviews)</span>
                </div>
              </div>

              {isReviewsExpanded && (
                <div className="reviews-content">
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{review.user}</span>
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                          <span className="review-date">{review.date}</span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
