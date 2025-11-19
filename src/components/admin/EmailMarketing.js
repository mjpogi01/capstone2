import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaTag, FaPercent, FaPaperPlane, FaUsers, FaSpinner, FaEdit, FaImage, FaMousePointer } from 'react-icons/fa';
import newsletterService from '../../services/newsletterService';
import { useNotification } from '../../contexts/NotificationContext';
import './EmailMarketing.css';

// Confirmation Modal Component
const EmailConfirmModal = ({ subscriberCount, formData, sending, onConfirm, onCancel }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !sending) {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel, sending]);

  return (
    <div className="email-confirm-modal-overlay" onClick={onCancel}>
      <div className="email-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-confirm-header">
          <h3>Confirm Email Send</h3>
        </div>
        <div className="email-confirm-content">
          <p>Are you sure you want to send this marketing email?</p>
          <div className="email-confirm-details">
            <p><strong>Recipients:</strong> {subscriberCount} Active Subscriber{subscriberCount !== 1 ? 's' : ''}</p>
            <p><strong>Title:</strong> {formData.title || 'N/A'}</p>
            {formData.discountType !== 'none' && formData.discountValue && (
              <p>
                <strong>Discount:</strong> 
                {formData.discountType === 'percentage' 
                  ? ` ${formData.discountValue}% OFF`
                  : ` ₱${formData.discountValue} OFF`}
                {formData.promoCode && ` (Code: ${formData.promoCode})`}
              </p>
            )}
          </div>
          <p className="email-confirm-warning">
            ⚠️ This action cannot be undone. The email will be sent to all active subscribers.
          </p>
        </div>
        <div className="email-confirm-actions">
          <button
            type="button"
            className="email-confirm-cancel"
            onClick={onCancel}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="email-confirm-send"
            onClick={onConfirm}
            disabled={sending}
          >
            {sending ? (
              <>
                <FaSpinner className="spinner" />
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmailMarketing = () => {
  const { showSuccess, showError } = useNotification();
  // Load default logo URL from localStorage
  const getDefaultLogoUrl = () => {
    const saved = localStorage.getItem('emailMarketing_logoUrl');
    if (saved) return saved;
    // Auto-construct Cloudinary URL if cloud name is available
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/yohanns-logo.png`;
    }
    // Fallback to client URL
    return `${window.location.origin}/yohanns-logo.png`;
  };

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    discountType: 'none', // 'none', 'percentage', 'fixed'
    discountValue: '',
    promoCode: '',
    ctaText: 'Shop Now',
    ctaLink: '',
    imageUrl: '',
    logoUrl: getDefaultLogoUrl()
  });
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [countUpdating, setCountUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const intervalRef = useRef(null);
  const previousCountRef = useRef(0);
  const subscriberInfoRef = useRef(null);

  // Fetch subscribers function with optional silent refresh
  const fetchSubscribers = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setCountUpdating(true);
      }
      
      const result = await newsletterService.getSubscribers();
      if (result.success) {
        const newCount = result.count || 0;
        const newSubscribers = result.subscribers || [];
        const oldCount = previousCountRef.current || subscriberCount;
        
        // Visual feedback when count changes
        if (oldCount !== newCount && subscriberInfoRef.current) {
          subscriberInfoRef.current.classList.add('count-update');
          setTimeout(() => {
            if (subscriberInfoRef.current) {
              subscriberInfoRef.current.classList.remove('count-update');
            }
          }, 500);
        }
        
        setSubscribers(newSubscribers);
        setSubscriberCount(newCount);
        
        // Show notification if count increased (new subscriber)
        if (!silent && oldCount > 0 && newCount > oldCount) {
          const difference = newCount - oldCount;
          showSuccess(
            'New Subscriber!', 
            `${difference} new subscriber${difference > 1 ? 's' : ''} joined! Total: ${newCount}`
          );
        }
        
        previousCountRef.current = newCount;
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      if (!silent) {
        showError('Failed to load subscribers', error.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setTimeout(() => setCountUpdating(false), 300);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSubscribers(false);
    
    // Poll for updates every 5 seconds (real-time updates)
    intervalRef.current = setInterval(() => {
      fetchSubscribers(true); // Silent refresh
    }, 5000);
    
    // Refetch when window gains focus (user switches back to tab)
    const handleFocus = () => {
      fetchSubscribers(true); // Silent refresh on focus
    };
    
    // Refetch when visibility changes (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSubscribers(true); // Silent refresh when tab becomes visible
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - we only want this to run once on mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Save logoUrl to localStorage when it changes
    if (name === 'logoUrl' && value) {
      localStorage.setItem('emailMarketing_logoUrl', value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      showError('Validation Error', 'Title and message are required');
      return;
    }

    if (formData.discountType !== 'none' && !formData.discountValue) {
      showError('Validation Error', 'Please enter a discount value');
      return;
    }

    if (subscriberCount === 0) {
      showError('No Subscribers', 'There are no active subscribers to send emails to');
      return;
    }

    // Show confirmation modal instead of window.confirm
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    
    try {
      setSending(true);
      
      // Build marketing data
      const marketingData = {
        title: formData.title,
        message: formData.message,
        ctaText: formData.ctaText || 'Shop Now',
        ctaLink: formData.ctaLink || window.location.origin,
        imageUrl: formData.imageUrl || '',
        logoUrl: formData.logoUrl || getDefaultLogoUrl(),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        promoCode: formData.promoCode
      };

      const result = await newsletterService.sendMarketingEmail(marketingData);
      
      if (result.success) {
        showSuccess(
          'Email Sent Successfully', 
          `Marketing email sent to ${result.sent} subscriber${result.sent > 1 ? 's' : ''}${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
        );
        
        // Refresh subscriber count after sending (in case of unsubscribes)
        fetchSubscribers(true);
        
        // Reset form (keep logoUrl as it's a default setting)
        setFormData(prev => ({
          title: '',
          message: '',
          discountType: 'none',
          discountValue: '',
          promoCode: '',
          ctaText: 'Shop Now',
          ctaLink: '',
          imageUrl: '',
          logoUrl: prev.logoUrl // Keep the logo URL
        }));
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending marketing email:', error);
      showError('Failed to Send Email', error.message || 'An error occurred while sending the email');
    } finally {
      setSending(false);
    }
  };

  const buildEmailPreviewHTML = () => {
    const { title, message, discountType, discountValue, promoCode, ctaText, ctaLink, imageUrl, logoUrl } = formData;
    const clientUrl = window.location.origin;
    // Use logoUrl from form, or get default
    const logoUrlToUse = logoUrl || getDefaultLogoUrl();
    
    // Build discount section
    let discountSection = '';
    if (discountType === 'percentage' && discountValue) {
      discountSection = `
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">Special Discount!</p>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Get ${discountValue}% OFF on your next purchase!</p>
          ${promoCode ? `<p style="margin: 10px 0 0 0; font-size: 16px;">Use code: <strong>${promoCode}</strong></p>` : ''}
        </div>
      `;
    } else if (discountType === 'fixed' && discountValue) {
      discountSection = `
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">Special Discount!</p>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Get ₱${discountValue} OFF on your next purchase!</p>
          ${promoCode ? `<p style="margin: 10px 0 0 0; font-size: 16px;">Use code: <strong>${promoCode}</strong></p>` : ''}
        </div>
      `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'Special Offer from Yohanns'}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header-logo {
                max-width: 200px;
                height: auto;
                margin: 0 auto 15px;
                display: block;
            }
            .header p {
                margin: 0;
                font-size: 18px;
            }
            .content {
                padding: 30px;
            }
            .image-container {
                text-align: center;
                margin: 20px 0;
            }
            .image-container img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
            }
            .message {
                white-space: pre-wrap;
                margin: 20px 0;
                line-height: 1.8;
            }
            .cta-button {
                display: inline-block;
                padding: 15px 40px;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                background-color: #1a1a2e;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 14px;
            }
            .footer a {
                color: #00bfff;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrlToUse}" alt="YOHANNS" class="header-logo" />
                <p>${title || 'Special Offer'}</p>
            </div>
            
            <div class="content">
                ${imageUrl ? `<div class="image-container"><img src="${imageUrl}" alt="Promo Image" /></div>` : ''}
                
                ${discountSection}
                
                <div class="message">${message || ''}</div>
                
                <div style="text-align: center;">
                    <a href="${ctaLink || clientUrl}" class="cta-button">
                        ${ctaText || 'Shop Now'}
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Yohanns - Premium Sports Apparel</strong></p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p><a href="${clientUrl}/unsubscribe">Unsubscribe</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return html;
  };

  return (
    <div className="email-marketing-container">
      <div className="email-marketing-header">
        <h2>
          <FaEnvelope className="header-icon" />
          Email Marketing
        </h2>
        <div 
          ref={subscriberInfoRef}
          className={`subscriber-info ${countUpdating ? 'updating' : ''}`}
        >
          <FaUsers className="subscriber-icon" />
          <span>{subscriberCount} Active Subscriber{subscriberCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>Loading subscribers...</p>
        </div>
      ) : (
        <div className="email-marketing-content">
          <form onSubmit={handleSubmit} className="email-marketing-form">
            {/* Subject Section */}
            <div className="form-section">
              <h3>
                <FaEnvelope className="section-icon" />
                Subject
              </h3>
              
              <div className="form-group">
                <label htmlFor="title">
                  Email Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Sale - 50% OFF!"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            {/* Compose Email Section */}
            <div className="form-section">
              <h3>
                <FaEdit className="section-icon" />
                Compose Email
              </h3>
              
              <div className="form-group">
                <label htmlFor="message">
                  Email Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Write your marketing message here..."
                  required
                  rows={6}
                  maxLength={2000}
                />
                <div className="char-count">{formData.message.length}/2000</div>
              </div>
            </div>

            {/* Discount/Promo Section */}
            <div className="form-section">
              <h3>
                <FaTag className="section-icon" />
                Discount & Promo (Optional)
              </h3>
              
              <div className="form-group">
                <label htmlFor="discountType">Discount Type</label>
                <select
                  id="discountType"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              {formData.discountType !== 'none' && (
                <>
                  <div className="form-group">
                    <label htmlFor="discountValue">
                      {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₱)'} *
                    </label>
                    <div className="input-with-icon">
                      {formData.discountType === 'percentage' ? (
                        <FaPercent className="input-icon" />
                      ) : (
                        <span className="currency-icon">₱</span>
                      )}
                      <input
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        placeholder={formData.discountType === 'percentage' ? 'e.g., 50' : 'e.g., 500'}
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        required={formData.discountType !== 'none'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="promoCode">Promo Code (Optional)</label>
                    <input
                      type="text"
                      id="promoCode"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      placeholder="e.g., SUMMER50"
                      maxLength={20}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Call to Action */}
            <div className="form-section">
              <h3>
                <FaMousePointer className="section-icon" />
                Call to Action
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ctaText">Button Text</label>
                  <input
                    type="text"
                    id="ctaText"
                    name="ctaText"
                    value={formData.ctaText}
                    onChange={handleInputChange}
                    placeholder="Shop Now"
                    maxLength={30}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ctaLink">Button Link</label>
                  <input
                    type="url"
                    id="ctaLink"
                    name="ctaLink"
                    value={formData.ctaLink}
                    onChange={handleInputChange}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>
            </div>

            {/* Media & Assets Section */}
            <div className="form-section">
              <h3>
                <FaImage className="section-icon" />
                Media & Assets
              </h3>
              
              <div className="form-group">
                <label htmlFor="logoUrl">
                  Logo URL (Header) *
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://res.cloudinary.com/your-cloud/image/upload/yohanns-logo.png"
                  required
                />
                <small className="form-help-text">
                  Logo displayed in email header. This will be saved as your default logo URL.
                  <br />
                  Recommended: Use Cloudinary CDN URL for better email deliverability.
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="imageUrl">Promotional Image URL (Optional)</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/promo-image.jpg"
                />
                <small className="form-help-text">Add a promotional image to make your email more engaging</small>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="form-actions">
              <button
                type="button"
                className="preview-btn"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {/* Email Preview */}
            {previewMode && (
              <div className="email-preview">
                <h4>Email Preview</h4>
                <div className="preview-iframe-container">
                  <iframe
                    title="Email Preview"
                    srcDoc={buildEmailPreviewHTML()}
                    className="preview-iframe"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="submit-section">
              <button
                type="submit"
                className="send-email-btn"
                disabled={sending || subscriberCount === 0}
              >
                {sending ? (
                  <>
                    <FaSpinner className="spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send to Subscribers
                  </>
                )}
              </button>
              {subscriberCount === 0 && (
                <p className="no-subscribers-warning">
                  No active subscribers. Customers need to subscribe to the newsletter first.
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <EmailConfirmModal
          subscriberCount={subscriberCount}
          formData={formData}
          sending={sending}
          onConfirm={handleConfirmSend}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default EmailMarketing;

