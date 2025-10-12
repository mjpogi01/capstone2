import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart from database when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        setCartItems([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load from database only
        const dbCartItems = await cartService.getUserCart(user.id);
        setCartItems(dbCartItems);
      } catch (error) {
        console.error('Error loading cart from database:', error);
        setCartItems([]);
        setError('Failed to load cart from database');
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Cart is database-only - no localStorage needed

  // Function to reload cart from database
  const reloadCart = async (forceRefresh = true) => {
    if (!user) return;
    
    try {
      const dbCartItems = await cartService.getUserCart(user.id, forceRefresh);
      setCartItems(dbCartItems);
    } catch (error) {
      console.error('Error reloading cart:', error);
    }
  };

  const addToCart = async (product, options = {}) => {
    const {
      size = 'M',
      quantity = 1,
      isTeamOrder = false,
      teamMembers = null,
      singleOrderDetails = null,
      isReplacement = false // New flag to indicate if this is replacing an existing item
    } = options;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.main_image || product.image || '/images/placeholder-jersey.png',
      size,
      quantity,
      isTeamOrder,
      teamMembers: isTeamOrder ? teamMembers : null,
      singleOrderDetails: !isTeamOrder ? singleOrderDetails : null,
      addedAt: new Date().toISOString(),
      uniqueId: Date.now() + Math.random() // Generate a simple unique ID
    };

    if (!user) {
      // No user - cart is empty
      return;
    }

    // Handle database for logged-in users
    setIsLoading(true);
    setError(null);

    try {
      const newCartItem = await cartService.addToCart(user.id, cartItem);
      
      setCartItems(prevItems => {
        if (isReplacement) {
          // For replacements, just add the new item without checking for existing items
          return [...prevItems, newCartItem];
        }
        
        const existingItemIndex = prevItems.findIndex(item => 
          item.id === cartItem.id && 
          item.size === cartItem.size && 
          item.isTeamOrder === cartItem.isTeamOrder
        );

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity += quantity;
          return updatedItems;
        } else {
          return [...prevItems, newCartItem];
        }
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (uniqueId) => {
    if (!user) {
      // No user - nothing to remove
      return;
    }

    // Handle database for logged-in users
    setIsLoading(true);
    setError(null);

    try {
      await cartService.removeFromCart(user.id, uniqueId);
      
      // Immediately update the cart state by filtering out the removed item
      setCartItems(prevItems => {
        const filteredItems = prevItems.filter(item => {
          return item.uniqueId !== uniqueId;
        });
        return filteredItems;
      });
      
      // Also reload from database as backup to ensure consistency
      setTimeout(async () => {
        try {
          await reloadCart();
        } catch (reloadError) {
          console.error('Error in backup reload:', reloadError);
        }
      }, 1000);
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (uniqueId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(uniqueId);
      return;
    }

    if (!user) {
      // No user - nothing to update
      return;
    }

    // Handle database for logged-in users
    setIsLoading(true);
    setError(null);

    try {
      await cartService.updateCartItem(user.id, uniqueId, newQuantity);
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.uniqueId === uniqueId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating cart item:', error);
      setError('Failed to update cart item');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) {
      // No user - nothing to clear
      return;
    }

    // Handle database for logged-in users
    setIsLoading(true);
    setError(null);

    try {
      await cartService.clearCart(user.id);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  const getCartTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item.uniqueId || item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cartItems
      .filter(item => selectedItems.has(item.uniqueId || item.id))
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.length;
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    const allItemIds = cartItems.map(item => item.uniqueId || item.id);
    setSelectedItems(new Set(allItemIds));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const isAllSelected = () => {
    return cartItems.length > 0 && selectedItems.size === cartItems.length;
  };

  const isItemSelected = (itemId) => {
    return selectedItems.has(itemId);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const value = {
    cartItems,
    selectedItems,
    isCartOpen,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getCartItemsCount,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isAllSelected,
    isItemSelected,
    openCart,
    closeCart,
    reloadCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};