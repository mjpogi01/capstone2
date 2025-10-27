import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchArtistProfile();
  }, [user]);

  const fetchArtistProfile = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual data from your API
      const mockProfile = {
        artist_name: 'John Doe',
        bio: 'Professional design layout specialist with 5+ years of experience in sportswear design and custom graphics.',
        specialties: ['Layout Design', 'Custom Graphics', 'Team Jerseys', 'Logo Design'],
        commission_rate: 12.00,
        rating: 4.8,
        total_designs: 156,
        total_sales: 89,
        total_tasks_completed: 234
      };
      
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error fetching artist profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
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
        <FontAwesomeIcon key={i} icon={faStar} className="star filled" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon key="half" icon={faStar} className="star half" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="star empty" />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="artist-profile">
        <div className="profile-header loading-skeleton" style={{ height: '200px', borderRadius: '12px' }}></div>
        <div className="profile-content">
          <div className="profile-info loading-skeleton" style={{ height: '400px', borderRadius: '12px' }}></div>
          <div className="profile-stats loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <FontAwesomeIcon icon={faUser} />
        </div>
        <div className="profile-basic-info">
          <h2>{profile.artist_name}</h2>
          <div className="profile-rating">
            <div className="stars">
              {renderStars(profile.rating)}
            </div>
            <span className="rating-value">{profile.rating}</span>
          </div>
          <p className="profile-bio">{profile.bio}</p>
        </div>
        <div className="profile-actions">
          {!isEditing ? (
            <button className="edit-btn" onClick={handleEdit}>
              <FontAwesomeIcon icon={faEdit} />
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faSave} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                <FontAwesomeIcon icon={faTimes} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Profile Information */}
        <div className="profile-info">
          <h3>Profile Information</h3>
          
          <div className="info-section">
            <label>Artist Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.artist_name}
                onChange={(e) => handleInputChange('artist_name', e.target.value)}
                className="form-input"
              />
            ) : (
              <p>{profile.artist_name}</p>
            )}
          </div>

          <div className="info-section">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="form-textarea"
                rows="4"
              />
            ) : (
              <p>{profile.bio}</p>
            )}
          </div>

          <div className="info-section">
            <label>Specialties</label>
            {isEditing ? (
              <div className="specialties-edit">
                {profile.specialties.map((specialty, index) => (
                  <div key={index} className="specialty-input-group">
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                      className="form-input"
                      placeholder="Enter specialty"
                    />
                    <button 
                      type="button"
                      onClick={() => removeSpecialty(index)}
                      className="remove-specialty-btn"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addSpecialty}
                  className="add-specialty-btn"
                >
                  + Add Specialty
                </button>
              </div>
            ) : (
              <div className="specialties-display">
                {profile.specialties.map((specialty, index) => (
                  <span key={index} className="specialty-tag">
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="info-section">
            <label>Commission Rate</label>
            {isEditing ? (
              <div className="commission-input-group">
                <input
                  type="number"
                  value={profile.commission_rate}
                  onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value))}
                  className="form-input"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="input-suffix">%</span>
              </div>
            ) : (
              <p>{profile.commission_rate}%</p>
            )}
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="profile-stats">
          <h3>Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faTasks} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{profile.total_tasks_completed}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{profile.total_designs}</div>
                <div className="stat-label">Designs Created</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{profile.total_sales}</div>
                <div className="stat-label">Designs Sold</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faStar} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{profile.rating}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
