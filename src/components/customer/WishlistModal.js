import React, { useEffect, useState } from 'react';
import { FaTimes, FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import ProductModal from './ProductModal';
import './WishlistModal.css';

const WishlistModal = () => {
  const { 
    wishlistItems, 
    isWishlistOpen, 
    closeWishlist, 
    removeFromWishlist, 
    reloadWishlist,
    isLoading, 
    error 
  } = useWishlist();
  
  const { addToCart } = useCart();
  const { showSuccess } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Reload wishlist when modal opens
  useEffect(() => {
    if (isWishlistOpen) {
      reloadWishlist();
    }
  }, [isWishlistOpen, reloadWishlist]);

  if (!isWishlistOpen) return null;

  const handleAddToCart = (product) => {
    // Open ProductModal for the user to configure product details
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleConfirmAddToCart = async (product, cartOptions) => {
    try {
      // Add to cart with the configured options
      await addToCart(product, cartOptions);
      
      // Close the ProductModal
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      
      showSuccess('Added to Cart', `${product.name} has been added to your cart!`);
      
      // Reload wishlist to show the item has been removed
      setTimeout(() => {
        reloadWishlist();
      }, 500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      reloadWishlist();
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
                    <p className="wishlist-item-price">₱ {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
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
      {selectedProduct && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleConfirmAddToCart}
        />
      )}
    </div>
  );
};

export default WishlistModal;
