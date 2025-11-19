import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaTag, FaPercent, FaPaperPlane, FaUsers, FaSpinner } from 'react-icons/fa';
import newsletterService from '../../services/newsletterService';
import { useNotification } from '../../contexts/NotificationContext';
import './EmailMarketing.css';

const EmailMarketing = () => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    discountType: 'none', // 'none', 'percentage', 'fixed'
    discountValue: '',
    promoCode: '',
    ctaText: 'Shop Now',
    ctaLink: '',
    imageUrl: ''
  });
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const result = await newsletterService.getSubscribers();
      if (result.success) {
        setSubscribers(result.subscribers || []);
        setSubscriberCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      showError('Failed to load subscribers', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    const confirmMessage = `Are you sure you want to send this email to ${subscriberCount} subscriber${subscriberCount > 1 ? 's' : ''}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      
      // Build marketing data
      const marketingData = {
        title: formData.title,
        message: formData.message,
        ctaText: formData.ctaText || 'Shop Now',
        ctaLink: formData.ctaLink || window.location.origin,
        imageUrl: formData.imageUrl || '',
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
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          discountType: 'none',
          discountValue: '',
          promoCode: '',
          ctaText: 'Shop Now',
          ctaLink: '',
          imageUrl: ''
        });
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

  const buildEmailPreview = () => {
    let message = formData.message;
    
    if (formData.discountType === 'percentage' && formData.discountValue) {
      message += `\n\n🎉 Special Offer: Get ${formData.discountValue}% OFF on your next purchase!`;
      if (formData.promoCode) {
        message += `\nUse promo code: ${formData.promoCode}`;
      }
    } else if (formData.discountType === 'fixed' && formData.discountValue) {
      message += `\n\n🎉 Special Offer: Get ₱${formData.discountValue} OFF on your next purchase!`;
      if (formData.promoCode) {
        message += `\nUse promo code: ${formData.promoCode}`;
      }
    }

    return message;
  };

  return (
    <div className="email-marketing-container">
      <div className="email-marketing-header">
        <h2>
          <FaEnvelope className="header-icon" />
          Email Marketing
        </h2>
        <div className="subscriber-info">
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
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                <FaEnvelope className="label-icon" />
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

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">
                <FaEnvelope className="label-icon" />
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
              <h3>Call to Action</h3>
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

            {/* Image URL (Optional) */}
            <div className="form-group">
              <label htmlFor="imageUrl">Image URL (Optional)</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/promo-image.jpg"
              />
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
                <div className="preview-content">
                  <div className="preview-header">
                    <h3>{formData.title || 'Email Title'}</h3>
                  </div>
                  <div className="preview-body">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{buildEmailPreview() || 'Your message will appear here...'}</p>
                    {formData.ctaText && (
                      <div className="preview-cta">
                        <button className="cta-button">{formData.ctaText}</button>
                      </div>
                    )}
                  </div>
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
                    Send to {subscriberCount} Subscriber{subscriberCount !== 1 ? 's' : ''}
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
    </div>
  );
};

export default EmailMarketing;

