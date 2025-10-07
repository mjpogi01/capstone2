import React, { useState, useRef, useEffect } from 'react';
import './ProductCategories.css';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductModal from './ProductModal'; // Add this import
import ProtectedAction from '../ProtectedAction';
import { useModal } from '../../contexts/ModalContext';
import productService from '../../services/productService';

const ProductCategories = ({ activeCategory, setActiveCategory }) => {
  const [favorites, setFavorites] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Add this state
  const [isModalOpen, setIsModalOpen] = useState(false); // Add this state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { openSignIn } = useModal();

  const toggleFavorite = (productId) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
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

  // Add this function to handle adding to cart
  const handleAddToCart = (cartItem) => {
    console.log('Added to cart:', cartItem);
    // Here you would typically add the item to a cart context or state
    // For now, we'll just log it
  };

  const categories = [
    { id: 'jerseys', name: 'JERSEYS' },
    { id: 't-shirts', name: 'T-SHIRTS' },
    { id: 'long sleeves', name: 'LONG SLEEVES' },
    { id: 'hoodies', name: 'HOODIES' },
    { id: 'uniforms', name: 'UNIFORMS' },
    { id: 'replicated', name: 'REPLICATED JERSEYS' },
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

  const filteredProducts = products.filter(product => 
    product.category && product.category.toLowerCase() === activeCategory.toLowerCase()
  );
  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 6);

  const checkScroll = () => {
    if (navRef.current) {
      setCanScrollLeft(navRef.current.scrollLeft > 0);
      setCanScrollRight(
        navRef.current.scrollWidth > navRef.current.clientWidth + navRef.current.scrollLeft
      );
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
      <div className="category-nav-wrapper">
        {/* LEFT ARROW */}
        {canScrollLeft && (
          <button
            className="scroll-btn left"
            onClick={() => scrollNav("left")}
          >
            <FaChevronLeft />
          </button>
        )}

        <div className="category-nav" ref={navRef}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
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
        {canScrollRight && (
          <button
            className="scroll-btn right"
            onClick={() => scrollNav("right")}
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {/* Products */}
      <div className="products-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">Loading products...</div>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Retry
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {displayedProducts.map(product => (
              <ProtectedAction
                key={product.id}
                onAuthenticated={() => openProductModal(product)}
                onUnauthenticated={() => openSignIn()}
              >
                <div className="product-card">
                  <div className="product-image">
                    {product.main_image ? (
                      <img 
                        src={product.main_image} 
                        alt={product.name}
                        className="product-image-img"
                      />
                    ) : (
                      <span className="product-emoji">🏀</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-brand">Yohann's Sportswear</h3>
                    <p className="product-name">{product.name}</p>
                    <div className="product-price">₱ {parseFloat(product.price).toFixed(2)}</div>
                    <button
                      className="favorite-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent modal from opening when clicking favorite
                        toggleFavorite(product.id);
                      }}
                    >
                      {favorites.includes(product.id) ? (
                        <AiFillHeart color="red" />
                      ) : (
                        <AiOutlineHeart />
                      )}
                    </button>
                  </div>
                </div>
              </ProtectedAction>
            ))}
          </div>
        )}

        {/* View All Button */}
        {filteredProducts.length > 6 && !showAll && (
          <div className="view-all-section">
            <button className="view-all-btn" onClick={() => setShowAll(true)}>
              VIEW ALL
            </button>
          </div>
        )}
      </div>

      {/* Add the ProductModal component */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeProductModal}
        product={selectedProduct}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onAddToCart={handleAddToCart}
      />
    </section>
  );
};

export default ProductCategories;

