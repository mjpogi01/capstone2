import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUsers, FaChevronDown, FaBasketballBall, FaTrophy, FaUserFriends, FaUser, FaMapMarkerAlt, FaChevronUp, FaTshirt } from 'react-icons/fa';
import userService from '../../services/userService';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, onPlaceOrder, cartItems: selectedCartItems }) => {
  // Use the filtered cart items passed as props, not all cart items from context
  const cartItems = selectedCartItems || [];
  
  // Debug logging
  console.log('🛒 CheckoutModal received cart items:', cartItems.length);
  console.log('🛒 CheckoutModal cart items:', cartItems.map(item => ({ id: item.uniqueId || item.id, name: item.name })));
  
  // Log when cart items change
  useEffect(() => {
    console.log('🛒 CheckoutModal: Cart items updated:', cartItems.length);
    if (cartItems.length === 0) {
      console.log('⚠️ CheckoutModal: No items received - this might be the issue!');
    }
  }, [cartItems.length]);
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
  const [orderErrors, setOrderErrors] = useState({}); // For order validation
  
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [selectedLocation, setSelectedLocation] = useState('BATANGAS CITY');
  const [orderNotes, setOrderNotes] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedOrderIndex, setExpandedOrderIndex] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation dialog
  const [showOrderComplete, setShowOrderComplete] = useState(false); // Order complete message
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete address confirmation
  const [addressToDelete, setAddressToDelete] = useState(null); // Address ID to delete
  const [showCancelReason, setShowCancelReason] = useState(false); // Cancel reason dialog
  const [cancelReason, setCancelReason] = useState(''); // Selected cancellation reason

  // Check for user address when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUserAddress();
      // Scroll modal to top when it opens to ensure order details are visible
      setTimeout(() => {
        const modalElement = document.querySelector('.checkout-modal');
        if (modalElement) {
          modalElement.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const locations = [
    'BATANGAS CITY',
    'BAUAN',
    'SAN PASCUAL (MAIN BRANCH)',
    'CALAPAN',
    'PINAMALAYAN',
    'MUZON',
    'LEMERY',
    'ROSARIO',
    'CALACA'
  ];

  const subtotalAmount = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price || item.product_price || item.productPrice || 0);
    const quantity = parseInt(item.quantity || 1);
    console.log('Cart item price calculation:', {
      itemName: item.name,
      rawPrice: item.price,
      parsedPrice: price,
      quantity: quantity,
      itemTotal: price * quantity
    });
    return total + (price * quantity);
  }, 0);

  const shippingCost = shippingMethod === 'cod' ? 50.00 : 0.00;
  const totalAmount = subtotalAmount + shippingCost;
  
  console.log('Order Summary:', {
    subtotal: subtotalAmount,
    shipping: shippingCost,
    total: totalAmount,
    itemCount: cartItems.length
  });

  const totalItems = cartItems.reduce((total, item) => {
    return total + parseInt(item.quantity || 1);
  }, 0);

  const validateOrder = () => {
    const errors = {};
    
    // Validate based on shipping method
    if (shippingMethod === 'cod') {
      // For COD (delivery), check if user has selected an address
      if (!deliveryAddress.receiver || !deliveryAddress.phone || !deliveryAddress.address) {
        errors.address = 'Please add or select a delivery address';
      }
    }
    
    // Require location selection only for pickup, NOT for COD
    if (shippingMethod === 'pickup' && (!selectedLocation || selectedLocation.trim() === '')) {
      errors.location = 'Please select a branch location';
    }
    
    setOrderErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = () => {
    // Validate order before placing
    if (!validateOrder()) {
      // Scroll to top to show errors
      const modalContent = document.querySelector('.checkout-modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmOrder = () => {
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
    setShowConfirmation(false);
    setShowOrderComplete(true);
  };

  const handleCancelOrder = () => {
    setShowConfirmation(false);
    setShowCancelReason(true);
    setCancelReason(''); // Reset reason
  };

  const handleSubmitCancellation = () => {
    if (!cancelReason) {
      alert('Please select a cancellation reason');
      return;
    }
    
    console.log('Order cancelled. Reason:', cancelReason);
    // You can send the cancellation reason to backend here if needed
    
    setShowCancelReason(false);
    setCancelReason('');
  };

  const handleBackToOrder = () => {
    setShowCancelReason(false);
    setShowConfirmation(true);
    setCancelReason('');
  };

  const handleCloseComplete = () => {
    setShowOrderComplete(false);
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
    if (newAddress.phone && !/^[\d\s\-+()]+$/.test(newAddress.phone)) {
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

  const handleDeleteAddress = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      await userService.deleteUserAddress(addressToDelete);
      // Refresh addresses list
      await checkUserAddress();
      
      // If the deleted address was selected, clear the selection
      if (selectedAddressId === addressToDelete) {
        setSelectedAddressId(null);
        setDeliveryAddress({
          address: '',
          receiver: '',
          phone: ''
        });
      }
      
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address. Please try again.');
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    }
  };

  const cancelDeleteAddress = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
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
                      onChange={(e) => {
                        // Only allow numbers, spaces, dashes, and plus sign
                        const value = e.target.value.replace(/[^\d\s\-+]/g, '');
                        handleAddressInputChange({ target: { name: 'phone', value } });
                      }}
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
                  <div className="no-address-icon"><FaMapMarkerAlt /></div>
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
                    setOrderErrors(prev => ({ ...prev, address: '' }));
                  }}
                >
                  <div className="address-card-content">
                    <div className="address-header">
                      <div className="location-icon">
                        <FaMapMarkerAlt />
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
          
          {/* Show error if COD selected but no address */}
          {orderErrors.address && shippingMethod === 'cod' && (
            <div className="error-message" style={{ 
              display: 'block', 
              marginTop: '12px', 
              padding: '12px', 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              borderLeft: '4px solid #ff4444', 
              color: '#ff4444', 
              fontSize: '14px',
              borderRadius: '4px'
            }}>
              {orderErrors.address}
            </div>
          )}
        </div>

        {/* Products Ordered Section - ORDER DETAILS */}
        <div className="checkout-section products-section">
          <div className="section-header">
            <FaUsers className="section-icon" />
            <h2>ORDER DETAILS</h2>
          </div>
          <div className="checkout-modal-perfect-table-container">
            <div className="checkout-modal-perfect-table">
              <div className="checkout-modal-perfect-header">
                <div className="checkout-modal-perfect-header-row">
                  <div className="checkout-modal-perfect-header-item">ITEM</div>
                  <div className="checkout-modal-perfect-header-order">ORDER</div>
                  <div className="checkout-modal-perfect-header-price">PRICE</div>
                  <div className="checkout-modal-perfect-header-qty">QTY</div>
                  <div className="checkout-modal-perfect-header-total">TOTAL</div>
                </div>
              </div>
              {cartItems.map((item, index) => {
                // Determine product category first
                const isBall = item.category?.toLowerCase() === 'balls';
                const isTrophy = item.category?.toLowerCase() === 'trophies';
                const isApparel = !isBall && !isTrophy;
                
                console.log('🛒 CheckoutModal Cart item:', item); // Debug log
                console.log('🛒 Team Members:', item.teamMembers);
                console.log('🛒 Team Members Length:', item.teamMembers?.length);
                console.log('🛒 Team Name (item.teamName):', item.teamName);
                console.log('🛒 First Team Member:', item.teamMembers?.[0]);
                console.log('🛒 First Team Member Team Name:', item.teamMembers?.[0]?.teamName);
                console.log('🛒 First Team Member Team Name (snake_case):', item.teamMembers?.[0]?.team_name);
                console.log('🛒 Single Order Details:', item.singleOrderDetails);
                console.log('🛒 Single Order Team Name:', item.singleOrderDetails?.teamName);
                console.log('🛒 Single Order Team Name (snake_case):', item.singleOrderDetails?.team_name);
                console.log('🛒 Ball Details:', item.ballDetails);
                console.log('🛒 Trophy Details:', item.trophyDetails);
                console.log('🛒 Is Team Order:', item.isTeamOrder);
                console.log('🛒 Is Apparel:', isApparel);
                console.log('🛒 Will show team details:', isApparel && item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0);

                return (
                  <div key={index} className="checkout-modal-perfect-content-row">
                    <div className="checkout-modal-perfect-content-item">
                      <div className="checkout-modal-perfect-item-content">
                        <div className="checkout-modal-perfect-item-image">
                          <img 
                            src={item.main_image || item.image || item.imageUrl || item.photo || item.image_url || item.product_image || item.thumbnail || '/image_highlights/image.png'} 
                            alt={item.name}
                            onError={(e) => {
                              console.log('Image failed to load:', e.target.src);
                              e.target.src = '/image_highlights/image.png';
                            }}
                          />
                        </div>
                        <div className="checkout-modal-perfect-item-details">
                          <div className="checkout-modal-perfect-item-name">{item.name}</div>
                          <div className="checkout-modal-perfect-item-type">
                            {isBall ? (
                              <><FaBasketballBall /> Basketball</>
                            ) : isTrophy ? (
                              <><FaTrophy /> Trophy</>
                            ) : (
                              <><FaTshirt /> {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Apparel'}</>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="checkout-modal-perfect-content-order"
                      onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                    >
                      <div className="checkout-modal-perfect-order-type">
                        {isBall ? (
                          <><FaBasketballBall /> Ball</>
                        ) : isTrophy ? (
                          <><FaTrophy /> Trophy</>
                        ) : item.isTeamOrder ? (
                          <><FaUserFriends /> Team Order</>
                        ) : (
                          <><FaUser /> Single Order</>
                        )}
                        <span className={`checkout-modal-perfect-dropdown-arrow ${expandedOrderIndex === index ? 'expanded' : ''}`}>
                          {expandedOrderIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </div>
                    </div>
                    <div className="checkout-modal-perfect-content-price">
                      ₱{parseFloat(item.price).toFixed(2)}
                    </div>
                    <div className="checkout-modal-perfect-content-qty">
                      {item.quantity}
                    </div>
                    <div className="checkout-modal-perfect-content-total">
                      ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                    {expandedOrderIndex === index && (
                      <div className="checkout-modal-perfect-dropdown-wrapper">
                        <div className="checkout-modal-perfect-dropdown">
                            {/* For Apparel - Team Orders */}
                            {isApparel && item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0 ? (
                              <div className="checkout-modal-perfect-team-details">
                                <div className="checkout-modal-perfect-team-header">
                                  <div className="checkout-modal-perfect-detail-row">
                                    <span className="checkout-modal-perfect-detail-label">Team:</span>
                                    <span className="checkout-modal-perfect-detail-value checkout-modal-perfect-team-name-detail">{item.teamMembers[0]?.teamName || item.teamMembers[0]?.team_name || item.teamName || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="checkout-modal-perfect-team-divider"></div>
                                <div className="checkout-modal-perfect-members-list">
                                  {item.teamMembers.map((member, memberIndex) => (
                                    <div key={memberIndex} className="checkout-modal-perfect-member-details">
                                      <div className="checkout-modal-perfect-detail-row">
                                        <span className="checkout-modal-perfect-detail-label">Surname:</span>
                                        <span className="checkout-modal-perfect-detail-value checkout-modal-perfect-surname-detail">{member.surname || member.lastName || 'N/A'}</span>
                                      </div>
                                      <div className="checkout-modal-perfect-detail-row">
                                        <span className="checkout-modal-perfect-detail-label">Jersey No:</span>
                                        <span className="checkout-modal-perfect-detail-value">{member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                      </div>
                                      <div className="checkout-modal-perfect-detail-row">
                                        <span className="checkout-modal-perfect-detail-label">Size:</span>
                                        <span className="checkout-modal-perfect-detail-value">{member.size || 'N/A'} ({member.sizingType || item.sizeType || 'Adult'})</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : isApparel ? (
                              /* For Apparel - Single Orders */
                              <div className="checkout-modal-perfect-single-order-details">
                                <div className="checkout-modal-perfect-member-details">
                                  <div className="checkout-modal-perfect-detail-row">
                                    <span className="checkout-modal-perfect-detail-label">Team:</span>
                                    <span className="checkout-modal-perfect-detail-value checkout-modal-perfect-team-name-detail">{item.singleOrderDetails?.teamName || item.singleOrderDetails?.team_name || item.teamName || 'N/A'}</span>
                                  </div>
                                  <div className="checkout-modal-perfect-detail-row">
                                    <span className="checkout-modal-perfect-detail-label">Surname:</span>
                                    <span className="checkout-modal-perfect-detail-value checkout-modal-perfect-surname-detail">{item.singleOrderDetails?.surname || item.singleOrderDetails?.lastName || 'N/A'}</span>
                                  </div>
                                  <div className="checkout-modal-perfect-detail-row">
                                    <span className="checkout-modal-perfect-detail-label">Jersey No:</span>
                                    <span className="checkout-modal-perfect-detail-value">{item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || 'N/A'}</span>
                                  </div>
                                  <div className="checkout-modal-perfect-detail-row">
                                    <span className="checkout-modal-perfect-detail-label">Size:</span>
                                    <span className="checkout-modal-perfect-detail-value">{item.singleOrderDetails?.size || item.size || 'N/A'} ({item.singleOrderDetails?.sizingType || item.sizeType || 'Adult'})</span>
                                  </div>
                                </div>
                              </div>
                            ) : isBall ? (
                              /* For Balls */
                              <div className="checkout-modal-perfect-ball-details">
                                <div className="checkout-modal-perfect-member-details">
                                  {item.ballDetails?.sportType && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Sport:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.ballDetails.sportType}</span>
                                    </div>
                                  )}
                                  {item.ballDetails?.brand && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Brand:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.ballDetails.brand}</span>
                                    </div>
                                  )}
                                  {item.ballDetails?.size && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Size:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.ballDetails.size}</span>
                                    </div>
                                  )}
                                  {item.ballDetails?.material && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Material:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.ballDetails.material}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : isTrophy ? (
                              /* For Trophies */
                              <div className="checkout-modal-perfect-trophy-details">
                                <div className="checkout-modal-perfect-member-details">
                                  {item.trophyDetails?.type && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Type:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.trophyDetails.type}</span>
                                    </div>
                                  )}
                                  {item.trophyDetails?.size && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Size:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.trophyDetails.size}</span>
                                    </div>
                                  )}
                                  {item.trophyDetails?.material && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Material:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.trophyDetails.material}</span>
                                    </div>
                                  )}
                                  {item.trophyDetails?.engraving && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Engraving:</span>
                                      <span className="checkout-modal-perfect-detail-value checkout-modal-perfect-engraving-text">{item.trophyDetails.engraving}</span>
                                    </div>
                                  )}
                                  {item.trophyDetails?.occasion && (
                                    <div className="checkout-modal-perfect-detail-row">
                                      <span className="checkout-modal-perfect-detail-label">Occasion:</span>
                                      <span className="checkout-modal-perfect-detail-value">{item.trophyDetails.occasion}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
                    onChange={(e) => {
                      setShippingMethod(e.target.value);
                      setOrderErrors(prev => ({ ...prev, address: '' }));
                    }}
                  />
                  <span className="checkmark"></span>
                  <div className="option-content">
                    <div className="option-title">Pick Up</div>
                    <div className="option-subtitle">Free</div>
                  </div>
                </label>
                
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="cod"
                    checked={shippingMethod === 'cod'}
                    onChange={(e) => {
                      setShippingMethod(e.target.value);
                      setOrderErrors(prev => ({ ...prev, address: '' }));
                    }}
                  />
                  <span className="checkmark"></span>
                  <div className="option-content">
                    <div className="option-title">Cash on Delivery</div>
                    <div className="option-subtitle">₱50.00</div>
                  </div>
                </label>
                
                {/* Location selector shown only for pickup, NOT for COD */}
                {shippingMethod === 'pickup' && (
                  <div className="location-selector">
                    <label className="location-label">Select Branch Location:</label>
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
                              setOrderErrors(prev => ({ ...prev, location: '' }));
                            }}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                    {orderErrors.location && (
                      <span className="error-message" style={{ display: 'block', marginTop: '8px', color: '#ff4444', fontSize: '14px' }}>
                        {orderErrors.location}
                      </span>
                    )}
                  </div>
                )}
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
              <span>₱{subtotalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Subtotal:</span>
              <span>₱{shippingCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total Payment ({totalItems} items):</span>
              <span>₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          
          <div className="place-order-container">
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirmation-modal">
            <h3>Confirm Order</h3>
            <p>Are you sure you want to place this order?</p>
            <div className="confirmation-buttons">
              <button className="confirm-btn yes-btn" onClick={handleConfirmOrder}>
                Yes
              </button>
              <button className="confirm-btn no-btn" onClick={handleCancelOrder}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Complete Dialog */}
      {showOrderComplete && (
        <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirmation-modal order-complete-modal">
            <div className="success-icon">✓</div>
            <h3>Order Completed!</h3>
            <p>Your order has been successfully placed.</p>
            <button className="confirm-btn ok-btn" onClick={handleCloseComplete}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirmation-modal delete-confirm-modal">
            <h3>Delete Address</h3>
            <p>Are you sure you want to delete this address?</p>
            <div className="confirmation-buttons">
              <button className="confirm-btn yes-btn" onClick={confirmDeleteAddress}>
                Yes
              </button>
              <button className="confirm-btn no-btn" onClick={cancelDeleteAddress}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Dialog */}
      {showCancelReason && (
        <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirmation-modal cancel-reason-modal">
            <h3>Cancel Order</h3>
            <p>Please select a reason for cancelling:</p>
            
            <div className="cancel-reasons">
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Ordered by mistake"
                  checked={cancelReason === 'Ordered by mistake'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Ordered by mistake</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Changed my mind"
                  checked={cancelReason === 'Changed my mind'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Changed my mind</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Wrong product or size selected"
                  checked={cancelReason === 'Wrong product or size selected'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Wrong product or size selected</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Payment or checkout issue"
                  checked={cancelReason === 'Payment or checkout issue'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Payment or checkout issue</span>
              </label>
              
              <label className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Personal reasons (other)"
                  checked={cancelReason === 'Personal reasons (other)'}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <span>Personal reasons (other)</span>
              </label>
            </div>
            
            <div className="confirmation-buttons">
              <button className="confirm-btn submit-cancel-btn" onClick={handleSubmitCancellation}>
                Submit
              </button>
              <button className="confirm-btn back-btn" onClick={handleBackToOrder}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutModal;