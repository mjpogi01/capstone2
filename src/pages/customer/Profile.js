import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import profileImageService from '../../services/profileImageService';
import userProfileService from '../../services/userProfileService';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
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
        const profileData = await userProfileService.getUserProfile(user.id);
        
        if (profileData) {
          setFormData({
            name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            gender: profileData.gender || 'Male',
            dateOfBirth: profileData.date_of_birth || '',
            address: profileData.address || '',
            password: '*****************'
          });
          setProfileImage(profileData.avatar_url);
        } else {
          // Fallback to user metadata if no profile exists
          setFormData({
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            gender: 'Male',
            dateOfBirth: '',
            address: '',
            password: '*****************'
          });
          setProfileImage(user.user_metadata?.avatar_url);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Failed to load profile data', 'error');
        
        // Fallback to user metadata
        setFormData({
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          gender: 'Male',
          dateOfBirth: '',
          address: '',
          password: '*****************'
        });
        setProfileImage(user.user_metadata?.avatar_url);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user, showNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (gender) => {
    setFormData(prev => ({
      ...prev,
      gender
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

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      showNotification('Please enter a valid phone number', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare profile data for database
      const profileData = {
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
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
        const profileData = await userProfileService.getUserProfile(user.id);
        
        if (profileData) {
          setFormData({
            name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            gender: profileData.gender || 'Male',
            dateOfBirth: profileData.date_of_birth || '',
            address: profileData.address || '',
            password: '*****************'
          });
          setProfileImage(profileData.avatar_url);
        }
      } catch (error) {
        console.error('Error reloading profile data:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '2rem', color: '#00bfff' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Loading profile...</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Please wait while we fetch your information.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Content */}
        <div className="profile-content">
          <div className="personal-info-section">
            {/* Left Column - Profile Picture */}
            <div className="profile-picture-section">
              <div className="profile-picture">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <button 
                className="upload-btn" 
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
            <div className="personal-info-form">
              <div className="form-header">
                <h3>Personal Information</h3>
                {!isEditing ? (
                  <button className="edit-link" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave}>Save</button>
                    <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                  </div>
                )}
              </div>

              <div className="form-fields">
                {/* Name */}
                <div className="form-field">
                  <label>Name :</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Email */}
                <div className="form-field">
                  <label>Email Address :</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label>Phone Number :</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Gender */}
                <div className="form-field">
                  <label>Gender :</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={() => handleGenderChange('Male')}
                        disabled={!isEditing}
                      />
                      <span className="radio-custom"></span>
                      Male
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={() => handleGenderChange('Female')}
                        disabled={!isEditing}
                      />
                      <span className="radio-custom"></span>
                      Female
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="gender"
                        value="Other"
                        checked={formData.gender === 'Other'}
                        onChange={() => handleGenderChange('Other')}
                        disabled={!isEditing}
                      />
                      <span className="radio-custom"></span>
                      Other
                    </label>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="form-field">
                  <label>Date Of Birth :</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Address */}
                <div className="form-field">
                  <label>Address :</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Password */}
                <div className="form-field">
                  <label>Password :</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <span style={{ color: '#cccccc', fontSize: '14px' }}>••••••••••••••••</span>
                    <button 
                      className="change-password-btn"
                      onClick={() => showNotification('Password change functionality coming soon!', 'info')}
                      style={{
                        background: '#1e3a8a',
                        color: '#ffffff',
                        border: '1px solid #00bfff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
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
    </div>
  );
};

export default Profile;
