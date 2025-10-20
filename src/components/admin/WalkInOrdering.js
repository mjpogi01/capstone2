import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaShoppingCart, FaTimes } from 'react-icons/fa';
import ProductModal from '../customer/ProductModal';
import CheckoutModal from '../customer/CheckoutModal';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import './WalkInOrdering.css';

const WalkInOrdering = ({ onClose }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOrderIndex, setExpandedOrderIndex] = useState(null);
  const { showOrderConfirmation, showError } = useNotification();
  const { user } = useAuth();

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'jerseys', label: 'Jerseys' },
    { value: 'shorts', label: 'Shorts' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' }
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
    console.log('🔍 Filtering products:', { products: products.length, selectedCategory, searchTerm });

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('🔍 Filtered products:', filtered.length);
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

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

  const handleEditItem = (item) => {
    // Convert cart item back to product format for editing
    const product = {
      id: item.id,
      name: item.name,
      price: item.price,
      main_image: item.image,
      category: 'jerseys' // Default category, will be updated when product is loaded
    };
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
      // Replace existing item (for editing)
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = cartItem;
      setCartItems(updatedItems);
    } else {
      // Add new item
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

  const handlePlaceOrder = async (orderData) => {
    try {
      // Check if admin is logged in
      if (!user?.id) {
        showError('Authentication Required', 'Please log in to process walk-in orders.');
        return;
      }

      // Create order with walk-in customer info using admin's user ID
      const formattedOrderData = {
        user_id: user.id, // Use admin's user ID for walk-in orders
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
      
      // Clear cart and close modals
      setCartItems([]);
      setShowCheckout(false);
      onClose();
      
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

  return (
    <div className="walkin-ordering-overlay">
      <div className="walkin-ordering-container">
        {/* Header */}
        <div className="walkin-header">
          <h1>Walk-in Ordering</h1>
          <button className="walkin-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="walkin-content">
          {/* Search and Filters */}
          <div className="walkin-filters">
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
            
            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category.value}
                  className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="walkin-main">
            {/* Products Grid */}
            <div className="walkin-products">
              {loading ? (
                <div className="walkin-loading">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="walkin-no-products">No products found</div>
              ) : (
                <div className="walkin-products-grid">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="walkin-product-card" onClick={() => handleProductClick(product)}>
                      <div className="walkin-product-image">
                        <img 
                          src={product.main_image || '/image_highlights/image.png'} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/image_highlights/image.png';
                          }}
                        />
                      </div>
                      <div className="walkin-product-info">
                        <h3 className="walkin-product-name">{product.name}</h3>
                        <p className="walkin-product-category">{product.category}</p>
                        <p className="walkin-product-price">₱{parseFloat(product.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="walkin-cart">
              <div className="cart-header">
                <h3>Shopping Cart ({getTotalItems()} items)</h3>
                <span className="cart-total">₱{getTotalPrice().toFixed(2)}</span>
              </div>
              
              <div className="cart-items">
                {cartItems.length === 0 ? (
                  <div className="empty-cart">Cart is empty</div>
                ) : (
                  <div className="cart-items-list">
                    {cartItems.map((item, index) => (
                      <div key={item.uniqueId} className="cart-item-card">
                        <div className="item-image">
                          <img 
                            src={item.image || '/image_highlights/image.png'} 
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = '/image_highlights/image.png';
                            }}
                          />
                        </div>
                        
                        <div className="item-details">
                          <div className="item-header">
                            <div className="item-name">{item.name}</div>
                            <button 
                              className="remove-btn-top"
                              onClick={() => removeFromCart(item.uniqueId)}
                              title="Remove item"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          
                          <div className="compact-order-container">
                            <div 
                              className="compact-order-header"
                              onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                            >
                              <span className="order-type-text">{item.isTeamOrder ? 'Team Order' : 'Single Order'}</span>
                              <span className="dropdown-arrow">
                                {expandedOrderIndex === index ? '▲' : '▼'}
                              </span>
                            </div>
                            
                            {expandedOrderIndex === index && (
                              <div className="compact-order-details">
                                {item.isTeamOrder && item.teamMembers && item.teamMembers.length > 0 ? (
                                  <div className="compact-team-details">
                                    <div className="team-name-header">
                                      <span className="compact-detail team-name-detail">Team: {item.teamMembers[0]?.teamName || 'N/A'}</span>
                                    </div>
                                    <div className="team-divider"></div>
                                    {item.teamMembers.map((member, memberIndex) => (
                                      <div key={memberIndex} className="compact-member">
                                        <span className="compact-detail surname-detail">Surname: {member.surname || 'N/A'}</span>
                                        <span className="compact-detail">Jersey: {member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                        <span className="compact-detail">Size: {member.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="compact-single-details">
                                    <span className="compact-detail team-name-detail">Team: {item.singleOrderDetails?.teamName || 'N/A'}</span>
                                    <span className="compact-detail surname-detail">Surname: {item.singleOrderDetails?.surname || 'N/A'}</span>
                                    <span className="compact-detail">Jersey: {item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || 'N/A'}</span>
                                    <span className="compact-detail">Size: {item.singleOrderDetails?.size || 'N/A'} ({item.sizeType || 'Adult'})</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="quantity-section">
                            <span className="quantity-label">Quantity: {item.quantity}</span>
                          </div>
                          
                          <div className="price-section">
                            <div className="item-price">₱{parseFloat(item.price).toFixed(2)}</div>
                            <div className="item-total">Total: ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                          </div>
                          
                          <div className="item-actions">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="edit-btn"
                              title="Edit item"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cartItems.length > 0 && (
                <div className="cart-footer">
                  <button 
                    className="checkout-btn"
                    onClick={() => setShowCheckout(true)}
                  >
                    <FaShoppingCart />
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
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

export default WalkInOrdering;
