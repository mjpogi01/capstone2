import React, { useState } from 'react';
import './AddProductModal.css';

const AddProductModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    price: '',
    description: '',
    stock_quantity: 0,
    branch_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // Track which slot is uploading
  const [uploadingAdditionalIndex, setUploadingAdditionalIndex] = useState(null); // Track which additional slot is uploading

  const categories = [
    'Jerseys',
    'T-Shirts', 
    'Long Sleeves',
    'Uniforms',
    'Accessories',
    'Shoes',
    'Bags',
    'Hats'
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSizeSelect = (size) => {
    setFormData(prev => ({
      ...prev,
      size: size
    }));
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImages(true);
    setUploadingSlot('main');
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token from localStorage:', token);
      console.log('All localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        setError('Please log in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      console.log('Uploading main image:', file.name);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Upload response:', result);

      if (result.success) {
        setMainImage(result.imageUrl);
        setError('');
      } else {
        setError(result.error || 'Failed to upload main image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload main image: ' + error.message);
    } finally {
      setUploadingImages(false);
      setUploadingSlot(null);
    }
  };

  const handleAdditionalImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImages(true);
    setUploadingSlot('additional');
    setUploadingAdditionalIndex(index);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      console.log('Uploading additional image to slot', index, ':', file.name);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Upload response:', result);

      if (result.success) {
        // Update the specific slot
        const newImages = [...additionalImages];
        newImages[index] = result.imageUrl;
        setAdditionalImages(newImages);
        setError('');
      } else {
        setError(result.error || 'Failed to upload additional image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload additional image: ' + error.message);
    } finally {
      setUploadingImages(false);
      setUploadingSlot(null);
      setUploadingAdditionalIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productData = {
        ...formData,
        main_image: mainImage,
        additional_images: additionalImages
      };

      const response = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      const newProduct = await response.json();
      onAdd(newProduct);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ADD NEW ITEMS</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            {/* Image Upload Section */}
            <div className="image-section">
              <div className="main-image-upload">
                {mainImage ? (
                  <div className="uploaded-image">
                    <img src={mainImage} alt="Main product" />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => setMainImage(null)}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="image-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={uploadingImages && uploadingSlot === 'main'}
                      style={{ display: 'none' }}
                    />
                    {uploadingImages && uploadingSlot === 'main' ? (
                      <div className="uploading-indicator">
                        <div className="spinner"></div>
                        <div className="uploading-text">Uploading...</div>
                      </div>
                    ) : (
                      <>
                        <div className="image-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                        </div>
                        <div className="plus-icon">+</div>
                      </>
                    )}
                  </label>
                )}
              </div>
              <div className="additional-images">
                {/* Show 3 slots - either uploaded image or placeholder */}
                {Array.from({ length: 3 }).map((_, index) => {
                  const image = additionalImages[index];
                  
                  if (image) {
                    // Show uploaded image at this position
                    return (
                      <div key={`image-${index}`} className="uploaded-image small">
                        <img src={image} alt={`Additional ${index + 1}`} />
                        <button 
                          type="button" 
                          className="remove-image"
                          onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  } else {
                    // Show placeholder for this position
                    return (
                      <label key={`placeholder-${index}`} className="image-placeholder small">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAdditionalImageUpload(e, index)}
                          disabled={uploadingImages && uploadingSlot === 'additional' && uploadingAdditionalIndex === index}
                          style={{ display: 'none' }}
                        />
                        {uploadingImages && uploadingSlot === 'additional' && uploadingAdditionalIndex === index ? (
                          <div className="uploading-indicator">
                            <div className="spinner"></div>
                            <div className="uploading-text">Uploading...</div>
                          </div>
                        ) : (
                          <>
                            <div className="image-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                <circle cx="12" cy="13" r="3"/>
                              </svg>
                            </div>
                            <div className="plus-icon">+</div>
                          </>
                        )}
                      </label>
                    );
                  }
                })}
              </div>
            </div>

            {/* Product Details Section */}
            <div className="details-section">
              <h3>Product Details</h3>
              
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label>Product Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Size</label>
                <div className="size-buttons">
                  {sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`size-btn ${formData.size === size ? 'selected' : ''}`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Product Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows="4"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Adding...' : 'ADD PRODUCT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
