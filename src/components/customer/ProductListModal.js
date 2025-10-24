import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaFilter, FaSortAmountDown, FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCart } from '../../contexts/CartContext';
import productService from '../../services/productService';
import ProductModal from './ProductModal';
import './ProductListModal.css';
import Loading from '../Loading';
import ErrorState from '../ErrorState';

const ProductListModal = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // New filter states for Shopee-style sidebar
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useModal();
  const { addToCart } = useCart();
  
  const productsPerPage = 12;

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPriceDropdown && !event.target.closest('.price-dropdown-wrapper')) {
        setShowPriceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPriceDropdown]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, selectedCategories, sortBy, priceMin, priceMax, selectedRating]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category (sidebar checkboxes)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category));
    } else if (selectedCategory !== 'All') {
      // Fallback to old category filter
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by price range
    if (priceMin !== '' && priceMin !== null) {
      filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(priceMin));
    }
    if (priceMax !== '' && priceMax !== null) {
      filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(priceMax));
    }

    // Filter by rating
    if (selectedRating !== null) {
      filtered = filtered.filter(product => {
        const rating = product.average_rating || 0;
        return rating >= selectedRating;
      });
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0));
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const getCategories = () => {
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
    return categories;
  };

  const getCategoriesForSidebar = () => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handlePriceFilter = () => {
    filterAndSortProducts();
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceMin('');
    setPriceMax('');
    setSelectedRating(null);
    setSearchTerm('');
  };

  const handleProductClick = (product) => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleToggleWishlist = async (product, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    await toggleWishlist(product);
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    await addToCart(product, 1, null, null); // product, quantity, size, customization
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <>
      <div className="shop-overlay" onClick={onClose}>
        <div className="shop-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="shop-header">
            <h1 className="shop-title">Shop Our Products</h1>
            <button className="shop-close-btn" onClick={onClose} aria-label="Close">
              <FaTimes />
            </button>
          </div>

          {/* Sort Bar */}
          <div className="shop-filter-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sort-label">Sort by</div>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => setSortBy('name')}
              >
                Relevance
              </button>
              <button
                className={`sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
                onClick={() => setSortBy('latest')}
              >
                Latest
              </button>
              <button
                className={`sort-btn ${sortBy === 'popularity' ? 'active' : ''}`}
                onClick={() => setSortBy('popularity')}
              >
                Top Sales
              </button>
              <div className="price-dropdown-wrapper">
                <button
                  className={`sort-btn price-btn ${sortBy === 'price-low' || sortBy === 'price-high' ? 'active' : ''}`}
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                >
                  Price
                  <FaChevronDown className={`price-arrow ${showPriceDropdown ? 'rotated' : ''}`} />
                </button>
                {showPriceDropdown && (
                  <div className="price-dropdown-menu">
                    <button
                      className={`price-option ${sortBy === 'price-low' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('price-low');
                        setShowPriceDropdown(false);
                      }}
                    >
                      Lowest to Highest
                    </button>
                    <button
                      className={`price-option ${sortBy === 'price-high' ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy('price-high');
                        setShowPriceDropdown(false);
                      }}
                    >
                      Highest to Lowest
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="results-count">
              1/{filteredProducts.length}
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="shop-content-wrapper">
            {/* Left Sidebar - Shopee Style Filters */}
            <div className="shop-sidebar">
              <div className="sidebar-section">
                <h3 className="sidebar-title">All Filters</h3>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>

              {/* By Category */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">By Category</h4>
                <div className="category-list">
                  {getCategoriesForSidebar()
                    .slice(0, showAllCategories ? undefined : 3)
                    .map(category => (
                      <label key={category} className="category-item">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="category-checkbox"
                        />
                        <span className="category-label">{category}</span>
                      </label>
                    ))}
                </div>
                {getCategoriesForSidebar().length > 3 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                  >
                    {showAllCategories ? (
                      <>
                        Less <FaChevronUp className="arrow-icon" />
                      </>
                    ) : (
                      <>
                        More <FaChevronDown className="arrow-icon" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Price Range</h4>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="price-input"
                  />
                  <span className="price-separator">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="price-input"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Rating</h4>
                <div className="rating-list">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      className={`rating-item ${selectedRating === rating ? 'active' : ''}`}
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    >
                      <div className="rating-stars">
                        {[...Array(5)].map((_, index) => (
                          <FaStar
                            key={index}
                            className={index < rating ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      {rating < 5 && <span className="rating-up">& Up</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content Area */}
          <div className="shop-content">
            {loading ? (
              <Loading message="Loading products..." />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchProducts} />
            ) : filteredProducts.length === 0 ? (
              <div className="shop-empty-state">
                <p>No products found</p>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {currentProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="product-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div 
                        className="product-card-clickable"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="product-card-image">
                          {product.main_image || product.image_url ? (
                            <img 
                              src={product.main_image || product.image_url} 
                              alt={product.name}
                              className="product-img"
                            />
                          ) : (
                            <span className="product-placeholder">🏀</span>
                          )}
                        </div>
                        
                        <div className="product-card-info">
                          <h3 className="product-card-name">{product.name}</h3>
                        </div>
                      </div>
                      
                      <div className="product-card-footer">
                        <div className="product-footer-top">
                          <div className="product-card-price">
                            ₱{parseFloat(product.price).toLocaleString('en-US', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </div>
                          <button
                            className="product-wishlist-btn"
                            onClick={(e) => handleToggleWishlist(product, e)}
                            aria-label="Add to wishlist"
                          >
                            {isInWishlist(product.id) ? (
                              <AiFillHeart className="wishlist-icon filled" />
                            ) : (
                              <AiOutlineHeart className="wishlist-icon" />
                            )}
                          </button>
                        </div>
                        
                        {/* Review Rating and Sold Quantity */}
                        {((product.average_rating > 0) || (product.sold_quantity > 0)) && (
                          <div className="product-stats">
                            {product.average_rating > 0 && (
                              <div className="product-reviews">
                                <FaStar className="review-star" />
                                <span className="review-rating">{product.average_rating.toFixed(1)}</span>
                                {product.review_count > 0 && (
                                  <span className="review-count">({product.review_count})</span>
                                )}
                              </div>
                            )}
                            {product.sold_quantity > 0 && (
                              <div className="product-sold">
                                <span className="sold-count">{product.sold_quantity} sold</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button
                          className="add-to-cart-btn"
                          onClick={(e) => handleAddToCart(product, e)}
                          aria-label="Add to cart"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="shop-pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="shop-page-btn"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`shop-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className="shop-page-dots">...</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="shop-page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="shop-results-info">
                  Showing {indexOfFirstProduct + 1} - {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </>
  );
};

export default ProductListModal;