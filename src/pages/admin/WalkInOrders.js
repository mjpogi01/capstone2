import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaShoppingCart, 
  FaTimes, 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaUser,
  FaTshirt,
  FaShoePrints,
  FaEye,
  FaShoppingBag,
  FaCreditCard,
  FaStore,
  FaTag,
  FaGift,
  FaSpinner,
  FaArrowLeft,
  FaFilter,
  FaLock,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import ProductModal from '../../components/customer/ProductModal';
import CheckoutModal from '../../components/customer/CheckoutModal';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import './WalkInOrders.css';

const WalkInOrders = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editSize, setEditSize] = useState('');
  const { showOrderConfirmation, showError } = useNotification();
  const { user } = useAuth();

  const categories = [
    { value: 'all', label: 'All Products', icon: FaStore, color: '#3b82f6' },
    { value: 'jerseys', label: 'Jerseys', icon: FaTshirt, color: '#ef4444' },
    { value: 'shorts', label: 'Shorts', icon: FaShoePrints, color: '#10b981' },
    { value: 'shoes', label: 'Shoes', icon: FaShoePrints, color: '#f59e0b' },
    { value: 'accessories', label: 'Accessories', icon: FaGift, color: '#8b5cf6' }
  ];

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      console.log('📦 Products loaded:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(priceRange.max));
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm, sortBy, sortOrder, priceRange]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAddToCart = (product, options) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.size === options.size
    );

    const cartItem = {
      id: product.id,
      name: product.name,
      price: options.price || product.price,
      image: product.main_image,
      size: options.size,
      quantity: options.quantity,
      isTeamOrder: options.isTeamOrder || false,
      teamMembers: options.teamMembers || null,
      singleOrderDetails: options.singleOrderDetails || null,
      sizeType: options.sizeType || 'adult',
      uniqueId: `walkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = cartItem;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, cartItem]);
    }
  };

  const handleBuyNow = (product, options) => {
    const buyNowItem = {
      id: product.id,
      name: product.name,
      price: options.price || product.price,
      image: product.main_image,
      size: options.size,
      quantity: options.quantity,
      isTeamOrder: options.isTeamOrder || false,
      teamMembers: options.teamMembers || null,
      singleOrderDetails: options.singleOrderDetails || null,
      sizeType: options.sizeType || 'adult',
      uniqueId: `walkin-buynow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isBuyNow: true
    };
    setCartItems([buyNowItem]);
    setShowCheckout(true);
  };

  const removeFromCart = (uniqueId) => {
    setCartItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  const startEditingItem = (item) => {
    setEditingItem(item.uniqueId);
    setEditQuantity(item.quantity);
    setEditSize(item.size || 'M');
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditQuantity(1);
    setEditSize('');
  };

  const saveItemChanges = (uniqueId) => {
    if (editQuantity < 1) {
      showError('Invalid Quantity', 'Quantity must be at least 1');
      return;
    }

    setCartItems(prev => prev.map(item => 
      item.uniqueId === uniqueId 
        ? { 
            ...item, 
            quantity: editQuantity, 
            size: editSize,
            price: item.price // Keep original price
          }
        : item
    ));
    
    setEditingItem(null);
    setEditQuantity(1);
    setEditSize('');
  };

  const updateQuantity = (uniqueId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev => prev.map(item => 
      item.uniqueId === uniqueId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      if (!user?.id) {
        showError('Authentication Required', 'Please log in to process walk-in orders.');
        return;
      }

      const formattedOrderData = {
        user_id: user.id,
        order_number: `WALKIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        shipping_method: orderData.shippingMethod,
        pickup_location: orderData.selectedLocation || null,
        delivery_address: orderData.deliveryAddress,
        order_notes: orderData.orderNotes || 'Walk-in order',
        subtotal_amount: orderData.subtotalAmount,
        shipping_cost: orderData.shippingCost,
        total_amount: orderData.totalAmount,
        total_items: orderData.totalItems,
        order_items: orderData.items
      };

      const createdOrder = await orderService.createOrder(formattedOrderData);
      
      showOrderConfirmation(createdOrder.order_number, orderData.totalAmount);
      
      setCartItems([]);
      setShowCheckout(false);
      navigate('/admin/orders');
      
    } catch (error) {
      console.error('Error creating walk-in order:', error);
      showError('Order Failed', `Failed to place order: ${error.message}. Please try again.`);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const quickAddToCart = (product) => {
    const quickItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.main_image,
      size: 'M',
      quantity: 1,
      isTeamOrder: false,
      singleOrderDetails: {
        teamName: 'Walk-in Customer',
        surname: 'Customer',
        number: '00',
        size: 'M'
      },
      sizeType: 'adult',
      uniqueId: `walkin-quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setCartItems(prev => [...prev, quickItem]);
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData ? categoryData.icon : FaTshirt;
  };

  const getCategoryColor = (category) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData ? categoryData.color : '#3b82f6';
  };

  return (
    <div className={`walkin-orders-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="walkin-ordering-container">
        {/* Modern Navigation Bar */}
        <header className="modern-navbar">
          <div className="navbar-left">
              <button 
              className="back-button"
                onClick={() => navigate('/admin/orders')}
                title="Back to Orders"
              >
                <FaArrowLeft />
              </button>
            <div className="brand-section">
              <div className="brand-logo">
                <span>WO</span>
              </div>
              <h1 className="brand-title">Walk-in Ordering</h1>
              </div>
            </div>

          <div className="navbar-center">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="navbar-right">
             <button 
              className={`admin-mode-toggle ${isAdminMode ? 'active' : ''}`}
              onClick={() => setIsAdminMode(!isAdminMode)}
             >
              <FaUser />
              <span>Admin Mode</span>
             </button>
             
               <button 
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
               </button>
               
            <div className="cart-summary" onClick={() => setShowCartDropdown(!showCartDropdown)}>
              <div className="cart-icon">
                <FaShoppingCart />
                <span className="cart-count">{getTotalItems()}</span>
              </div>
              <div className="cart-info">
                <div className="cart-total">₱{getTotalPrice().toFixed(2)}</div>
                <div className="cart-items-text">{getTotalItems()} items</div>
              </div>
              
              {/* Cart Dropdown */}
              {showCartDropdown && (
                <div className="cart-dropdown">
                  <div className="cart-dropdown-header">
                    <h4>Shopping Cart</h4>
                     <button 
                      className="close-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCartDropdown(false);
                      }}
                     >
                       <FaTimes />
                     </button>
                   </div>
                   
                  <div className="cart-dropdown-items">
                    {cartItems.length === 0 ? (
                      <div className="empty-cart-dropdown">
                        <FaLock className="empty-cart-icon" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="cart-items-list">
                        {cartItems.map((item) => (
                          <div key={item.uniqueId} className="cart-dropdown-item">
                            <img 
                              src={item.image || '/image_highlights/image.png'} 
                              alt={item.name}
                              className="cart-dropdown-image"
                              onError={(e) => {
                                e.target.src = '/image_highlights/image.png';
                              }}
                            />
                            
                            <div className="cart-dropdown-details">
                              <div className="cart-dropdown-name">{item.name}</div>
                              <div className="cart-dropdown-price">₱{parseFloat(item.price).toFixed(2)}</div>
                              
                              {editingItem === item.uniqueId ? (
                                <div className="cart-edit-controls">
                                  <div className="edit-quantity-controls">
                                    <label>Qty:</label>
                                    <div className="quantity-input-group">
                                      <button 
                                        className="quantity-btn"
                                        onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        value={editQuantity}
                                        onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="quantity-input"
                                        min="1"
                                      />
                                      <button 
                                        className="quantity-btn"
                                        onClick={() => setEditQuantity(editQuantity + 1)}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="edit-size-controls">
                                    <label>Size:</label>
                       <select 
                                      value={editSize}
                                      onChange={(e) => setEditSize(e.target.value)}
                                      className="size-select"
                                    >
                                      <option value="XS">XS</option>
                                      <option value="S">S</option>
                                      <option value="M">M</option>
                                      <option value="L">L</option>
                                      <option value="XL">XL</option>
                                      <option value="XXL">XXL</option>
                       </select>
                     </div>
                     
                                  <div className="edit-actions">
                                    <button 
                                      className="save-btn"
                                      onClick={() => saveItemChanges(item.uniqueId)}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className="cancel-btn"
                                      onClick={cancelEditing}
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="cart-item-info">
                                  <div className="cart-dropdown-quantity">Qty: {item.quantity}</div>
                                  <div className="cart-dropdown-size">Size: {item.size || 'M'}</div>
                                  <div className="cart-item-actions">
                         <button 
                                      className="edit-item-btn"
                                      onClick={() => startEditingItem(item)}
                                      title="Edit item"
                         >
                                      <FaEdit />
                         </button>
                         <button 
                                      className="cart-dropdown-remove"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromCart(item.uniqueId);
                                      }}
                                      title="Remove item"
                                    >
                                      <FaTimes />
                         </button>
                       </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {cartItems.length > 0 && (
                    <div className="cart-dropdown-footer">
                      <div className="cart-dropdown-summary">
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>₱{getTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>₱{getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <button 
                        className="checkout-btn-dropdown"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCartDropdown(false);
                          setShowCheckout(true);
                        }}
                      >
                        <FaCreditCard />
                        Proceed to Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
                     </div>
                     
                     <div className="filter-group">
                       <label className="filter-label">Price Range</label>
                       <div className="price-range-inputs">
                         <input
                           type="number"
                           placeholder="Min"
                           value={priceRange.min}
                           onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                           className="price-input"
                         />
                         <span className="price-separator">-</span>
                         <input
                           type="number"
                           placeholder="Max"
                           value={priceRange.max}
                           onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                           className="price-input"
                         />
                       </div>
                     </div>
                     
                     <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="category">Category</option>
            </select>
                     </div>
                     
          <div className="filter-group">
            <label className="filter-label">Order</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
           </div>
        </div>

        {/* Main Content Area - Full Width */}
        <div className="main-content-full">
          <div className="products-section-full">
            <div className="products-header">
              <h2>Products ({filteredProducts.length})</h2>
            </div>

              {loading ? (
              <div className="loading-state">
                  <FaSpinner className="spinner" />
                  <span>Loading products...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <FaSearch className="empty-icon" />
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
              <div className="products-grid-full">
                  {filteredProducts.map(product => {
                    const CategoryIcon = getCategoryIcon(product.category);
                    const categoryColor = getCategoryColor(product.category);
                    
                    return (
                      <div 
                        key={product.id} 
                      className="product-card"
                        onClick={() => handleProductClick(product)}
                      >
                      <div className="product-image-container">
                          <img 
                            src={product.main_image || '/image_highlights/image.png'} 
                            alt={product.name}
                          className="product-image"
                            onError={(e) => {
                              e.target.src = '/image_highlights/image.png';
                            }}
                          />
                        <div className="product-category-tag" style={{ backgroundColor: categoryColor }}>
                          <CategoryIcon />
                          <span>{product.category}</span>
                        </div>
                          <div className="product-overlay">
                            <button 
                              className="overlay-btn quick-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                              handleProductClick(product);
                              }}
                            title="Add to Cart"
                            >
                              <FaPlus />
                            </button>
                            <button 
                              className="overlay-btn view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product);
                              }}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </div>
                        
                      <div className="product-card-content">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price">₱{parseFloat(product.price).toFixed(2)}</div>
                        <div className="product-actions">
                          <button 
                            className="add-to-cart-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                          >
                            <FaShoppingCart />
                            Add to Cart
                          </button>
                          <button 
                            className="quick-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                          >
                            <FaEye />
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* Product Modal */}
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cartItems={cartItems}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>
    </div>
  );
};

export default WalkInOrders;