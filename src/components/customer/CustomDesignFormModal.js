import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import './CustomDesignFormModal.css';

const branches = [
  { id: 'san-pascual', name: 'SAN PASCUAL (MAIN BRANCH)', address: 'Villa Maria Subdivision Sambat, San Pascual, 4204 Batangas' },
  { id: 'calapan', name: 'CALAPAN BRANCH', address: 'Unit 2, G/F Basa Bldg., Infantado St., San Vicente West, Calapan City' },
  { id: 'muzon', name: 'MUZON BRANCH', address: 'Barangay Muzon, San Luis, 4226 Batangas' },
  { id: 'lemery', name: 'LEMERY BRANCH', address: 'Miranda Bldg, Illustre Ave., Brgy. District III 4209 Lemery Batangas' },
  { id: 'batangas-city', name: 'BATANGAS CITY BRANCH', address: 'Unit 1 Casa Buena Bldg, P. Burgos St. Ext Calicanto, Batangas' },
  { id: 'bauan', name: 'BAUAN BRANCH', address: 'J.P Rizal St. Poblacion, Bauan Batangas' },
  { id: 'calaca', name: 'CALACA BRANCH', address: 'Block D-8 Calaca Public Market, Poblacion 4, Calaca City' },
  { id: 'balayan', name: 'BALAYAN BRANCH', address: 'Balayan, Batangas' },
  { id: 'lipa', name: 'LIPA BRANCH', address: 'Lipa City, Batangas' },
];

const initialMember = { number: '', surname: '', size: '' };

