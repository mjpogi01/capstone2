import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUsers, FaChevronDown } from 'react-icons/fa';
import userService from '../../services/userService';
import { useCart } from '../../contexts/CartContext';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, onPlaceOrder }) => {
  const { cartItems, clearCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: '',
    receiver: '',
    phone: ''
  });
  
  const [hasAddress, setHasAddress] = useState(false); // Check if user has address in database
  const [allAddresses, setAllAddresses] = useState([]); // All user addresses
  const [selectedAddressId, setSelectedAddressId] = useState(null); // Currently selected address
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // ID of address being edited
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    barangay: '',
    postalCode: '',
    streetAddress: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [selectedLocation, setSelectedLocation] = useState('BATANGAS CITY');
  const [orderNotes, setOrderNotes] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedOrderIndex, setExpandedOrderIndex] = useState(null);

  // Check for user address when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUserAddress();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const locations = [
    'MAIN (SAN PASCUAL)',
    'MUZON',
    'ROSARIO',
    'BATANGAS CITY',
    'PINAMALAYAN',
    'CALACA',
    'LEMERY',
    'CALAPAN',
    'BAUAN'
  ];

  const subtotalAmount = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);

  const shippingCost = shippingMethod === 'cod' ? 50.00 : 0.00;
  const totalAmount = subtotalAmount + shippingCost;

  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const handlePlaceOrder = () => {
    const orderData = {
      deliveryAddress,
      shippingMethod,
      selectedLocation,
      orderNotes,
      items: cartItems,
      subtotalAmount,
      shippingCost,
      totalAmount,
      totalItems,
      orderDate: new Date().toISOString()
    };
    
    onPlaceOrder(orderData);
    onClose();
  };

  // Check if user has addresses from database
  const checkUserAddress = async () => {
    try {
      const addresses = await userService.getUserAddresses();
      
      if (addresses && addresses.length > 0) {
        setAllAddresses(addresses);
        setHasAddress(true);
        setShowAddressForm(false);
        
        // Set the default address as selected
        const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setDeliveryAddress({
            address: defaultAddress.address,
            receiver: defaultAddress.full_name,
            phone: defaultAddress.phone
          });
        }
      } else {
        setAllAddresses([]);
        setHasAddress(false);
        setShowAddressForm(false);
      }
    } catch (error) {
      setAllAddresses([]);
      setHasAddress(false);
      setShowAddressForm(false);
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    
    // For postal code, only allow numeric characters
    let processedValue = value;
    if (name === 'postalCode') {
      processedValue = value.replace(/[^0-9]/g, '');
    }
    
    setNewAddress(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (addressErrors[name]) {
      setAddressErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateAddressForm = () => {
    const errors = {};
    const requiredFields = ['fullName', 'phone', 'streetAddress', 'province', 'city', 'barangay', 'postalCode'];
    
    requiredFields.forEach(field => {
      if (!newAddress[field] || newAddress[field].trim() === '') {
        errors[field] = 'This field is required';
      }
    });
    
    // Phone validation
    if (newAddress.phone && !/^[\d\s\-\+\(\)]+$/.test(newAddress.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Postal code validation - only numbers
    if (newAddress.postalCode && !/^\d+$/.test(newAddress.postalCode)) {
      errors.postalCode = 'Postal code must contain only numbers';
    }
    
    // Length validation
    if (newAddress.fullName && newAddress.fullName.length > 255) {
      errors.fullName = 'Full name must be 255 characters or less';
    }
    if (newAddress.phone && newAddress.phone.length > 30) {
      errors.phone = 'Phone number must be 30 characters or less';
    }
    if (newAddress.streetAddress && newAddress.streetAddress.length > 500) {
      errors.streetAddress = 'Street address must be 500 characters or less';
    }
    if (newAddress.barangay && newAddress.barangay.length > 100) {
      errors.barangay = 'Barangay must be 100 characters or less';
    }
    if (newAddress.city && newAddress.city.length > 100) {
      errors.city = 'City must be 100 characters or less';
    }
    if (newAddress.province && newAddress.province.length > 100) {
      errors.province = 'Province must be 100 characters or less';
    }
    if (newAddress.postalCode && newAddress.postalCode.length > 20) {
      errors.postalCode = 'Postal code must be 20 characters or less';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (validateAddressForm()) {
      try {
        const addressData = {
          fullName: newAddress.fullName,
          phone: newAddress.phone,
          streetAddress: newAddress.streetAddress,
          barangay: newAddress.barangay,
          city: newAddress.city,
          province: newAddress.province,
          postalCode: newAddress.postalCode,
          address: `${newAddress.streetAddress}, ${newAddress.barangay}, ${newAddress.city}, ${newAddress.province} ${newAddress.postalCode}`
        };

        // Check if we're editing an existing address or adding a new one
        if (editingAddressId) {
          // We're editing an existing address
          await userService.updateUserAddress(editingAddressId, addressData);
        } else {
          // We're adding a new address
          await userService.saveUserAddress(addressData);
        }
        
        // Refresh addresses list
        await checkUserAddress();
        setShowAddressForm(false);
        setEditingAddressId(null);
      } catch (error) {
        console.error('Failed to save address:', error.message);
        alert('Failed to save address. Please try again.');
      }
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await userService.deleteUserAddress(addressId);
        // Refresh addresses list
        await checkUserAddress();
        
        // If the deleted address was selected, clear the selection
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setDeliveryAddress({
            address: '',
            receiver: '',
            phone: ''
          });
        }
      } catch (error) {
        console.error('Failed to delete address:', error);
        alert('Failed to delete address. Please try again.');
      }
    }
  };

  const handleChangeAddress = (address = null) => {
    console.log('handleChangeAddress called'); // Debug log
    setShowAddressForm(true);
    
    // Use the provided address or the current delivery address
    const addressToEdit = address || { address: deliveryAddress.address, full_name: deliveryAddress.receiver, phone: deliveryAddress.phone };
    const addressString = addressToEdit.address || '';
    console.log('Address string:', addressString); // Debug log
    const addressParts = addressString.split(', ').map(part => part.trim());
    console.log('Address parts:', addressParts); // Debug log
    
    let streetAddress = '';
    let barangay = '';
    let city = '';
    let province = '';
    let postalCode = '';
    
    // Parse address parts more carefully
    if (addressParts.length >= 5) {
      streetAddress = addressParts[0] || '';
      barangay = addressParts[1] || '';
      city = addressParts[2] || '';
      // Province might contain postal code, so separate them
      const provincePart = addressParts[3] || '';
      const postalCodeMatch = provincePart.match(/(\d+)/);
      if (postalCodeMatch) {
        province = provincePart.replace(/\d+/g, '').trim();
        postalCode = postalCodeMatch[1];
      } else {
        province = provincePart;
        postalCode = addressParts[4] || '';
      }
    } else if (addressParts.length >= 4) {
      streetAddress = addressParts[0] || '';
      barangay = addressParts[1] || '';
      city = addressParts[2] || '';
      // Province might contain postal code, so separate them
      const provincePart = addressParts[3] || '';
      const postalCodeMatch = provincePart.match(/(\d+)/);
      if (postalCodeMatch) {
        province = provincePart.replace(/\d+/g, '').trim();
        postalCode = postalCodeMatch[1];
      } else {
        province = provincePart;
        postalCode = '';
      }
    }
    
    setNewAddress({
      fullName: addressToEdit.full_name || '',
      phone: addressToEdit.phone || '',
      streetAddress: streetAddress,
      barangay: barangay,
      city: city,
      province: province,
      postalCode: postalCode
    });
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="checkout-close-button" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Header */}
        <div className="checkout-header">
          <h1>CHECKOUT</h1>
        </div>

        {/* Delivery Address Section */}
        <div className="checkout-section">
          <div className="section-header">
            <div className="section-header-left">
              <FaTruck className="section-icon" />
              <h2>DELIVERY ADDRESS</h2>
            </div>
            {hasAddress && !showAddressForm && (
              <button 
                className="add-address-header-btn"
                onClick={() => setShowAddressForm(true)}
              >
                Add Address
              </button>
            )}
          </div>
          
          {(!hasAddress || showAddressForm) ? (
            showAddressForm ? (
              /* Address Input Form */
              <div className="address-form">
                <div className="form-header">
                  <h3>Add Delivery Address</h3>
                  <p>Please provide your delivery information</p>
                </div>
                
                <div className="address-form-fields">
                  <div className="form-group">
                    <input
                      type="text"
                      name="fullName"
                      value={newAddress.fullName}
                      onChange={handleAddressInputChange}
                      className={addressErrors.fullName ? 'error' : ''}
                      placeholder="Full Name"
                      maxLength={255}
                    />
                    {addressErrors.fullName && (
                      <span className="error-message">{addressErrors.fullName}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="tel"
                      name="phone"
                      value={newAddress.phone}
                      onChange={handleAddressInputChange}
                      className={addressErrors.phone ? 'error' : ''}
                      placeholder="Phone Number"
                      maxLength={30}
                    />
                    {addressErrors.phone && (
                      <span className="error-message">{addressErrors.phone}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="text" 
                      name="province" 
                      value={newAddress.province} 
                      onChange={handleAddressInputChange} 
                      className={addressErrors.province ? 'error' : ''} 
                      placeholder="Province (e.g., Batangas, Cavite)" 
                      maxLength={100}
                    />
                    {addressErrors.province && (<span className="error-message">{addressErrors.province}</span>)}
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="city" 
                      value={newAddress.city} 
                      onChange={handleAddressInputChange} 
                      className={addressErrors.city ? 'error' : ''} 
                      placeholder="City/Municipality (e.g., Batangas City, Lipa City)" 
                      maxLength={100}
                    />
                    {addressErrors.city && (<span className="error-message">{addressErrors.city}</span>)}
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="barangay" 
                      value={newAddress.barangay} 
                      onChange={handleAddressInputChange} 
                      className={addressErrors.barangay ? 'error' : ''} 
                      placeholder="Barangay (e.g., Poblacion, Balagtas)" 
                      maxLength={100}
                    />
                    {addressErrors.barangay && (<span className="error-message">{addressErrors.barangay}</span>)}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="postalCode"
                      value={newAddress.postalCode}
                      onChange={handleAddressInputChange}
                      className={addressErrors.postalCode ? 'error' : ''}
                      placeholder="Postal Code"
                      maxLength={20}
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                    {addressErrors.postalCode && (
                      <span className="error-message">{addressErrors.postalCode}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="streetAddress"
                      value={newAddress.streetAddress}
                      onChange={handleAddressInputChange}
                      className={addressErrors.streetAddress ? 'error' : ''}
                      placeholder="Street Name, Building, House No."
                      maxLength={500}
                    />
                    {addressErrors.streetAddress && (
                      <span className="error-message">{addressErrors.streetAddress}</span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="save-address-btn"
                    onClick={handleSaveAddress}
                  >
                    Save Address & Continue
                  </button>
                </div>
              </div>
            ) : (
              /* No Address Yet */
              <div className="no-address-section">
                <div className="no-address-content">
                  <div className="no-address-icon">📍</div>
                  <div className="no-address-text">
                    <h3>No address yet</h3>
                    <p>Please add your delivery address to continue</p>
                  </div>
                  <button 
                    className="add-address-btn"
                    onClick={() => setShowAddressForm(true)}
                  >
                    Add Address
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Existing Addresses Display */
            <div className="addresses-list">
              {allAddresses.map((address) => (
                <div 
                  key={address.id} 
                  className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAddressId(address.id);
                    setDeliveryAddress({
                      address: address.address,
                      receiver: address.full_name,
                      phone: address.phone
                    });
                  }}
                >
                  <div className="address-card-content">
                    <div className="address-header">
                      <div className="location-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                      <div className="receiver-info">
                        <div className="receiver-name">{address.full_name}</div>
                        <div className="receiver-phone">{address.phone}</div>
                      </div>
                      <div className="address-actions">
                        <button 
                          className="edit-address-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddressId(address.id);
                            handleChangeAddress(address);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-address-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(address.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="address-details">
                      <div className="address-line">{address.address}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products Ordered Section */}
        <div className="checkout-section products-section">
          <div className="section-header">
            <FaUsers className="section-icon" />
            <h2>ORDER DETAILS</h2>
          </div>
          <div className="products-table">
            <div className="table-header">
              <div className="header-item">ITEM</div>
              <div className="header-price">PRICE</div>
              <div className="header-quantity">QTY</div>
              <div className="header-total">TOTAL</div>
            </div>
            {cartItems.map((item, index) => {
              console.log('Cart item:', item); // Debug log
              return (
                <div key={index} className="table-row">
                  <div className="item-cell">
                    <div className="item-content">
                      <div className="item-image">
                        <img 
                          src={item.main_image || item.image || item.imageUrl || item.photo || item.image_url || item.product_image || item.thumbnail || '/image_highlights/image.png'} 
                          alt={item.name}
                          onError={(e) => {
                            console.log('Image failed to load:', e.target.src);
                            e.target.src = '/image_highlights/image.png';
                          }}
                        />
                      </div>
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div 
                        className="item-type clickable"
                        onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                      >
                        {item.category === 'team' ? 'Team Order' : 'Single Order'}
                        <span className="dropdown-arrow">
                          {expandedOrderIndex === index ? '▲' : '▼'}
                        </span>
                      </div>
                      {expandedOrderIndex === index && (
                        <div className="order-details-dropdown">
                          {item.category === 'team' && item.teamMembers && item.teamMembers.length > 0 ? (
                            <div className="team-details">
                              <div className="team-name-header">
                                <div className="detail-row">
                                  <span className="detail-label">Team:</span>
                                  <span className="detail-value team-name-detail">{item.teamMembers[0]?.teamName || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="team-divider"></div>
                              <div className="team-members-list">
                                {item.teamMembers.map((member, memberIndex) => (
                                  <div key={memberIndex} className="member-details">
                                    <div className="detail-row">
                                      <span className="detail-label">Surname:</span>
                                      <span className="detail-value surname-detail">{member.surname || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Jersey No:</span>
                                      <span className="detail-value">{member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Size:</span>
                                      <span className="detail-value">{member.size || 'N/A'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="single-order-details">
                              <div className="member-details">
                                <div className="detail-row">
                                  <span className="detail-label">Team:</span>
                                  <span className="detail-value team-name-detail">{item.singleOrderDetails?.teamName || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Surname:</span>
                                  <span className="detail-value surname-detail">{item.singleOrderDetails?.surname || item.surname || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Jersey No:</span>
                                  <span className="detail-value">{item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || item.jerseyNo || item.jerseyNumber || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Size:</span>
                                  <span className="detail-value">{item.singleOrderDetails?.size || item.size || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="price-cell">₱{parseFloat(item.price).toFixed(2)}</div>
                <div className="quantity-cell">{item.quantity}</div>
                <div className="total-cell">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Options and Notes */}
        <div className="checkout-section">
          <div className="shipping-notes-container">
            {/* Shipping Options */}
            <div className="shipping-options">
              <div className="section-header">
                <FaTruck className="section-icon" />
                <h2>SHIPPING OPTIONS</h2>
              </div>
              <div className="shipping-method">
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="pickup"
                    checked={shippingMethod === 'pickup'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <span className="checkmark"></span>
                  <div className="option-content">
                    <div className="option-title">Pick Up</div>
                    <div className="option-subtitle">Free</div>
                  </div>
                </label>
                
                {shippingMethod === 'pickup' && (
                  <div className="location-selector">
                    <div className="location-dropdown" onClick={() => setShowLocationDropdown(!showLocationDropdown)}>
                      <span className="location-text">{selectedLocation}</span>
                      <FaChevronDown className="dropdown-arrow" />
                    </div>
                    {showLocationDropdown && (
                      <div className="location-options">
                        {locations.map((location, index) => (
                          <div
                            key={index}
                            className="location-option"
                            onClick={() => {
                              setSelectedLocation(location);
                              setShowLocationDropdown(false);
                            }}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="cod"
                    checked={shippingMethod === 'cod'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <span className="checkmark"></span>
                  <div className="option-content">
                    <div className="option-title">Cash on Delivery</div>
                    <div className="option-subtitle">₱50.00</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes Section */}
            <div className="notes-section">
              <div className="section-header">
                <h2>NOTES/MESSAGE TO YOHANNS</h2>
              </div>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Please Leave A Message ……"
                className="notes-textarea"
              />
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="checkout-section">
          <div className="order-summary">
            <div className="summary-row">
              <span>Merchandise Subtotal:</span>
              <span>₱{subtotalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Subtotal:</span>
              <span>₱{shippingCost.toFixed(2)}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total Payment ({totalItems} items):</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="place-order-container">
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;