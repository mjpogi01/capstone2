import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './AddProductModal.css';

const AddProductModal = ({ onClose, onAdd, editingProduct, isEditMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    available_sizes: [], // Array to store multiple selected sizes
    price: '',
    description: '',
    stock_quantity: null, // Changed to null for order-based model
    sold_quantity: 0, // Added sold quantity field
    branch_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // Track which slot is uploading
  const [uploadingAdditionalIndex, setUploadingAdditionalIndex] = useState(null); // Track which additional slot is uploading
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/branches');
        if (response.ok) {
          const branchesData = await response.json();
          setBranches(branchesData);
          // Set default branch to San Pascual (main manufacturing branch)
          const mainBranch = branchesData.find(branch => branch.is_main_manufacturing);
          if (mainBranch && !isEditMode) {
            setFormData(prev => ({ ...prev, branch_id: mainBranch.id }));
          }
        } else {
          console.error('Failed to fetch branches');
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [isEditMode]);

  // Size constants
  const categories = [
    'Jerseys',
    'T-Shirts', 
    'Long Sleeves',
    'Uniforms',
    'Accessories',
    'Balls',
    'Trophies',
    'Hats'
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const trophySizes = Array.from({ length: 12 }, (_, i) => (i + 10).toString()); // 10 to 21 inches

  // Pre-populate form when editing
  useEffect(() => {
    if (isEditMode && editingProduct) {
      // Parse available_sizes if it's a string (comma-separated) or use array
      let availableSizes = [];
      if (editingProduct.available_sizes) {
        if (Array.isArray(editingProduct.available_sizes)) {
          availableSizes = editingProduct.available_sizes;
        } else if (typeof editingProduct.available_sizes === 'string') {
          availableSizes = editingProduct.available_sizes.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      
      console.log('📦 [AddProductModal] Loading product for editing:', {
        product_id: editingProduct.id,
        product_name: editingProduct.name,
        available_sizes_raw: editingProduct.available_sizes,
        available_sizes_parsed: availableSizes,
        available_sizes_count: availableSizes.length
      });
      
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        size: editingProduct.size || '',
        available_sizes: availableSizes,
        price: editingProduct.price || '',
        description: editingProduct.description || '',
        stock_quantity: editingProduct.stock_quantity || null,
        sold_quantity: editingProduct.sold_quantity || 0,
        branch_id: editingProduct.branch_id || 1
      });
      
      // Set existing images
      if (editingProduct.main_image) {
        setMainImage(editingProduct.main_image);
      }
      if (editingProduct.additional_images && editingProduct.additional_images.length > 0) {
        setAdditionalImages(editingProduct.additional_images);
      }
    }
  }, [isEditMode, editingProduct]);

  // Clear sizes when switching between trophy and non-trophy categories
  useEffect(() => {
    const currentIsTrophy = formData.category === 'Trophies';
    const currentSize = formData.size;
    const currentAvailableSizes = formData.available_sizes || [];
    
    // Clear single size if invalid
    if (currentSize && currentSize !== '') {
      const isTrophySize = trophySizes.includes(currentSize);
      const isClothingSize = sizes.includes(currentSize);
      
      // If category is trophy but size is clothing size, clear it
      if (currentIsTrophy && isClothingSize) {
        setFormData(prev => ({ ...prev, size: '' }));
      }
      // If category is not trophy but size is trophy size, clear it
      if (!currentIsTrophy && isTrophySize) {
        setFormData(prev => ({ ...prev, size: '' }));
      }
    }
    
    // Clear available_sizes if they don't match the current category
    if (currentAvailableSizes.length > 0) {
      const validSizes = currentIsTrophy ? trophySizes : sizes;
      const invalidSizes = currentAvailableSizes.filter(size => !validSizes.includes(size));
      
      if (invalidSizes.length > 0) {
        setFormData(prev => ({
          ...prev,
          available_sizes: currentAvailableSizes.filter(size => validSizes.includes(size))
        }));
      }
    }
  }, [formData.category]);

  // Check if current category is Trophies
  const isTrophy = formData.category === 'Trophies';

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

  const handleMultipleSizeToggle = (size) => {
    setFormData(prev => {
      const currentSizes = prev.available_sizes || [];
      const isSelected = currentSizes.includes(size);
      
      if (isSelected) {
        // Remove size
        return {
          ...prev,
          available_sizes: currentSizes.filter(s => s !== size)
        };
      } else {
        // Add size
        return {
          ...prev,
          available_sizes: [...currentSizes, size]
        };
      }
    });
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImages(true);
    setUploadingSlot('main');
    setError('');
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please log in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

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
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please log in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

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
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please log in to add products');
        return;
      }

      const productData = {
        ...formData,
        size: formData.size || null,
        available_sizes: formData.available_sizes && formData.available_sizes.length > 0 
          ? formData.available_sizes.join(',') 
          : null, // Store as comma-separated string
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        sold_quantity: formData.sold_quantity ? parseInt(formData.sold_quantity) : 0,
        main_image: mainImage,
        additional_images: additionalImages
      };

      console.log('📦 [AddProductModal] Sending product data:', {
        ...productData,
        available_sizes: productData.available_sizes,
        available_sizes_count: formData.available_sizes?.length || 0
      });


      const url = isEditMode 
        ? `http://localhost:4000/api/products/${editingProduct.id}`
        : 'http://localhost:4000/api/products';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(productData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [AddProductModal] API Error:', responseData);
        const errorMessage = responseData.error || 'Failed to add product';
        const hint = responseData.hint || '';
        throw new Error(hint ? `${errorMessage}\n\n${hint}` : errorMessage);
      }

      console.log('✅ [AddProductModal] Product saved successfully:', responseData);
      console.log('✅ [AddProductModal] Saved available_sizes:', responseData.available_sizes);

      const newProduct = await responseData;
      onAdd(newProduct);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay add-product-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'EDIT PRODUCT' : 'ADD NEW ITEMS'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            {/* Image Upload Section */}
            <div className="image-section">
              <h3 className="image-section-title">Product Images</h3>
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
                  <div className="image-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={uploadingImages && uploadingSlot === 'main'}
                      style={{ display: 'none' }}
                      id="main-image-upload"
                    />
                    <label htmlFor="main-image-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                      {uploadingImages && uploadingSlot === 'main' ? (
                        <div className="uploading-overlay">
                          <div className="uploading-spinner"></div>
                          <p>Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <div className="image-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                              <circle cx="12" cy="13" r="3"/>
                            </svg>
                          </div>
                          <p>Click to upload main image</p>
                        </>
                      )}
                    </label>
                  </div>
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
                      <div key={`placeholder-${index}`} className="image-placeholder small">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAdditionalImageUpload(e, index)}
                          disabled={uploadingImages && uploadingSlot === 'additional' && uploadingAdditionalIndex === index}
                          style={{ display: 'none' }}
                          id={`additional-image-${index}`}
                        />
                        <label htmlFor={`additional-image-${index}`} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                          {uploadingImages && uploadingSlot === 'additional' && uploadingAdditionalIndex === index ? (
                            <div className="uploading-overlay">
                              <div className="uploading-spinner"></div>
                              <p>Uploading...</p>
                            </div>
                          ) : (
                            <>
                              <div className="image-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                  <circle cx="12" cy="13" r="3"/>
                                </svg>
                              </div>
                              <p>+</p>
                            </>
                          )}
                        </label>
                      </div>
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
                <label>Available Sizes {isTrophy ? '(Inches - Select Multiple)' : '(Select Multiple)'}</label>
                {isTrophy ? (
                  <div className="size-buttons trophy-sizes multiple-selection">
                    {trophySizes.map(size => {
                      const isSelected = formData.available_sizes?.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`size-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleMultipleSizeToggle(size)}
                        >
                          {size}"
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="size-buttons multiple-selection">
                    {sizes.map(size => {
                      const isSelected = formData.available_sizes?.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`size-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleMultipleSizeToggle(size)}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                )}
                {formData.available_sizes && formData.available_sizes.length > 0 && (
                  <div className="selected-sizes-display">
                    <strong>Selected: </strong>
                    {formData.available_sizes.join(', ')}
                  </div>
                )}
                <small className="form-help">
                  {isTrophy ? 'Click to select multiple trophy sizes (10" to 21")' : 'Click to select multiple sizes'}
                </small>
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
                <label>Stock Quantity (Optional)</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity || ''}
                  onChange={handleInputChange}
                  placeholder="Leave blank for order-based items"
                  min="0"
                />
                <small className="form-help">Leave blank for custom orders - items are made to order</small>
              </div>

              <div className="form-group">
                <label>Sold Quantity</label>
                <input
                  type="number"
                  name="sold_quantity"
                  value={formData.sold_quantity}
                  onChange={handleInputChange}
                  placeholder="Enter initial sold quantity"
                  min="0"
                />
                <small className="form-help">Number of items already sold</small>
              </div>

              <div className="form-group">
                <label>Branch</label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleInputChange}
                  disabled={loadingBranches}
                >
                  {loadingBranches ? (
                    <option value="">Loading branches...</option>
                  ) : (
                    branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} {branch.is_main_manufacturing ? '(Main Manufacturing)' : ''}
                      </option>
                    ))
                  )}
                </select>
                <small className="form-help">Select the branch for this product</small>
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
                  {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'UPDATE PRODUCT' : 'ADD PRODUCT')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
