import React, { useState, useRef, useEffect } from 'react';
import './ProductCategories.css';
import Loading from '../Loading';
import ErrorState from '../ErrorState';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import ProductModal from './ProductModal'; // Add this import
import ProtectedAction from '../ProtectedAction';
import { useModal } from '../../contexts/ModalContext';
// import { useCart } from '../../contexts/CartContext'; // Removed unused import
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import { FaShoppingCart } from "react-icons/fa";

const ProductCategories = ({ activeCategory, setActiveCategory, searchQuery, setSearchQuery }) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Add this state
  const [isModalOpen, setIsModalOpen] = useState(false); // Add this state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productRatings, setProductRatings] = useState({});
  const navRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeScrollSection, setActiveScrollSection] = useState(0);
  const { openSignIn } = useModal();
  // const { addToCart } = useCart(); // Removed unused import
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const handleToggleWishlist = async (product) => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    await toggleWishlist(product);
  };

  // Function to calculate average rating for a product
  const calculateAverageRating = async (productId) => {
    try {
      const reviews = await orderService.getProductReviews(productId);
      if (reviews.length === 0) return null; // No reviews available
      
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = totalRating / reviews.length;
      return averageRating.toFixed(1); // Always show 1 decimal place
    } catch (error) {
      console.error('Error calculating rating for product', productId, error);
      return null; // No rating available on error
    }
  };

  // Add this function to handle opening the modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Add this function to handle closing the modal
  const closeProductModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Removed unused handleAddToCart function

  const categories = [
    { id: 'jerseys', name: 'JERSEYS' },
    { id: 't-shirts', name: 'T-SHIRTS' },
    { id: 'long sleeves', name: 'LONG SLEEVES' },
    { id: 'hoodies', name: 'HOODIES' },
    { id: 'uniforms', name: 'UNIFORMS' },
    { id: 'balls', name: 'BALLS' },
    { id: 'trophies', name: 'TROPHIES' }
  ];

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProducts = await productService.getAllProducts();
        setProducts(fetchedProducts);
        
        // Load ratings asynchronously without blocking the UI
        loadRatingsAsync(fetchedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        // Fallback to empty array
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load ratings asynchronously without blocking the main product load
  const loadRatingsAsync = async (products) => {
    try {
      const ratings = {};
      // Process ratings in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (product) => {
            const averageRating = await calculateAverageRating(product.id);
            ratings[product.id] = averageRating;
          })
        );
        // Update ratings progressively
        setProductRatings(prev => ({ ...prev, ...ratings }));
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter(product =>
        product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products.filter(product => 
        product.category && product.category.toLowerCase() === activeCategory.toLowerCase()
      );
  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 8);
  
  // Debug logging
  console.log(`Category: ${activeCategory}, Total products: ${products.length}, Filtered: ${filteredProducts.length}, Displayed: ${displayedProducts.length}, Show All: ${showAll}, Search: ${searchQuery}`);

  const checkScroll = () => {
    if (navRef.current) {
      setCanScrollLeft(navRef.current.scrollLeft > 0);
      setCanScrollRight(
        navRef.current.scrollWidth > navRef.current.clientWidth + navRef.current.scrollLeft
      );
      
      // Calculate which section (0, 1, or 2) based on scroll position
      const scrollWidth = navRef.current.scrollWidth;
      const clientWidth = navRef.current.clientWidth;
      const scrollLeft = navRef.current.scrollLeft;
      const maxScroll = scrollWidth - clientWidth;
      
      if (maxScroll > 0) {
        const scrollPercentage = (scrollLeft / maxScroll) * 100;
        
        // Divide into 3 sections
        if (scrollPercentage < 33) {
          setActiveScrollSection(0); // Left section
        } else if (scrollPercentage < 66) {
          setActiveScrollSection(1); // Middle section
        } else {
          setActiveScrollSection(2); // Right section
        }
      } else {
        setActiveScrollSection(0);
      }
    }
  };

  const scrollNav = (direction) => {
    if (navRef.current) {
      navRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    // Add a small delay to ensure DOM is updated after category change
    const timeoutId = setTimeout(() => {
      checkScroll();
    }, 100);

    const navEl = navRef.current;
    if (navEl) {
      navEl.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (navEl) {
        navEl.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      }
    };
  }, [activeCategory]); // Add activeCategory to dependency array

  return (
    <section className="product-categories">
      {/* Category Nav */}
      <div className="sportswear-category-nav-wrapper">
        {/* Scroll Radio Indicators - Mobile only */}
        <div className="sportswear-scroll-radio-indicators">
          <span className={`sportswear-radio-dot ${activeScrollSection === 0 ? 'active' : ''}`} />
          <span className={`sportswear-radio-dot ${activeScrollSection === 1 ? 'active' : ''}`} />
          <span className={`sportswear-radio-dot ${activeScrollSection === 2 ? 'active' : ''}`} />
        </div>
        
        {/* LEFT ARROW */}
        <button
          className="sportswear-scroll-btn left"
          onClick={() => scrollNav("left")}
          title="Scroll left"
        >
          <FaChevronLeft />
        </button>

        <div className="sportswear-category-nav" ref={navRef}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`sportswear-category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(category.id);
                setShowAll(false);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* RIGHT ARROW */}
        <button
          className="sportswear-scroll-btn right"
          onClick={() => scrollNav("right")}
          title="Scroll right"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Products */}
      <div className="sportswear-products-container">
        {/* Search Header - Show when searching */}
        {searchQuery.trim() && (
          <div className="sportswear-search-header">
            <div className="sportswear-search-info">
              <h2 className="sportswear-search-title">
                Search Results for: <span className="sportswear-search-query">"{searchQuery}"</span>
              </h2>
              <p className="sportswear-search-count">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              className="sportswear-clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('jerseys');
                setShowAll(false);
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <Loading message="Loading products..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : (
          <div className="sportswear-products-grid">
            {displayedProducts.map(product => (
              <div key={product.id} className="sportswear-product-card">
                <ProtectedAction
                  onAuthenticated={() => openProductModal(product)}
                  onUnauthenticated={() => openSignIn()}
                  className="sportswear-product-clickable-area"
                >
                  <div className="sportswear-product-image-wrapper">
                    {product.main_image ? (
                      <img 
                        src={product.main_image} 
                        alt={product.name}
                        className="sportswear-product-image"
                      />
                    ) : (
                      <span className="sportswear-product-emoji">🏀</span>
                    )}
                  </div>
                  <div className="sportswear-product-info">
                    <p className="sportswear-product-name">{product.name}</p>
                    <div className="sportswear-product-price">₱ {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    <div className="sportswear-product-stats">
                      {productRatings[product.id] && (
                        <span className="sportswear-stat-item">
                          <span className="rating-number">{productRatings[product.id]}</span>
                          <FaStar className="star-icon" />
                        </span>
                      )}
                      {product.sold_quantity > 0 && (
                        <span className="sportswear-stat-item">{product.sold_quantity} sold</span>
                      )}
                    </div>
                    <div className="sportswear-action-buttons">
                      <button 
                        className="sportswear-add-to-cart-btn" 
                        title="Add to Cart"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openProductModal(product);
                        }}
                      >
                        <FaShoppingCart />
                        <span>Add Cart</span>
                      </button>
                      <button 
                        className="sportswear-add-to-favorites-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(product);
                        }}
                        title={isInWishlist(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        {isInWishlist(product.id) ? (
                          <AiFillHeart color="red" />
                        ) : (
                          <AiOutlineHeart />
                        )}
                      </button>
                    </div>
                  </div>
                </ProtectedAction>
              </div>
            ))}
          </div>
        )}

        {/* View All/Show Less Button */}
        {filteredProducts.length > 8 && (
          <div className="sportswear-view-all-section">
            {!showAll ? (
              <button className="sportswear-view-all-btn" onClick={() => setShowAll(true)}>
                SHOW MORE
              </button>
            ) : (
              <button className="sportswear-view-all-btn show-less" onClick={() => setShowAll(false)}>
                SHOW LESS
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add the ProductModal component */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeProductModal}
        product={selectedProduct}
      />
    </section>
  );
};

export default ProductCategories;