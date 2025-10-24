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

const initialMember = { number: '', surname: '' };

export default function CustomDesignFormModal({ isOpen, onClose }) {
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [images, setImages] = useState([]); // {file, url}
  const [members, setMembers] = useState([ { ...initialMember } ]);
  const [pickupBranchId, setPickupBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);

  const errors = useMemo(() => {
    const e = {};
    if (!clientName.trim()) e.clientName = 'Client name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (!/^\+?[0-9\-()\s]{7,}$/.test(phone)) e.phone = 'Enter a valid phone number';
    if (!teamName.trim()) e.teamName = 'Team name is required';
    if (!pickupBranchId) e.pickup = 'Please select a pickup location';

    // Roster validation
    const numbers = new Set();
    members.forEach((m, idx) => {
      if (!m.number) e[`member_number_${idx}`] = 'Required';
      if (!m.surname?.trim()) e[`member_surname_${idx}`] = 'Required';
      if (m.number) {
        if (numbers.has(m.number)) e[`member_number_${idx}`] = 'Duplicate jersey number';
        numbers.add(m.number);
      }
    });
    return e;
  }, [clientName, email, phone, teamName, pickupBranchId, members]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation message
    setValidationMessage(null);
    
    // Check for errors before submission
    if (hasErrors) {
      // Count error types for a clean message
      const errorFields = [];
      if (errors.clientName || errors.email || errors.phone) errorFields.push('Client Information');
      if (errors.teamName) errorFields.push('Team Name');
      if (errors.pickup) errorFields.push('Pickup Location');
      
      // Check for member errors
      const hasMemberErrors = Object.keys(errors).some(key => key.startsWith('member_'));
      if (hasMemberErrors) errorFields.push('Team Roster');
      
      setValidationMessage({
        type: 'error',
        title: 'Please Complete Required Fields',
        fields: errorFields
      });
      
      // Scroll to top to show notification
      document.querySelector('.cdfm-form')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Simulate submit
      await new Promise(res => setTimeout(res, 1200));
      const ref = 'CD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setConfirmation({ reference: ref, pickup: branches.find(b => b.id === pickupBranchId)?.name });
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
          {/* Validation Notification */}
          {validationMessage && (
            <div className={`validation-notification ${validationMessage.type}`}>
              <div className="validation-header">
                <span className="validation-icon">⚠️</span>
                <strong>{validationMessage.title}</strong>
                <button 
                  type="button" 
                  className="validation-close"
                  onClick={() => setValidationMessage(null)}
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
              {validationMessage.fields && validationMessage.fields.length > 0 && (
                <ul className="validation-list">
                  {validationMessage.fields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Client Information */}
          <section className="card">
            <h3 className="card-title">Client Information</h3>
            <div className="grid two">
              <div className={`field ${errors.clientName ? 'error' : ''}`}>
                <label>Client Name <span className="required">*</span></label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name" />
                {errors.clientName && <span className="error-text">{errors.clientName}</span>}
              </div>
              <div className={`field ${errors.email ? 'error' : ''}`}>
                <label>Contact Email <span className="required">*</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className={`field ${errors.phone ? 'error' : ''}`}>
                <label>Phone Number <span className="required">*</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +63 912 345 6789" />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>
          </section>

          {/* Team Details */}
          <section className="card">
            <div className="card-title-row">
              <h3 className="card-title">Team Details</h3>
              <span className="char-count">{teamName.length}/50</span>
            </div>
            <div className={`field ${errors.teamName ? 'error' : ''}`}>
              <label>Team Name <span className="required">*</span></label>
              <input maxLength={50} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name" />
              {errors.teamName && <span className="error-text">{errors.teamName}</span>}
            </div>
          </section>

          {/* Image Upload */}
          <section className="card">
            <h3 className="card-title">Design Image Upload</h3>
            <div className="upload-area"
                 onDrop={handleDrop}
                 onDragOver={(e) => e.preventDefault()}>
              <input id="file-input" type="file" accept="image/*" multiple onChange={handleFileInput} />
              <label htmlFor="file-input" className="upload-label">
                <span className="upload-icon">⬆️</span>
                Drag & drop images here or click to upload
              </label>
            </div>
            {images.length > 0 && (
              <div className="preview-grid">
                {images.map((img, i) => (
                  <div key={i} className="preview-item">
                    <img src={img.url} alt={`design-${i}`} />
                    <button type="button" className="delete-thumb" onClick={() => removeImage(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Team Members Roster */}
          <section className="card">
            <div className="card-title-row">
              <h3 className="card-title">Team Members Roster</h3>
              <button type="button" className="add-row" onClick={addMemberRow} aria-label="Add row" title="Add row">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="roster-table">
              <div className="roster-head">
                <div>Jersey # <span className="required">*</span></div>
                <div>Surname <span className="required">*</span></div>
                <div></div>
              </div>
              {members.map((m, idx) => (
                <div key={idx} className="roster-row">
                  <div className={`field ${errors[`member_number_${idx}`] ? 'error' : ''}`}>
                    <input type="number" min="0" value={m.number}
                           onChange={e => updateMember(idx, 'number', e.target.value)}
                           placeholder="e.g. 23" />
                    {errors[`member_number_${idx}`] && <span className="error-text">{errors[`member_number_${idx}`]}</span>}
                  </div>
                  <div className={`field ${errors[`member_surname_${idx}`] ? 'error' : ''}`}>
                    <input value={m.surname}
                           onChange={e => updateMember(idx, 'surname', e.target.value)}
                           placeholder="Surname" />
                    {errors[`member_surname_${idx}`] && <span className="error-text">{errors[`member_surname_${idx}`]}</span>}
                  </div>
                  <div className="row-actions">
                    {members.length > 1 && (
                      <button type="button" className="remove-row" aria-label="Delete row" title="Delete row" onClick={() => removeMemberRow(idx)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pickup Location */}
          <section className="card">
            <h3 className="card-title">Pickup Location</h3>
            <div className={`field ${errors.pickup ? 'error' : ''}`}>
              <label>Select a branch <span className="required">*</span></label>
              <select
                className="select"
                value={pickupBranchId}
                onChange={(e) => setPickupBranchId(e.target.value)}
              >
                <option value="">Choose a pickup location</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {pickupBranchId && (
                <small className="helper">{branches.find(b => b.id === pickupBranchId)?.address}</small>
              )}
              {errors.pickup && <span className="error-text">{errors.pickup}</span>}
            </div>
          </section>

          {/* Summary */}
          <section className="card">
            <button type="button" className="summary-toggle" onClick={() => setShowSummary(s => !s)}>
              {showSummary ? 'Hide' : 'Show'} Order Summary
            </button>
            {showSummary && (
              <div className="summary-content">
                <div><strong>Client:</strong> {clientName} ({email}, {phone})</div>
                <div><strong>Team:</strong> {teamName}</div>
                <div><strong>Members:</strong> {members.length}</div>
                <div><strong>Pickup:</strong> {branches.find(b => b.id === pickupBranchId)?.name || '-'}</div>
                <div><strong>Images:</strong> {images.length} uploaded</div>
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="submit-bar">
            <div className="submit-bar-inner">
              <button 
                className="submit-btn" 
                disabled={isSubmitting || hasErrors}
                title={hasErrors ? 'Please fill all required fields' : ''}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </button>
              {hasErrors && (
                <span className="submit-hint">Complete all required fields to submit</span>
              )}
            </div>
          </div>
        </form>

        {confirmation && (
          <div className="confirm-overlay" onClick={() => setConfirmation(null)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <h3>Order Submitted</h3>
              <p>Reference Number: <strong>{confirmation.reference}</strong></p>
              <p>Pickup Location: <strong>{confirmation.pickup}</strong></p>
              <button onClick={() => { setConfirmation(null); onClose(); }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


