import React, { useState } from 'react';
import { FaTimes, FaCreditCard, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, onPlaceOrder }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    paymentMethod: 'cash'
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation functions
  const validateStep1 = () => {
    const errors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'province', 'postalCode'];
    
    requiredFields.forEach(field => {
      if (!customerInfo[field] || customerInfo[field].trim() === '') {
        errors[field] = 'This field is required';
      }
    });
    
    // Email validation
    if (customerInfo.email && !/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic)
    if (customerInfo.phone && !/^[\d\s\-\+\(\)]+$/.test(customerInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    // Check if there are any items
    if (cartItems.length === 0) {
      errors.items = 'No items in cart';
      setValidationErrors(errors);
      return false;
    }
    
    // Validate each item based on order type
    cartItems.forEach((item, index) => {
      if (item.isTeamOrder) {
        // Team order validation - at least 2 players required
        if (!item.teamMembers || item.teamMembers.length < 2) {
          errors[`item_${index}`] = 'Team orders require at least 2 players';
        } else {
          // Validate each team member
          item.teamMembers.forEach((member, memberIndex) => {
            if (!member.surname || member.surname.trim() === '') {
              errors[`member_${index}_${memberIndex}_surname`] = 'Player surname is required';
            }
            if (!member.number || member.number.trim() === '') {
              errors[`member_${index}_${memberIndex}_number`] = 'Player number is required';
            }
            if (!member.size || member.size.trim() === '') {
              errors[`member_${index}_${memberIndex}_size`] = 'Player size is required';
            }
          });
        }
      } else {
        // Single order validation - all custom fields must be filled if they exist
        if (item.singleOrderDetails) {
          if (item.singleOrderDetails.surname && item.singleOrderDetails.surname.trim() === '') {
            errors[`item_${index}_surname`] = 'Surname is required';
          }
          if (item.singleOrderDetails.number && item.singleOrderDetails.number.trim() === '') {
            errors[`item_${index}_number`] = 'Number is required';
          }
          if (item.singleOrderDetails.size && item.singleOrderDetails.size.trim() === '') {
            errors[`item_${index}_size`] = 'Size is required';
          }
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    const orderData = {
      customerInfo,
      items: cartItems,
      totalAmount,
      orderNotes,
      orderDate: new Date().toISOString()
    };
    
    onPlaceOrder(orderData);
    onClose();
  };

  const renderStep1 = () => (
    <div className="checkout-step">
      <h3>Customer Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={customerInfo.firstName}
            onChange={handleInputChange}
            required
            className={validationErrors.firstName ? 'error' : ''}
          />
          {validationErrors.firstName && (
            <span className="error-message">{validationErrors.firstName}</span>
          )}
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={customerInfo.lastName}
            onChange={handleInputChange}
            required
            className={validationErrors.lastName ? 'error' : ''}
          />
          {validationErrors.lastName && (
            <span className="error-message">{validationErrors.lastName}</span>
          )}
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={customerInfo.email}
            onChange={handleInputChange}
            required
            className={validationErrors.email ? 'error' : ''}
          />
          {validationErrors.email && (
            <span className="error-message">{validationErrors.email}</span>
          )}
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phone"
            value={customerInfo.phone}
            onChange={handleInputChange}
            required
            className={validationErrors.phone ? 'error' : ''}
          />
          {validationErrors.phone && (
            <span className="error-message">{validationErrors.phone}</span>
          )}
        </div>
        <div className="form-group full-width">
          <label>Address *</label>
          <input
            type="text"
            name="address"
            value={customerInfo.address}
            onChange={handleInputChange}
            required
            className={validationErrors.address ? 'error' : ''}
          />
          {validationErrors.address && (
            <span className="error-message">{validationErrors.address}</span>
          )}
        </div>
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={customerInfo.city}
            onChange={handleInputChange}
            required
            className={validationErrors.city ? 'error' : ''}
          />
          {validationErrors.city && (
            <span className="error-message">{validationErrors.city}</span>
          )}
        </div>
        <div className="form-group">
          <label>Province *</label>
          <input
            type="text"
            name="province"
            value={customerInfo.province}
            onChange={handleInputChange}
            required
            className={validationErrors.province ? 'error' : ''}
          />
          {validationErrors.province && (
            <span className="error-message">{validationErrors.province}</span>
          )}
        </div>
        <div className="form-group">
          <label>Postal Code *</label>
          <input
            type="text"
            name="postalCode"
            value={customerInfo.postalCode}
            onChange={handleInputChange}
            required
            className={validationErrors.postalCode ? 'error' : ''}
          />
          {validationErrors.postalCode && (
            <span className="error-message">{validationErrors.postalCode}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="checkout-step">
      <h3>Order Summary</h3>
      <div className="order-items">
        {cartItems.map((item, index) => (
          <div key={index} className="order-item">
            <div className="item-image">
              {item.main_image ? (
                <img src={item.main_image} alt={item.name} />
              ) : (
                <div className="placeholder-image">🏀</div>
              )}
            </div>
            <div className="item-details">
              <h4>{item.name}</h4>
              <p className="item-category">{item.category}</p>
              {item.size && <p className="item-size">Size: {item.size}</p>}
              {item.singleOrderDetails && (
                <div className="order-details">
                  {item.singleOrderDetails.surname && (
                    <p>Name: {item.singleOrderDetails.surname}</p>
                  )}
                  {item.singleOrderDetails.number && (
                    <p>Number: {item.singleOrderDetails.number}</p>
                  )}
                  {item.singleOrderDetails.size && (
                    <p>Size: {item.singleOrderDetails.size}</p>
                  )}
                </div>
              )}
              {item.isTeamOrder && item.teamMembers && (
                <div className="team-members">
                  <p>Team Members ({item.teamMembers.length}):</p>
                  <ul>
                    {item.teamMembers.map((member, idx) => (
                      <li key={idx}>
                        {member.surname} - #{member.number} - {member.size}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Validation errors for this item */}
              {validationErrors[`item_${index}`] && (
                <div className="validation-error">
                  <span className="error-message">{validationErrors[`item_${index}`]}</span>
                </div>
              )}
              {validationErrors[`item_${index}_surname`] && (
                <div className="validation-error">
                  <span className="error-message">{validationErrors[`item_${index}_surname`]}</span>
                </div>
              )}
              {validationErrors[`item_${index}_number`] && (
                <div className="validation-error">
                  <span className="error-message">{validationErrors[`item_${index}_number`]}</span>
                </div>
              )}
              {validationErrors[`item_${index}_size`] && (
                <div className="validation-error">
                  <span className="error-message">{validationErrors[`item_${index}_size`]}</span>
                </div>
              )}
            </div>
            <div className="item-price">
              <p>₱{parseFloat(item.price).toFixed(2)}</p>
              <p className="quantity">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="order-notes">
        <label>Order Notes (Optional)</label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Any special instructions or notes for your order..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="checkout-step">
      <h3>Payment & Confirmation</h3>
      <div className="payment-section">
        <div className="payment-methods">
          <h4>Payment Method</h4>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={customerInfo.paymentMethod === 'cash'}
                onChange={handleInputChange}
              />
              <span>Cash on Delivery</span>
            </label>
            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={customerInfo.paymentMethod === 'bank'}
                onChange={handleInputChange}
              />
              <span>Bank Transfer</span>
            </label>
            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="gcash"
                checked={customerInfo.paymentMethod === 'gcash'}
                onChange={handleInputChange}
              />
              <span>GCash</span>
            </label>
          </div>
        </div>
        
        <div className="order-summary">
          <h4>Order Summary</h4>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₱{totalAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery:</span>
            <span>₱50.00</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₱{(totalAmount + 50).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="checkout-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Information</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Review</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Payment</span>
          </div>
        </div>

        <div className="checkout-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="checkout-footer">
          {currentStep > 1 && (
            <button className="btn-secondary" onClick={handlePrevious}>
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button className="btn-primary" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={handlePlaceOrder}>
              Place Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
