import React, { useState } from 'react';
import { FaShoppingCart, FaTimes, FaCreditCard, FaUsers, FaPlus, FaTrash, FaChevronDown, FaFacebook } from 'react-icons/fa';
import CheckoutModal from './CheckoutModal';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isTeamOrder, setIsTeamOrder] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ surname: '', number: '', size: 'M' });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  if (!isOpen || !product) return null;

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      size: selectedSize,
      quantity: isTeamOrder ? teamMembers.length : quantity,
      isTeamOrder: isTeamOrder,
      teamMembers: isTeamOrder ? teamMembers : null
    };
    onAddToCart(cartItem);
    const orderType = isTeamOrder ? 'Team Order' : 'Individual';
    const memberCount = isTeamOrder ? teamMembers.length : quantity;
    alert(`Added ${memberCount} ${product.name} (Size: ${selectedSize}) to cart!\nOrder Type: ${orderType}`);
  };

  const handleBuyNow = () => {
    const cartItem = {
      ...product,
      size: selectedSize,
      quantity: isTeamOrder ? teamMembers.length : quantity,
      isTeamOrder: isTeamOrder,
      teamMembers: isTeamOrder ? teamMembers : null
    };
    
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

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Main Modal Content - Single Container */}
        <div className="modal-main-content">
          {/* Left Panel - Product Image and Brand Info */}
          <div className="left-panel">
            {/* Product Image */}
            <div className="product-image-section">
              {product.main_image ? (
                <img 
                  src={product.main_image} 
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-image-placeholder">
                  <span className="product-emoji">🏀</span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <div className="product-title-section">
              <h1 className="product-title">HUSTLE</h1>
              <p className="product-subtitle">SUBLIMATION JERSEY</p>
              <p className="product-disclaimer">
                Please note actual colours may vary. It's important to note that they may look different on a real product than what you see on your monitor. We try to edit our photos to show the products as life-like as possible, but please understand the actual colour may vary slightly from your monitor.
              </p>
            </div>

            {/* Brand Logo */}
            <div className="brand-logo-section">
              <div className="crown-icon">👑</div>
              <div className="brand-text">
                <div className="brand-name">YOHANNS</div>
                <div className="brand-subtitle">Sportswear House</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="contact-info-section">
              <div className="facebook-contact">
                <FaFacebook className="facebook-icon" />
                <span>MIZAEL ARCED / PRINCE YOHANN ARCED / YOHANNS SPORTSWEAR HOUSE FB PAGE</span>
              </div>
              <div className="phone-contact">
                <span>09123456789 / 09876543210 / 09111222333</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Product Configuration */}
          <div className="right-panel">
            {/* Brand Header */}
            <div className="brand-header">YOHANN'S SPORTSWEAR</div>

            {/* Product Name */}
            <div className="product-name">PURPLE-YELLOW 'BONESIAN' JERSEY SET</div>

            {/* Price */}
            <div className="product-price">₱ 700.00</div>

            {/* Size Selection */}
            <div className="size-section">
              <div className="size-label">SIZE</div>
              <div className="size-buttons">
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

            {/* Team Orders Checkbox */}
            <div className="team-orders-section">
              <label className="team-orders-checkbox">
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
                <div className="team-members-label">Team Members</div>
                
                {/* Add New Member */}
                <div className="add-member-form">
                  <div className="member-inputs">
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

            {/* Quantity Section */}
            {!isTeamOrder && (
              <div className="quantity-section">
                <div className="quantity-label">QUANTITY</div>
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

            {/* Product Description */}
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