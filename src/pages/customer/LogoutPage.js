import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInModal from '../../components/customer/SignInModal';
import SignUpModal from '../../components/customer/SignUpModal';
import './LogoutPage.css';

const LogoutPage = () => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  const handleLoginClick = () => {
    setShowSignInModal(true);
  };

  const handleSignUpClick = () => {
    setShowSignUpModal(true);
  };

  const handleLoginSuccess = () => {
    setShowSignInModal(false);
    navigate('/');
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    navigate('/');
  };

  return (
    <div className="logout-page">
      <div className="logout-container">
        {/* Left Side - Message */}
        <div className="logout-message-section">
          <div className="logout-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="logout-title">Successfully Logged Out!</h1>
          
          <p className="logout-description">
            Thank you for visiting <span className="brand-highlight">Yohann's Sportswear House</span>. 
            You have been successfully logged out of your account.
          </p>
          
          <p className="logout-welcome">
            We'd love to see you again! Log in to continue shopping for premium sportswear, 
            custom jerseys, and exclusive deals. Don't have an account yet? 
            <span className="highlight-text"> Sign up now</span> and join our community!
          </p>

          <div className="logout-buttons">
            <button className="logout-btn logout-btn-login" onClick={handleLoginClick}>
              LOGIN
            </button>
            <button className="logout-btn logout-btn-signup" onClick={handleSignUpClick}>
              SIGN UP
            </button>
          </div>

          <button className="back-home-link" onClick={() => navigate('/')}>
            ← Back to Homepage
          </button>
        </div>

        {/* Right Side - Login/Signup Form Preview */}
        <div className="logout-form-section">
          <div className="form-preview-card">
            <div className="form-preview-header">
              <h3>Ready to Continue?</h3>
              <p>Choose an option to get started</p>
            </div>

            <div className="form-preview-buttons">
              <button className="preview-btn preview-btn-login" onClick={handleLoginClick}>
                <div className="preview-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="preview-btn-content">
                  <span className="preview-btn-title">Login</span>
                  <span className="preview-btn-desc">Access your account</span>
                </div>
              </button>

              <button className="preview-btn preview-btn-signup" onClick={handleSignUpClick}>
                <div className="preview-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m11-10a4 4 0 100-8 4 4 0 000 8zm6 6l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="preview-btn-content">
                  <span className="preview-btn-title">Sign Up</span>
                  <span className="preview-btn-desc">Create new account</span>
                </div>
              </button>
            </div>

            <div className="form-preview-features">
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Premium Sportswear</span>
              </div>
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Custom Jerseys</span>
              </div>
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSignInModal && (
        <SignInModal 
          isOpen={showSignInModal} 
          onClose={() => setShowSignInModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
      
      {showSignUpModal && (
        <SignUpModal 
          isOpen={showSignUpModal} 
          onClose={() => setShowSignUpModal(false)}
          onSuccess={handleSignUpSuccess}
        />
      )}
    </div>
  );
};

export default LogoutPage;

