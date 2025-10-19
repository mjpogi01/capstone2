import React from 'react';
import { FaTimes, FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import './WishlistModal.css';

const WishlistModal = () => {
  const { 
    wishlistItems, 
    isWishlistOpen, 
    closeWishlist, 
    removeFromWishlist, 
    isLoading, 
    error 
  } = useWishlist();
  
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, {
        size: 'M',
        quantity: 1,
        isTeamOrder: false
      });
      // Optionally show success message
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  return (
    <div className="wishlist-modal-overlay" onClick={closeWishlist}>
      <div className="wishlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wishlist-header">
          <h2 className="wishlist-title">
            My Wishlist
          </h2>
          <button className="wishlist-close-btn" onClick={closeWishlist}>
            <FaTimes />
          </button>
        </div>

        <div className="wishlist-content">
          {isLoading ? (
            <div className="wishlist-loading">
              <div className="loading-spinner"></div>
              <p>Loading your wishlist...</p>
            </div>
          ) : error ? (
            <div className="wishlist-error">
              <p>Error loading wishlist: {error}</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="wishlist-empty">
              <FaHeart className="empty-heart-icon" />
              <h3>Your wishlist is empty</h3>
              <p>Start adding items you love to your wishlist!</p>
            </div>
          ) : (
            <div className="wishlist-items">
              {wishlistItems.map((item) => (
                <div key={item.id} className="wishlist-item">
                  <div className="wishlist-item-image">
                    <img 
                      src={item.image || '/images/placeholder-jersey.png'} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/images/placeholder-jersey.png';
                      }}
                    />
                  </div>
                  
                  <div className="wishlist-item-details">
                    <h3 className="wishlist-item-name">{item.name}</h3>
                    <p className="wishlist-item-category">{item.category}</p>
                    <p className="wishlist-item-price">₱ {item.price.toFixed(2)}</p>
                    <p className="wishlist-item-date">
                      Added on {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="wishlist-item-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(item)}
                      title="Add to Cart"
                    >
                      <FaShoppingCart />
                      Add to Cart
                    </button>
                    
                    <button 
                      className="remove-from-wishlist-btn"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      title="Remove from Wishlist"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wishlistItems.length > 0 && (
          <div className="wishlist-footer">
            <p className="wishlist-count">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} in your wishlist
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistModal;
