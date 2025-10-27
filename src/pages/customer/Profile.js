import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import profileImageService from '../../services/profileImageService';
import userProfileService from '../../services/userProfileService';
import userService from '../../services/userService';
import authService from '../../services/authService';
import ChangePasswordModal from '../../components/customer/ChangePasswordModal';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '*****************'
  });

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get user profile from database
        let profileData = null;
        try {
          profileData = await userProfileService.getUserProfile(user.id);
        } catch (profileError) {
          console.log('No profile data found, will use defaults');
        }
        
        // Try to get the user's saved address from checkout
        let savedAddress = null;
        try {
          savedAddress = await userService.getUserAddress();
          console.log('✅ Successfully loaded checkout address:', savedAddress);
        } catch (addressError) {
          console.log('ℹ️ No checkout address found (user hasn\'t placed an order yet)');
        }
        
        // Determine the best source for each field (note: database uses snake_case)
        const name = savedAddress?.full_name || profileData?.full_name || user.user_metadata?.full_name || '';
        const phone = savedAddress?.phone || profileData?.phone || user.user_metadata?.phone || '';
        const address = savedAddress?.address || profileData?.address || '';
        
        setFormData({
          name: name,
          email: user.email || '',
          phone: phone,
          address: address,
          password: '*****************'
        });
        
        setProfileImage(profileData?.avatar_url || user.user_metadata?.avatar_url);
        
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Don't show error notification for missing checkout data - it's normal for new users
        
        // Fallback to user metadata
        setFormData({
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          address: '',
          password: '*****************'
        });
        setProfileImage(user.user_metadata?.avatar_url);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file
      profileImageService.validateImageFile(file);
      
      setIsUploading(true);
      
      // Upload file
      const result = await profileImageService.uploadProfileImage(file);
      
      // Update user profile with new image URL
      await profileImageService.updateUserProfileImage(result.imageUrl);
      
      // Update local state
      setProfileImage(result.imageUrl);
      
      // Refresh user data
      await refreshUser();
      
      showNotification('Profile image updated successfully!', 'success');
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showNotification(error.message || 'Failed to upload profile image', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!formData.name.trim()) {
      showNotification('Name is required', 'error');
      return;
    }

    if (!formData.email.trim()) {
      showNotification('Email is required', 'error');
      return;
    }

    if (formData.phone && !/^[\+]?[\d][\d\s\-\(\)]{5,20}$/.test(formData.phone.trim())) {
      showNotification('Please enter a valid phone number (minimum 6 digits)', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare profile data for database
      const profileData = {
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        avatar_url: profileImage
      };

      // Update user profile in database
      await userProfileService.upsertUserProfile(user.id, profileData);
      
      // Update user metadata in Supabase Auth
      await refreshUser();
      
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    
    // Reload original data from database
    if (user) {
      try {
        // Get user profile from database
        let profileData = null;
        try {
          profileData = await userProfileService.getUserProfile(user.id);
        } catch (profileError) {
          console.log('No profile data found, will use defaults');
        }
        
        // Try to get the user's saved address from checkout
        let savedAddress = null;
        try {
          savedAddress = await userService.getUserAddress();
        } catch (addressError) {
          console.log('ℹ️ No checkout address found');
        }
        
        // Determine the best source for each field (note: database uses snake_case)
        const name = savedAddress?.full_name || profileData?.full_name || user.user_metadata?.full_name || '';
        const phone = savedAddress?.phone || profileData?.phone || user.user_metadata?.phone || '';
        const address = savedAddress?.address || profileData?.address || '';
        
        setFormData({
          name: name,
          email: user.email || '',
          phone: phone,
          address: address,
          password: '*****************'
        });
        
        setProfileImage(profileData?.avatar_url || user.user_metadata?.avatar_url);
        
      } catch (error) {
        console.error('Error reloading profile data:', error);
      }
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      showNotification('Password changed successfully!', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  if (isLoading) {
    return (
      <div className="yohanns-profile-page">
        <div className="yohanns-profile-container">
          <div className="yohanns-profile-content">
            <div className="yohanns-profile-loading">
              <div className="yohanns-profile-loading-title">Loading profile...</div>
              <div className="yohanns-profile-loading-text">Please wait while we fetch your information.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="yohanns-profile-page">
      <div className="yohanns-profile-container">
        {/* Content */}
        <div className="yohanns-profile-content">
          {/* Edit Controls - Top Right */}
          <div className="yohanns-profile-top-controls">
            {!isEditing ? (
              <button className="yohanns-edit-link" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            ) : (
              <div className="yohanns-edit-actions">
                <button className="yohanns-save-btn" onClick={handleSave}>Save</button>
                <button className="yohanns-cancel-btn" onClick={handleCancel}>Cancel</button>
              </div>
            )}
          </div>

          <div className="yohanns-personal-info-section">
            {/* Left Column - Profile Picture */}
            <div className="yohanns-profile-picture-section">
              <div className="yohanns-profile-picture">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="yohanns-profile-image"
                  />
                ) : (
                  <div className="yohanns-profile-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <button 
                className="yohanns-upload-btn" 
                onClick={handleFileSelect}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Right Column - Personal Information */}
            <div className="yohanns-personal-info-form">
              <div className="yohanns-form-header">
                <h3>Personal Information</h3>
              </div>

              <div className="yohanns-form-fields">
                {/* Name */}
                <div className="yohanns-form-field">
                  <label>Name :</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Your full name"
                  />
                  {!formData.name && (
                    <small style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      📌 Will auto-fill after you place your first order
                    </small>
                  )}
                </div>

                {/* Email */}
                <div className="yohanns-form-field">
                  <label>Email Address :</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={true}
                    style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  />
                  <small style={{ color: '#00bfff', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Email cannot be changed (from your account signup)
                  </small>
                </div>

                {/* Phone */}
                <div className="yohanns-form-field">
                  <label>Phone Number :</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Your contact number"
                  />
                  {!formData.phone && (
                    <small style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      📌 Will auto-fill after you place your first order
                    </small>
                  )}
                </div>

                {/* Address */}
                <div className="yohanns-form-field">
                  <label>Address :</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Your delivery address"
                  />
                  {!formData.address && (
                    <small style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      📌 Will auto-fill after you place your first order
                    </small>
                  )}
                </div>

                {/* Password */}
                <div className="yohanns-form-field">
                  <label>Password :</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <span style={{ color: '#cccccc', fontSize: '14px' }}>••••••••••••••••</span>
                    <button 
                      className="yohanns-change-password-btn"
                      onClick={() => setIsPasswordModalOpen(true)}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
};

export default Profile;
