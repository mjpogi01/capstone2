import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';
import SignInModal from './SignInModal';
import SignUpModal from './SignUpModal';
import CartModal from './CartModal';
import WishlistModal from './WishlistModal';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isOwner, isAdmin } = useAuth();
  const { 
    showSignInModal, 
    showSignUpModal, 
    openSignIn, 
    closeSignIn, 
    openSignUp, 
    closeSignUp 
  } = useModal();
  const { getCartItemCount, openCart } = useCart();
  const { openWishlist, wishlistItems } = useWishlist();
  const dropdownRef = useRef(null);

  // SAVED FILTER DROPDOWN CONTENTS FOR LATER USE:
  // const filterOptions = [
  //   { category: 'Categories', options: ['Jerseys', 'T-Shirts', 'Long Sleeves', 'Uniforms', 'Accessories'] },
  //   { category: 'Price Range', options: ['Under P500', 'P500 - P1000', 'P1000 - P1500', 'Above P1500'] },
  //   { category: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'] },
  //   { category: 'Color', options: ['Blue', 'Red', 'White', 'Black', 'Green', 'Yellow', 'Purple'] },
  //   { category: 'Brand', options: ['Yohann\'s Own', 'Replicated', 'Custom Design'] }
  // ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleProtectedAction = (action) => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    // If authenticated, proceed with the action
    action();
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      openSignIn();
    } else {
      setShowProfileDropdown(!showProfileDropdown);
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-left">
          <div className="logo">
            <Link to="/">
              <img 
                src={logo} 
                alt="YOHANNS Sportswear House" 
                className="logo-image"
              />
            </Link>
          </div>
        </div>
        
        <nav className="nav-menu">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            HOME
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            ABOUT
          </Link>
          <Link 
            to="/highlights" 
            className={`nav-link ${isActive('/highlights') ? 'active' : ''}`}
          >
            HIGHLIGHTS
          </Link>
          <Link 
            to="/branches" 
            className={`nav-link ${isActive('/branches') ? 'active' : ''}`}
          >
            BRANCHES
          </Link>
          <Link 
            to="/faqs" 
            className={`nav-link ${isActive('/faqs') ? 'active' : ''}`}
          >
            FAQs
          </Link>
          <Link 
            to="/contacts" 
            className={`nav-link ${isActive('/contacts') ? 'active' : ''}`}
          >
            CONTACTS
          </Link>
        </nav>
        
        <div className="header-right">
          <div className="utility-icons">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button" aria-label="Search">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          
          {/* SAVED FILTER DROPDOWN JSX FOR LATER USE:
          {showMoreDropdown && (
            <div className="dropdown-menu">
              <div className="filter-categories-row">
                {filterOptions.map((filter, index) => (
                  <div key={index} className="filter-category">
                    <h4 className="filter-category-title">{filter.category}</h4>
                    <div className="filter-options">
                      {filter.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="filter-option">
                          <input type="checkbox" />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="filter-actions">
                <button className="apply-filters">Apply Filters</button>
                <button className="clear-filters">Clear All</button>
              </div>
            </div>
          )}
          */}
          
          <div className="icon cart-icon" aria-label="Cart" onClick={openCart}>
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M3 3h2l3 12h10l3-8H6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="17" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {getCartItemCount() > 0 && (
              <span className="cart-badge">{getCartItemCount()}</span>
            )}
          </div>
          <div className="icon wishlist-icon" aria-label="Wishlist" onClick={openWishlist}>
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {wishlistItems.length > 0 && (
              <span className="wishlist-badge">{wishlistItems.length}</span>
            )}
          </div>
          <div className="icon profile-icon" aria-label="Account" onClick={handleProfileClick}>
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isAuthenticated && showProfileDropdown && (
              <div className="profile-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                <div className="profile-dropdown-content">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="profile-info">
                      <div className="profile-name">{user?.email}</div>
                      <div className="profile-status">Online</div>
                    </div>
                  </div>
                  <div className="profile-menu">
                    {/* Dashboard Links for Admin/Owner */}
                    {isOwner() && (
                      <button 
                        className="profile-menu-item dashboard" 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/owner');
                        }}
                      >
                        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />
                        </svg>
                        Owner Dashboard
                      </button>
                    )}
                    {isAdmin() && (
                      <button 
                        className="profile-menu-item dashboard" 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/admin');
                        }}
                      >
                        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />
                        </svg>
                        Admin Dashboard
                      </button>
                    )}
                    
                    <button 
                      className="profile-menu-item" 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        console.log('Profile Settings clicked');
                        // Add navigation to profile settings page
                      }}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                      </svg>
                      Profile Settings
                    </button>
                    <button 
                      className="profile-menu-item" 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        console.log('Orders clicked');
                        // Add navigation to orders page
                      }}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                      </svg>
                      Orders
                    </button>
                    <button 
                      className="profile-menu-item" 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        openWishlist();
                      }}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                      </svg>
                      Wishlist
                    </button>
                    <div className="profile-divider"></div>
                    <button 
                      className="profile-menu-item logout" 
                      onClick={handleLogout}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      
      
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={closeSignIn} 
        onOpenSignUp={() => { closeSignIn(); openSignUp(); }}
      />
      <SignUpModal 
        isOpen={showSignUpModal}
        onClose={closeSignUp}
        onOpenSignIn={() => { closeSignUp(); openSignIn(); }}
      />
      <CartModal />
      <WishlistModal />
    </header>
  );
};

export default Header; 