import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import './SimpleOrderReview.css';

const SimpleOrderReview = ({ orderId, orderNumber, onReviewSubmit }) => {
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/order-tracking/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          userId: 'current-user-id', // Replace with actual user ID
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
        
        // Notify parent component
        if (onReviewSubmit) {
          onReviewSubmit(data.review);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
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
        <button 
          className="write-review-btn"
          onClick={() => setShowReviewPopup(true)}
        >
          <FaStar className="review-icon" />
          Write a Review
        </button>
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
