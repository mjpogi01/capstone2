import React, { useState, useRef, useEffect } from 'react';
import './ProductCategories.css';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductModal from './ProductModal'; // Add this import
import ProtectedAction from '../ProtectedAction';
import { useModal } from '../../contexts/ModalContext';

const ProductCategories = ({ activeCategory, setActiveCategory }) => {
  const [favorites, setFavorites] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Add this state
  const [isModalOpen, setIsModalOpen] = useState(false); // Add this state
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
    { id: 'tshirts', name: 'T-SHIRTS' },
    { id: 'longsleeves', name: 'LONG SLEEVES' },
    { id: 'hoodies', name: 'HOODIES' },
    { id: 'uniforms', name: 'UNIFORMS' },
    { id: 'replicated', name: 'REPLICATED JERSEYS' },
    { id: 'balls', name: 'BALLS' },
    { id: 'trophies', name: 'TROPHIES' }
  ];

  const products = [
    { id: 1, name: "GREEN-WHITE 'PERSIAN RAGS' JERSEY SET", price: "₱ 700.00", image: "🏀", category: 'jerseys' }, 
    { id: 2, name: "PURPLE-YELLOW 'BONESIAN' JERSEY SET", price: "₱ 700.00", image: "🏀", category: 'jerseys' },
    { id: 3, name: "MAROON-BLACK 'MAMBLE' JERSEY SET", price: "₱ 700.00", image: "🏀", category: 'jerseys' },
    { id: 4, name: "GREEN-WHITE LA SALLE INSPIRED JERSEY", price: "₱ 700.00", image: "🏀", category: 'jerseys' },
  
    { id: 5, name: "GREEN-WHITE 'PERSIAN RAGS' T-SHIRT", price: "₱ 500.00", image: "👕", category: 'tshirts' },
    { id: 6, name: "PURPLE-YELLOW 'BONESIAN' T-SHIRT", price: "₱ 500.00", image: "👕", category: 'tshirts' },
    { id: 7, name: "MAROON-BLACK 'MAMBLE' T-SHIRT", price: "₱ 500.00", image: "👕", category: 'tshirts' },
    { id: 8, name: "GREEN-WHITE LA SALLE INSPIRED T-SHIRT", price: "₱ 500.00", image: "👕", category: 'tshirts' },
  
    { id: 9, name: "GREEN-WHITE 'PERSIAN RAGS' UNIFORM", price: "₱ 800.00", image: "👔", category: 'uniforms' },
    { id: 10, name: "PURPLE-YELLOW 'BONESIAN' UNIFORM", price: "₱ 800.00", image: "👔", category: 'uniforms' },
    { id: 11, name: "MAROON-BLACK 'MAMBLE' UNIFORM", price: "₱ 800.00", image: "👔", category: 'uniforms' },
    { id: 12, name: "GREEN-WHITE LA SALLE INSPIRED UNIFORM", price: "₱ 800.00", image: "👔", category: 'uniforms' },
  
    { id: 13, name: "BLACK-GOLD 'KINGS ERA' REPLICATED JERSEY", price: "₱ 750.00", image: "👑", category: 'replicated' },
    { id: 14, name: "PURPLE-GOLD 'DYNASTY' REPLICATED JERSEY", price: "₱ 750.00", image: "🏆", category: 'replicated' },
    { id: 15, name: "RED-BLACK 'BULL RUN' REPLICATED JERSEY", price: "₱ 750.00", image: "🐂", category: 'replicated' },
    { id: 16, name: "GREEN-WHITE 'CELTICA' REPLICATED JERSEY", price: "₱ 750.00", image: "🍀", category: 'replicated' },
    { id: 17, name: "BLUE-ORANGE 'BIG APPLE' REPLICATED JERSEY", price: "₱ 750.00", image: "🗽", category: 'replicated' },
    { id: 18, name: "YELLOW-PURPLE 'ROYALTY' REPLICATED JERSEY", price: "₱ 750.00", image: "👑", category: 'replicated' },
    { id: 19, name: "YELLOW-PURPLE 'ROYALTY 1' REPLICATED JERSEY", price: "₱ 750.00", image: "👑", category: 'replicated' },
  
    { id: 20, name: "NAVY-WHITE PERFORMANCE LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
    { id: 21, name: "BLACK-RED THERMAL LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
    { id: 22, name: "OLIVE-ORANGE TRAIL LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
    { id: 23, name: "CHARCOAL-GRAY TRAINING LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
    { id: 24, name: "WHITE-BLUE AERO LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
    { id: 25, name: "MAROON-BLACK COMP LONG SLEEVES", price: "₱ 650.00", image: "🧥", category: 'longsleeves' },
  
    { id: 26, name: "GREEN-WHITE 'PERSIAN RAGS' HOODIE", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
    { id: 27, name: "PURPLE-YELLOW 'BONESIAN' HOODIE", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
    { id: 28, name: "MAROON-BLACK 'MAMBLE' HOODIE", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
    { id: 29, name: "GREEN-WHITE LA SALLE INSPIRED HOODIE", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
    { id: 30, name: "GREEN-WHITE LA SALLE INSPIRED HOODIE 2", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
    { id: 31, name: "GREEN-WHITE LA SALLE INSPIRED HOODIE 3", price: "₱ 800.00", image: "🧥", category: 'hoodies' },
  
    { id: 32, name: "MOLTEN 1", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 33, name: "MOLTEN 2", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 34, name: "MOLTEN 3", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 35, name: "MOLTEN 4", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 36, name: "MOLTEN 5", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 37, name: "MOLTEN 6", price: "₱ 650.00", image: "🏀", category: 'balls' },
    { id: 38, name: "MIKASA", price: "₱ 650.00", image: "🏐", category: 'balls' },
  
    { id: 39, name: "TROPHY 1", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 40, name: "TROPHY 2", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 41, name: "TROPHY 3", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 42, name: "TROPHY 4", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 43, name: "TROPHY 5", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 44, name: "TROPHY 6", price: "₱ 650.00", image: "", category: 'trophies' },
    { id: 45, name: "TROPHY", price: "₱ 650.00", image: "", category: 'trophies' }
  ];

  const filteredProducts = products.filter(product => product.category === activeCategory);
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
        <div className="products-grid">
          {displayedProducts.map(product => (
            <ProtectedAction
              key={product.id}
              onAuthenticated={() => openProductModal(product)}
              onUnauthenticated={() => openSignIn()}
            >
              <div className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.image}</span>
                </div>
                <div className="product-info">
                  <h3 className="product-brand">Yohann's Sportswear</h3>
                  <p className="product-name">{product.name}</p>
                  <div className="product-price">{product.price}</div>
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

