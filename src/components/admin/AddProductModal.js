import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './AddProductModal.css';

const isTrophyCategory = (category) => typeof category === 'string' && category.toLowerCase() === 'trophies';

const parseAvailableSizes = (sizeValue) => {
  if (!sizeValue) {
    return [];
  }

  if (Array.isArray(sizeValue)) {
    return sizeValue.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  }

  if (typeof sizeValue !== 'string') {
    return [];
  }

  const trimmed = sizeValue.trim();
  if (!trimmed.startsWith('[')) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim());
    }
  } catch (error) {
    console.warn('Failed to parse available sizes in AddProductModal:', error.message);
  }

  return [];
};

const AddProductModal = ({ onClose, onAdd, editingProduct, isEditMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    price: '',
    description: '',
    stock_quantity: null,
    sold_quantity: 0,
    branch_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [uploadingAdditionalIndex, setUploadingAdditionalIndex] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [sizeInputError, setSizeInputError] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/branches');
        if (response.ok) {
          const branchesData = await response.json();
          setBranches(branchesData);
          const mainBranch = branchesData.find(branch => branch.is_main_manufacturing);
          if (mainBranch && !isEditMode) {
            setFormData(prev => ({ ...prev, branch_id: mainBranch.id }));
          }
        } else {
          console.error('Failed to fetch branches');
        }
      } catch (fetchError) {
        console.error('Error fetching branches:', fetchError);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        size: editingProduct.size || '',
        price: editingProduct.price || '',
        description: editingProduct.description || '',
        stock_quantity: editingProduct.stock_quantity || null,
        sold_quantity: editingProduct.sold_quantity || 0,
        branch_id: editingProduct.branch_id || 1
      });

      if (isTrophyCategory(editingProduct.category)) {
        const parsedSizes = parseAvailableSizes(editingProduct.available_sizes || editingProduct.size);
        setAvailableSizes(parsedSizes);
      } else {
        setAvailableSizes([]);
      }

      setSizeInputError('');
      setNewSizeInput('');

      if (editingProduct.main_image) {
        setMainImage(editingProduct.main_image);
      }
      if (editingProduct.additional_images && editingProduct.additional_images.length > 0) {
        setAdditionalImages(editingProduct.additional_images);
      }
    }
  }, [isEditMode, editingProduct]);

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
  const trophyCategorySelected = isTrophyCategory(formData.category);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === 'category' && isTrophyCategory(value)) {
        updated.size = '';
      }

      return updated;
    });

    if (name === 'category') {
      if (isTrophyCategory(value)) {
        setAvailableSizes(prev => prev.length > 0 ? prev : []);
        setSizeInputError('');
      } else {
        setAvailableSizes([]);
        setNewSizeInput('');
        setSizeInputError('');
      }
    }
  };

  const handleSizeSelect = (size) => {
    setFormData(prev => ({
      ...prev,
      size: size
    }));
  };

  const handleAddAvailableSize = () => {
    if (!isTrophyCategory(formData.category)) {
      return;
    }

    const value = newSizeInput.trim();
    if (!value) {
      setSizeInputError('Enter a size before adding.');
      return;
    }

    const exists = availableSizes.some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setSizeInputError('Size already added.');
      return;
    }

    setAvailableSizes(prev => [...prev, value]);
    setNewSizeInput('');
    setSizeInputError('');
  };

  const handleRemoveAvailableSize = (sizeToRemove) => {
    setAvailableSizes(prev => prev.filter(size => size !== sizeToRemove));
    setSizeInputError('');
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImages(true);
    setUploadingSlot('main');
    setError('');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to upload images');
        return;
      }

      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: uploadData
      });

      const result = await response.json();

      if (result.success) {
        setMainImage(result.imageUrl);
        setError('');
      } else {
        setError(result.error || 'Failed to upload main image');
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError('Failed to upload main image: ' + uploadError.message);
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to upload images');
        return;
      }

      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: uploadData
      });

      const result = await response.json();

      if (result.success) {
        const newImages = [...additionalImages];
        newImages[index] = result.imageUrl;
        setAdditionalImages(newImages);
        setError('');
      } else {
        setError(result.error || 'Failed to upload additional image');
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError('Failed to upload additional image: ' + uploadError.message);
    } finally {
      setUploadingImages(false);
      setUploadingSlot(null);
      setUploadingAdditionalIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSizeInputError('');

    const isTrophyProduct = isTrophyCategory(formData.category);

    if (isTrophyProduct && availableSizes.length === 0) {
      setError('Please add at least one available size for trophy products.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to add products');
        return;
      }

      const productData = {
        ...formData,
        size: isTrophyProduct
          ? (availableSizes.length > 0 ? JSON.stringify(availableSizes) : null)
          : (formData.size || null),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        sold_quantity: formData.sold_quantity ? parseInt(formData.sold_quantity) : 0,
        main_image: mainImage,
        additional_images: additionalImages
      };

      const url = isEditMode
        ? `http://localhost:4000/api/products/${editingProduct.id}`
        : 'http://localhost:4000/api/products';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      const newProduct = await response.json();
      onAdd(newProduct);
    } catch (submitError) {
      setError(submitError.message);
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
            {'×'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
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
                          {'×'}
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
                {Array.from({ length: 3 }).map((_, index) => {
                  const image = additionalImages[index];

                  if (image) {
                    return (
                      <div key={`image-${index}`} className="uploaded-image small">
                        <img src={image} alt={`Additional ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          {'×'}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={`placeholder-${index}`} className="image-placeholder small">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleAdditionalImageUpload(event, index)}
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
                })}
              </div>
            </div>

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

              {trophyCategorySelected ? (
                <div className="form-group">
                  <label>Available Sizes</label>
                  <div className="available-sizes-input">
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(event) => setNewSizeInput(event.target.value)}
                      placeholder='e.g. 13"'
                    />
                    <button
                      type="button"
                      className="size-add-btn"
                      onClick={handleAddAvailableSize}
                    >
                      Add Size
                    </button>
                  </div>
                  {sizeInputError && (
                    <div className="form-inline-error">{sizeInputError}</div>
                  )}
                  {availableSizes.length > 0 && (
                    <div className="available-sizes-list">
                      {availableSizes.map(size => (
                        <span key={size} className="available-size-chip">
                          {size}
                          <button
                            type="button"
                            aria-label={`Remove size ${size}`}
                            onClick={() => handleRemoveAvailableSize(size)}
                          >
                            {'×'}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <small className="form-help">Add the trophy sizes customers can choose from (e.g., 13", 16", 19", 21").</small>
                </div>
              ) : (
                <div className="form-group">
                  <label>Size (Optional)</label>
                  <div className="size-buttons">
                    <button
                      type="button"
                      className={`size-btn ${formData.size === '' ? 'selected' : ''}`}
                      onClick={() => handleSizeSelect('')}
                    >
                      No Size
                    </button>
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
                  <small className="form-help">Leave blank if not applicable</small>
                </div>
              )}

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

