import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import wishlistService from '../services/wishlistService';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load wishlist from database when user changes
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) {
        setWishlistItems([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const dbWishlistItems = await wishlistService.getUserWishlist(user.id);
        setWishlistItems(dbWishlistItems);
      } catch (error) {
        console.error('Error loading wishlist from database:', error);
        setWishlistItems([]);
        setError('Failed to load wishlist from database');
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [user]);

  // Function to reload wishlist from database
  const reloadWishlist = async (forceRefresh = true) => {
    if (!user) return;
    
    try {
      const dbWishlistItems = await wishlistService.getUserWishlist(user.id, forceRefresh);
      setWishlistItems(dbWishlistItems);
    } catch (error) {
      console.error('Error reloading wishlist:', error);
    }
  };

  const addToWishlist = async (product) => {
    console.log('=== ADD TO WISHLIST CALLED ===');
    console.log('User:', user);
    console.log('Product:', product);
    
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling wishlistService.addToWishlist');
      const newWishlistItem = await wishlistService.addToWishlist(user.id, product);
      console.log('New wishlist item:', newWishlistItem);
      
      setWishlistItems(prevItems => {
        // Check if item already exists
        const existingItem = prevItems.find(item => item.id === product.id);
        if (existingItem) {
          console.log('Item already exists, not adding duplicate');
          return prevItems; // Don't add duplicates
        }
        console.log('Adding new item to wishlist state');
        return [...prevItems, newWishlistItem];
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      setError('Failed to add item to wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    console.log('=== REMOVE FROM WISHLIST CALLED ===');
    console.log('User:', user);
    console.log('Product ID:', productId);
    
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling wishlistService.removeFromWishlist');
      await wishlistService.removeFromWishlist(user.id, productId);
      console.log('Successfully removed from database');
      
      setWishlistItems(prevItems => {
        const filteredItems = prevItems.filter(item => item.id !== productId);
        console.log('Updated wishlist items:', filteredItems);
        return filteredItems;
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to remove item from wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWishlist = async (product) => {
    console.log('=== TOGGLE WISHLIST CALLED ===');
    console.log('User:', user);
    console.log('Product:', product);
    console.log('Current wishlist items:', wishlistItems);
    
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    const isInWishlist = wishlistItems.some(item => item.id === product.id);
    console.log('Is in wishlist:', isInWishlist);
    
    if (isInWishlist) {
      console.log('Removing from wishlist');
      await removeFromWishlist(product.id);
    } else {
      console.log('Adding to wishlist');
      await addToWishlist(product);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

  const value = {
    wishlistItems,
    isWishlistOpen,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    openWishlist,
    closeWishlist,
    reloadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
