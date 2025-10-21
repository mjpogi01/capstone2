import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderTrackingService from '../../services/orderTrackingService';
import './SimpleOrderReview.css';

const SimpleOrderReview = ({ orderId, orderNumber, onReviewSubmit }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(true);

  // Define checkExistingReview first (before useEffect that calls it)
  const checkExistingReview = async () => {
    try {
      setLoadingReview(true);
      const review = await orderTrackingService.getOrderReview(orderId);
      setExistingReview(review);
    } catch (error) {
      console.error('Error checking existing review:', error);
      setExistingReview(null);
    } finally {
      setLoadingReview(false);
    }
  };

  // Check if user already reviewed this order
  useEffect(() => {
    if (orderId && user) {
      checkExistingReview();
    }
  }, [orderId, user, checkExistingReview]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      showError('Review Error', 'Please enter a comment');
      return;
    }

    if (!user) {
      showError('Auth Error', 'You must be logged in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:4000/api/order-tracking/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          userId: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
          reviewType: 'general'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setNewReview({ rating: 5, comment: '' });
        setShowReviewPopup(false);
        
        // Show success message
        showSuccess('Review Submitted', 'Thank you for your review!');
        
        // Notify parent component
        if (onReviewSubmit) {
          onReviewSubmit(data.review);
        }
      } else {
        showError('Review Error', data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Review Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Simple Write Review Button */}
      <div className="simple-review-section">
        {loadingReview ? (
          <button className="write-review-btn" disabled>
            Loading...
          </button>
        ) : existingReview ? (
          <div className="existing-review-badge">
            <FaCheck className="check-icon" />
            <span>You already reviewed this order</span>
          </div>
        ) : (
          <button 
            className="write-review-btn"
            onClick={() => setShowReviewPopup(true)}
          >
            <FaStar className="review-icon" />
            Write a Review
          </button>
        )}
      </div>

      {/* Review Popup Modal */}
      {showReviewPopup && (
        <div className="review-popup-overlay" onClick={() => setShowReviewPopup(false)}>
          <div className="review-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="review-popup-header">
              <h3>Write Your Review</h3>
              <button 
                className="close-popup-btn"
                onClick={() => setShowReviewPopup(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReview} className="review-popup-form">
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview({ ...newReview, rating })
                  )}
                  <span className="rating-text">
                    {newReview.rating === 1 ? 'Poor' : 
                     newReview.rating === 2 ? 'Fair' :
                     newReview.rating === 3 ? 'Good' :
                     newReview.rating === 4 ? 'Very Good' : 'Excellent'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Share your experience with this order..."
                  className="review-comment"
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowReviewPopup(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || !newReview.comment.trim()}
                  className="submit-btn"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleOrderReview;
