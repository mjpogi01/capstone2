import React, { useState, useEffect } from 'react';
import { FaTimes, FaShoppingCart, FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaFilter } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import productService from '../../services/productService';
import ProductModal from './ProductModal';
import './ProductListModal.css';

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
  
  const { addToCart } = useCart();
  const { showSuccess, showError } = useNotification();
  
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
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleQuickAddToCart = (product, e) => {
    e.stopPropagation();
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity: 1,
      orderType: 'single',
      orderDetails: {
        surname: '',
        number: '',
        size: 'M'
      }
    };
    addToCart(cartItem);
    showSuccess('Product added to cart!');
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" className="star half" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star empty" />);
    }
    return stars;
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
      <div className="product-list-overlay" onClick={onClose}>
        <div className="product-list-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="product-list-header">
            <h2>Shop Our Products</h2>
            <button className="close-modal-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Filters and Search */}
          <div className="product-list-controls">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <div className="category-filter">
                <FaFilter className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {getCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="sort-dropdown">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
          <div className="product-list-content">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={fetchProducts}>Retry</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>No products found</p>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="product-image-container">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        {product.category && (
                          <span className="product-category-tag">{product.category}</span>
                        )}
                      </div>

                      <div className="product-info">
                        <h3 className="product-title">{product.name}</h3>
                        
                        {product.description && (
                          <p className="product-description">
                            {product.description.length > 60
                              ? `${product.description.substring(0, 60)}...`
                              : product.description}
                          </p>
                        )}

                        <div className="product-rating">
                          {renderStars(product.rating || 4.5)}
                          <span className="rating-count">
                            ({product.review_count || product.sold_quantity || 0})
                          </span>
                        </div>

                        <div className="product-footer">
                          <div className="product-price">
                            ₱{parseFloat(product.price).toLocaleString('en-US', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </div>

                          <button
                            className="quick-add-btn"
                            onClick={(e) => handleQuickAddToCart(product, e)}
                          >
                            <FaShoppingCart /> Add
                          </button>
                        </div>

                        {product.sold_quantity > 0 && (
                          <div className="product-sold">
                            {product.sold_quantity} sold
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className="page-dots">...</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="results-info">
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
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
};

export default ProductListModal;