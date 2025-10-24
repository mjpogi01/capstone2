import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
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
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useModal();
  
  const productsPerPage = 12;

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

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

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
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

          {/* Search and Filters Bar */}
          <div className="shop-filter-bar">
            <div className="shop-search-wrapper">
              <FaSearch className="shop-search-icon" />
              <input
                type="text"
                className="shop-search-input"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="shop-filters-wrapper">
              <div className="shop-filter-group">
                <FaFilter className="shop-filter-icon" />
                <select
                  className="shop-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {getCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="shop-filter-group">
                <FaSortAmountDown className="shop-filter-icon" />
                <select 
                  className="shop-select" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popularity">Popularity</option>
                  <option value="latest">Latest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
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