export default function CustomDesignFormModal({ isOpen, onClose }) {
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [images, setImages] = useState([]); // {file, url}
  const [members, setMembers] = useState([ { ...initialMember } ]);
  const [pickupBranchId, setPickupBranchId] = useState('');
  const [shippingMethod, setShippingMethod] = useState('pickup'); // 'pickup' or 'delivery'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState(''); // Notes/message to Yohanns
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);
  const [showErrors, setShowErrors] = useState(false); // Track if errors should be shown
  const [instantErrors, setInstantErrors] = useState({}); // Real-time validation errors
  
  const DELIVERY_FEE = 50; // Delivery fee in pesos

  const errors = useMemo(() => {
    const e = {};
    if (!clientName.trim()) e.clientName = 'Client name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (!/^\+?[0-9\-()\s]{7,}$/.test(phone)) e.phone = 'Enter a valid phone number';
    if (!teamName.trim()) e.teamName = 'Team name is required';
    
    // Shipping method validation
    if (shippingMethod === 'pickup' && !pickupBranchId) {
      e.pickup = 'Please select a pickup location';
    }
    if (shippingMethod === 'delivery' && !deliveryAddress.trim()) {
      e.deliveryAddress = 'Delivery address is required';
    }

    // Roster validation
    const numbers = new Set();
    members.forEach((m, idx) => {
      if (!m.number) e[`member_number_${idx}`] = 'Required';
      if (!m.surname?.trim()) e[`member_surname_${idx}`] = 'Required';
      if (!m.size?.trim()) e[`member_size_${idx}`] = 'Required';
      if (m.number) {
        if (numbers.has(m.number)) e[`member_number_${idx}`] = 'Duplicate jersey number';
        numbers.add(m.number);
      }
    });
    return e;
  }, [clientName, email, phone, teamName, shippingMethod, pickupBranchId, deliveryAddress, members]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleDrop = (evt) => {
    evt.preventDefault();
    const files = Array.from(evt.dataTransfer.files || []);
    addFiles(files);
  };

  const addFiles = (files) => {
    const accepted = files.filter(f => f.type.startsWith('image/'));
    const mapped = accepted.map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...mapped]);
  };

  const handleFileInput = (evt) => {
    addFiles(Array.from(evt.target.files || []));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addMemberRow = () => setMembers(prev => [...prev, { ...initialMember }]);
  const removeMemberRow = (index) => setMembers(prev => prev.filter((_, i) => i !== index));
  const updateMember = (index, field, value) => setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));

  const resetForm = () => {
    setClientName('');
    setEmail('');
    setPhone('');
    setTeamName('');
    setImages([]);
    setMembers([{ ...initialMember }]);
    setPickupBranchId('');
    setShippingMethod('pickup');
    setDeliveryAddress('');
    setOrderNotes(''); // Reset notes
    setValidationMessage(null);
    setShowSummary(false);
    setShowErrors(false); // Reset error display
    setInstantErrors({}); // Reset instant validation errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear instant errors and show submit errors
    setInstantErrors({});
    setShowErrors(true);
    
    // Check for errors before submission
    if (hasErrors) {
      // Scroll to top to show inline errors
      document.querySelector('.cdfm-form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Simulate submit
      await new Promise(res => setTimeout(res, 1200));
      const ref = 'CD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setConfirmation({ 
        reference: ref, 
        shippingMethod: shippingMethod,
        pickup: shippingMethod === 'pickup' ? branches.find(b => b.id === pickupBranchId)?.name : null,
        deliveryAddress: shippingMethod === 'delivery' ? deliveryAddress : null,
        deliveryFee: shippingMethod === 'delivery' ? DELIVERY_FEE : 0
      });
      
      // Clear the form after successful submission
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cdfm-overlay" onClick={onClose}>
      <div className="cdfm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cdfm-header">
          <h2 className="cdfm-title">Custom Design Order</h2>
          <button className="cdfm-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form className="cdfm-form" onSubmit={handleSubmit}>
          {/* Client Information */}
          <section className="cdfm-card">
            <h3 className="cdfm-card-title">Client Information</h3>
            <div className="cdfm-grid-two">
              <div className="cdfm-field">
                <label>Client Name <span className="cdfm-required">*</span></label>
                <div className="cdfm-input-wrapper">
                  <input 
                    className={showErrors && errors.clientName ? 'error' : ''} 
                    value={clientName} 
                    onChange={(e) => {
                      setClientName(e.target.value);
                      // Clear error when user starts typing
                      if (showErrors && e.target.value.trim()) {
                        setShowErrors(false);
                      }
                    }}
                    placeholder="Full name" 
                  />
                  {showErrors && errors.clientName && <span className="cdfm-inline-error">{errors.clientName}</span>}
                </div>
              </div>
              <div className="cdfm-field">
                <label>Contact Email <span className="cdfm-required">*</span></label>
                <div className="cdfm-input-wrapper">
                  <input 
                    className={(showErrors && errors.email) || instantErrors.email ? 'error' : ''} 
                    value={email} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                      
                      // Real-time validation - show error immediately if invalid format
                      if (value.trim() && !/^\S+@\S+\.\S+$/.test(value)) {
                        setInstantErrors(prev => ({ ...prev, email: 'Invalid email format' }));
                      } else {
                        setInstantErrors(prev => ({ ...prev, email: '' }));
                      }
                      
                      // Clear submit errors when valid email is entered
                      if (showErrors && /^\S+@\S+\.\S+$/.test(value)) {
                        setShowErrors(false);
                      }
                    }}
                    placeholder="name@example.com" 
                  />
                  {((showErrors && errors.email) || instantErrors.email) && (
                    <span className="cdfm-inline-error">{instantErrors.email || errors.email}</span>
                  )}
                </div>
              </div>
              <div className="cdfm-field">
                <label>Phone Number <span className="cdfm-required">*</span></label>
                <div className="cdfm-input-wrapper">
                  <input 
                    className={(showErrors && errors.phone) || instantErrors.phone ? 'error' : ''} 
                    value={phone} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setPhone(value);
                      
                      // Real-time validation - show error immediately if invalid format
                      if (value.trim() && !/^\+?[0-9\-()\s]{7,}$/.test(value)) {
                        setInstantErrors(prev => ({ ...prev, phone: 'Invalid phone format' }));
                      } else {
                        setInstantErrors(prev => ({ ...prev, phone: '' }));
                      }
                      
                      // Clear submit errors when valid phone is entered
                      if (showErrors && /^\+?[0-9\-()\s]{7,}$/.test(value)) {
                        setShowErrors(false);
                      }
                    }}
                    placeholder="e.g. +63 912 345 6789" 
                  />
                  {((showErrors && errors.phone) || instantErrors.phone) && (
                    <span className="cdfm-inline-error">{instantErrors.phone || errors.phone}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Team Details */}
          <section className="cdfm-card">
            <div className="cdfm-card-title-row">
              <h3 className="cdfm-card-title">Team Details</h3>
              <span className="cdfm-char-count">{teamName.length}/50</span>
            </div>
            <div className="cdfm-field">
              <label>Team Name <span className="cdfm-required">*</span></label>
              <div className="cdfm-input-wrapper">
                <input 
                  className={showErrors && errors.teamName ? 'error' : ''} 
                  maxLength={50} 
                  value={teamName} 
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    // Clear error when user starts typing
                    if (showErrors && e.target.value.trim()) {
                      setShowErrors(false);
                    }
                  }}
                  placeholder="Enter team name" 
                />
                {showErrors && errors.teamName && <span className="cdfm-inline-error">{errors.teamName}</span>}
              </div>
            </div>
          </section>

          {/* Image Upload */}
          <section className="cdfm-card">
            <h3 className="cdfm-card-title">Design Image Upload</h3>
            <div className="cdfm-upload-area"
                 onDrop={handleDrop}
                 onDragOver={(e) => e.preventDefault()}>
              <input id="file-input" type="file" accept="image/*" multiple onChange={handleFileInput} />
              <label htmlFor="file-input" className="cdfm-upload-label">
                <span className="cdfm-upload-icon">⬆️</span>
                Drag & drop images here or click to upload
              </label>
            </div>
            {images.length > 0 && (
              <div className="cdfm-preview-grid">
                {images.map((img, i) => (
                  <div key={i} className="cdfm-preview-item">
                    <img src={img.url} alt={`design-${i}`} />
                    <button type="button" className="cdfm-delete-thumb" onClick={() => removeImage(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Team Members Roster */}
          <section className="cdfm-card">
            <div className="cdfm-card-title-row">
              <h3 className="cdfm-card-title">Team Members Roster</h3>
              <button type="button" className="cdfm-add-row" onClick={addMemberRow} aria-label="Add row" title="Add row">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="cdfm-roster-table">
              <div className="cdfm-roster-head">
                <div>Jersey # <span className="cdfm-required">*</span></div>
                <div>Surname <span className="cdfm-required">*</span></div>
                <div>Size <span className="cdfm-required">*</span></div>
                <div></div>
              </div>
              {members.map((m, idx) => (
                <div key={idx} className="cdfm-roster-row">
                  <div className="cdfm-field">
                    <div className="cdfm-input-wrapper">
                      <input 
                        className={(showErrors && errors[`member_number_${idx}`]) || instantErrors[`member_number_${idx}`] ? 'error' : ''}
                        type="text" 
                        value={m.number}
                        onChange={(e) => {
                          const value = e.target.value;
                          
                          // Real-time validation - show error immediately if contains non-numeric characters
                          if (value.trim() && /[^\d]/.test(value)) {
                            setInstantErrors(prev => ({ ...prev, [`member_number_${idx}`]: 'Numbers only' }));
                          } else {
                            setInstantErrors(prev => ({ ...prev, [`member_number_${idx}`]: '' }));
                          }
                          
                          // Filter out non-numeric characters
                          const numericValue = value.replace(/[^\d]/g, '');
                          updateMember(idx, 'number', numericValue);
                          
                          // Clear error when user enters valid number
                          if (showErrors && numericValue.trim()) {
                            setShowErrors(false);
                          }
                        }}
                        placeholder="e.g. 23" 
                      />
                      {((showErrors && errors[`member_number_${idx}`]) || instantErrors[`member_number_${idx}`]) && (
                        <span className="cdfm-inline-error">{instantErrors[`member_number_${idx}`] || errors[`member_number_${idx}`]}</span>
                      )}
                    </div>
                  </div>
                  <div className="cdfm-field">
                    <div className="cdfm-input-wrapper">
                      <input 
                        className={showErrors && errors[`member_surname_${idx}`] ? 'error' : ''}
                        value={m.surname}
                        onChange={(e) => {
                          updateMember(idx, 'surname', e.target.value);
                          // Clear error when user starts typing
                          if (showErrors && e.target.value.trim()) {
                            setShowErrors(false);
                          }
                        }}
                        placeholder="Surname" 
                      />
                      {showErrors && errors[`member_surname_${idx}`] && <span className="cdfm-inline-error">{errors[`member_surname_${idx}`]}</span>}
                    </div>
                  </div>
                  <div className="cdfm-field">
                    <div className="cdfm-input-wrapper">
                      <select
                        className={showErrors && errors[`member_size_${idx}`] ? 'error' : ''}
                        value={m.size}
                        onChange={(e) => {
                          updateMember(idx, 'size', e.target.value);
                          // Clear error when user selects a size
                          if (showErrors && e.target.value) {
                            setShowErrors(false);
                          }
                        }}
                      >
                        <option value="">Select Size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="XXXL">XXXL</option>
                      </select>
                      {showErrors && errors[`member_size_${idx}`] && <span className="cdfm-inline-error">{errors[`member_size_${idx}`]}</span>}
                    </div>
                  </div>
                  <div className="cdfm-row-actions">
                    {members.length > 1 && (
                      <button type="button" className="cdfm-remove-row" aria-label="Delete row" title="Delete row" onClick={() => removeMemberRow(idx)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping Method and Notes Container */}
          <div className="cdfm-shipping-notes-container">
            {/* Shipping Method */}
            <section className="cdfm-card cdfm-shipping-section">
              <h3 className="cdfm-card-title">Shipping Method</h3>
              <div className="cdfm-field">
                <div className="cdfm-shipping-methods">
                  <button
                    type="button"
                    className={`cdfm-shipping-option ${shippingMethod === 'pickup' ? 'active' : ''}`}
                    onClick={() => setShippingMethod('pickup')}
                  >
                    <div className="cdfm-shipping-option-title">Store Pickup</div>
                    <div className="cdfm-shipping-option-desc">Free</div>
                  </button>
                  <button
                    type="button"
                    className={`cdfm-shipping-option ${shippingMethod === 'delivery' ? 'active' : ''}`}
                    onClick={() => setShippingMethod('delivery')}
                  >
                    <div className="cdfm-shipping-option-title">Delivery</div>
                    <div className="cdfm-shipping-option-desc">₱{DELIVERY_FEE}</div>
                  </button>
                </div>
              </div>
            </section>

            {/* Notes/Message Section */}
            <section className="cdfm-card cdfm-notes-section">
              <h3 className="cdfm-card-title">Notes/Message to Yohanns</h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Please Leave A Message ......"
                className="cdfm-notes-textarea"
                rows="4"
              />
            </section>
          </div>

          {/* Pickup Location - Show only if pickup is selected */}
          {shippingMethod === 'pickup' && (
            <section className="cdfm-card">
              <h3 className="cdfm-card-title">Pickup Location</h3>
              <div className="cdfm-field">
                <label>Select a branch <span className="cdfm-required">*</span></label>
                <select
                  className={`cdfm-field select ${showErrors && errors.pickup ? 'error' : ''}`}
                  value={pickupBranchId}
                  onChange={(e) => {
                    setPickupBranchId(e.target.value);
                    // Clear error when user selects a branch
                    if (showErrors && e.target.value) {
                      setShowErrors(false);
                    }
                  }}
                >
                  <option value="">Choose a pickup location</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {pickupBranchId && (
                  <small className="cdfm-helper">{branches.find(b => b.id === pickupBranchId)?.address}</small>
                )}
              </div>
            </section>
          )}

          {/* Delivery Address - Show only if delivery is selected */}
          {shippingMethod === 'delivery' && (
            <section className="cdfm-card">
              <h3 className="cdfm-card-title">Delivery Address</h3>
              <div className="cdfm-field">
                <label>Complete Address <span className="cdfm-required">*</span></label>
                <div className="cdfm-input-wrapper">
                  <textarea
                    className={`cdfm-delivery-textarea ${showErrors && errors.deliveryAddress ? 'error' : ''}`}
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      // Clear error when user starts typing
                      if (showErrors && e.target.value.trim()) {
                        setShowErrors(false);
                      }
                    }}
                    placeholder="Enter your complete delivery address"
                    rows="3"
                  />
                  {showErrors && errors.deliveryAddress && <span className="cdfm-inline-error">{errors.deliveryAddress}</span>}
                </div>
                <small className="cdfm-helper" style={{color: '#00bfff', marginTop: '8px', display: 'block'}}>
                  Delivery Fee: ₱{DELIVERY_FEE}
                </small>
              </div>
            </section>
          )}

          {/* Summary */}
          <section className="cdfm-card">
            <button type="button" className="cdfm-summary-toggle" onClick={() => setShowSummary(s => !s)}>
              {showSummary ? 'Hide' : 'Show'} Order Summary
            </button>
            {showSummary && (
              <div className="cdfm-summary-content">
                <div><strong>Team Name:</strong> {teamName || '-'}</div>
                <div><strong>Team Members:</strong> {members.length} {members.length === 1 ? 'member' : 'members'}</div>
                <div><strong>Shipping:</strong> {shippingMethod === 'pickup' ? 'Store Pickup (Free)' : `Delivery (₱${DELIVERY_FEE})`}</div>
                <div><strong>Design Images:</strong> {images.length} {images.length === 1 ? 'image' : 'images'}</div>
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="cdfm-submit-bar">
            <div className="cdfm-submit-bar-inner">
              <button 
                className="cdfm-submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </button>
              {showErrors && hasErrors && (
                <span className="cdfm-submit-hint">Complete all required fields to submit</span>
              )}
            </div>
          </div>
        </form>

        {confirmation && (
          <div className="cdfm-confirm-overlay" onClick={() => setConfirmation(null)}>
            <div className="cdfm-confirm-modal" onClick={e => e.stopPropagation()}>
              <h3>Order Submitted</h3>
              <p>Reference Number: <strong>{confirmation.reference}</strong></p>
              {confirmation.shippingMethod === 'pickup' && (
                <p>Pickup Location: <strong>{confirmation.pickup}</strong></p>
              )}
              {confirmation.shippingMethod === 'delivery' && (
                <>
                  <p>Delivery Address: <strong>{confirmation.deliveryAddress}</strong></p>
                  <p>Delivery Fee: <strong>₱{confirmation.deliveryFee}</strong></p>
                </>
              )}
              <button onClick={() => { setConfirmation(null); onClose(); }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


