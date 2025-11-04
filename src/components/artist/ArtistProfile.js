import React, { useState, useEffect, useCallback } from 'react';
import './ArtistProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEdit, 
  faSave, 
  faTimes,
  faStar,
  faChartLine,
  faTasks,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import artistDashboardService from '../../services/artistDashboardService';

const ArtistProfile = () => {
  const [profile, setProfile] = useState({
    artist_name: '',
    bio: '',
    specialties: [],
    commission_rate: 0,
    rating: 0,
    total_designs: 0,
    total_sales: 0,
    total_tasks_completed: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetchArtistProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available');
        setProfile({
          artist_name: '',
          bio: '',
          specialties: [],
          commission_rate: 0,
          rating: 0,
          total_designs: 0,
          total_sales: 0,
          total_tasks_completed: 0
        });
        return;
      }

      const profileData = await artistDashboardService.getArtistProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching artist profile:', error);
      // Set default values on error
      setProfile({
        artist_name: '',
        bio: '',
        specialties: [],
        commission_rate: 0,
        rating: 0,
        total_designs: 0,
        total_sales: 0,
        total_tasks_completed: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArtistProfile();
  }, [user, fetchArtistProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchArtistProfile(); // Reset to original data
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await artistDashboardService.updateArtistProfile(profile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialtyChange = (index, value) => {
    const newSpecialties = [...profile.specialties];
    newSpecialties[index] = value;
    setProfile(prev => ({
      ...prev,
      specialties: newSpecialties
    }));
  };

  const addSpecialty = () => {
    setProfile(prev => ({
      ...prev,
      specialties: [...prev.specialties, '']
    }));
  };

  const removeSpecialty = (index) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon key={i} icon={faStar} className="artist-star artist-star-filled" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon key="half" icon={faStar} className="artist-star artist-star-half" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="artist-star artist-star-empty" />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="artist-profile-container">
        <div className="artist-profile-header artist-loading-skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
        <div className="artist-profile-content">
          <div className="artist-profile-info artist-loading-skeleton" style={{ height: '400px', borderRadius: '12px' }}></div>
          <div className="artist-profile-stats artist-loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-profile-container">
      {/* Profile Header */}
      <div className="artist-profile-header">
        <div className="artist-profile-avatar">
          <FontAwesomeIcon icon={faUser} />
        </div>
        <div className="artist-profile-basic-info">
          <h2 className="artist-profile-name">{profile.artist_name}</h2>
          <div className="artist-profile-rating">
            <div className="artist-profile-stars">
              {renderStars(profile.rating)}
            </div>
            <span className="artist-rating-value">{profile.rating}</span>
          </div>
          <p className="artist-profile-bio">{profile.bio}</p>
        </div>
        <div className="artist-profile-actions">
          {!isEditing ? (
            <button className="artist-profile-edit-btn" onClick={handleEdit}>
              <FontAwesomeIcon icon={faEdit} />
              Edit Profile
            </button>
          ) : (
            <div className="artist-edit-actions">
              <button 
                className="artist-profile-save-btn" 
                onClick={handleSave}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faSave} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="artist-profile-cancel-btn" onClick={handleCancel}>
                <FontAwesomeIcon icon={faTimes} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="artist-profile-content">
        {/* Profile Information */}
        <div className="artist-profile-info">
          <h3 className="artist-profile-info-title">Profile Information</h3>
          
          <div className="artist-info-section">
            <label className="artist-info-label">Artist Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.artist_name}
                onChange={(e) => handleInputChange('artist_name', e.target.value)}
                className="artist-form-input"
              />
            ) : (
              <p className="artist-info-text">{profile.artist_name}</p>
            )}
          </div>

          <div className="artist-info-section">
            <label className="artist-info-label">Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="artist-form-textarea"
                rows="4"
              />
            ) : (
              <p className="artist-info-text">{profile.bio}</p>
            )}
          </div>

          <div className="artist-info-section">
            <label className="artist-info-label">Specialties</label>
            {isEditing ? (
              <div className="artist-specialties-edit">
                {profile.specialties.map((specialty, index) => (
                  <div key={index} className="artist-specialty-input-group">
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                      className="artist-form-input"
                      placeholder="Enter specialty"
                    />
                    <button 
                      type="button"
                      onClick={() => removeSpecialty(index)}
                      className="artist-remove-specialty-btn"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addSpecialty}
                  className="artist-add-specialty-btn"
                >
                  + Add Specialty
                </button>
              </div>
            ) : (
              <div className="artist-specialties-display">
                {profile.specialties.map((specialty, index) => (
                  <span key={index} className="artist-specialty-tag">
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="artist-info-section">
            <label className="artist-info-label">Commission Rate</label>
            {isEditing ? (
              <div className="artist-commission-input-group">
                <input
                  type="number"
                  value={profile.commission_rate}
                  onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value))}
                  className="artist-form-input"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="artist-input-suffix">%</span>
              </div>
            ) : (
              <p className="artist-info-text">{profile.commission_rate}%</p>
            )}
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="artist-profile-stats">
          <h3 className="artist-profile-stats-title">Statistics</h3>
          
          <div className="artist-stats-grid">
            <div className="artist-stat-card">
              <div className="artist-stat-icon">
                <FontAwesomeIcon icon={faTasks} />
              </div>
              <div className="artist-stat-info">
                <div className="artist-stat-value">{profile.total_tasks_completed}</div>
                <div className="artist-stat-label">Tasks Completed</div>
              </div>
            </div>

            <div className="artist-stat-card">
              <div className="artist-stat-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="artist-stat-info">
                <div className="artist-stat-value">{profile.total_designs}</div>
                <div className="artist-stat-label">Designs Created</div>
              </div>
            </div>

            <div className="artist-stat-card">
              <div className="artist-stat-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="artist-stat-info">
                <div className="artist-stat-value">{profile.total_sales}</div>
                <div className="artist-stat-label">Designs Sold</div>
              </div>
            </div>

            <div className="artist-stat-card">
              <div className="artist-stat-icon">
                <FontAwesomeIcon icon={faStar} />
              </div>
              <div className="artist-stat-info">
                <div className="artist-stat-value">{profile.rating}</div>
                <div className="artist-stat-label">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
