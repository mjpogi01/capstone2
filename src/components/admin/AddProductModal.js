import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faTrash, 
  faRotateLeft,
  faPlus,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import './AddProductModal.css';

const isTrophyCategory = (category) => typeof category === 'string' && category.toLowerCase() === 'trophies';
const isJerseyCategory = (category) => typeof category === 'string' && category.toLowerCase() === 'jerseys';
const isSizeCustomizableCategory = (category) => {
  if (!category || typeof category !== 'string') return false;
  const lower = category.toLowerCase();
  return lower === 'jerseys' || 
         lower === 'uniforms' || 
         lower === 'long sleeves' || 
         lower === 'jackets' ||
         lower === 't-shirts' ||
         lower === 'tshirts' ||
         lower === 'hoodies' ||
         lower === 'hoodie';
};

const shouldShowShortsSizes = (category) => {
  if (!category || typeof category !== 'string') return false;
  const lower = category.toLowerCase();
  // Long Sleeves, Jackets, and Hoodies don't have shorts sizes
  return lower !== 'long sleeves' && lower !== 'jackets' && lower !== 'hoodies' && lower !== 'hoodie';
};

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
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
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
  const [availableSizes, setAvailableSizes] = useState([]);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [sizeInputError, setSizeInputError] = useState('');
  const [jerseyShirtSizesAdult, setJerseyShirtSizesAdult] = useState([]);
  const [jerseyShirtSizesKids, setJerseyShirtSizesKids] = useState([]);
  const [jerseyShortsSizesAdult, setJerseyShortsSizesAdult] = useState([]);
  const [jerseyShortsSizesKids, setJerseyShortsSizesKids] = useState([]);
  const [newShirtSizeAdult, setNewShirtSizeAdult] = useState('');
  const [newShirtSizeKids, setNewShirtSizeKids] = useState('');
  const [newShortsSizeAdult, setNewShortsSizeAdult] = useState('');
  const [newShortsSizeKids, setNewShortsSizeKids] = useState('');
  const [shirtSizeAdultError, setShirtSizeAdultError] = useState('');
  const [shirtSizeKidsError, setShirtSizeKidsError] = useState('');
  const [shortsSizeAdultError, setShortsSizeAdultError] = useState('');
  const [shortsSizeKidsError, setShortsSizeKidsError] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Load custom categories and hidden categories from localStorage on mount
  useEffect(() => {
    const savedCustomCategories = localStorage.getItem('customCategories');
    if (savedCustomCategories) {
      try {
        setCustomCategories(JSON.parse(savedCustomCategories));
      } catch (e) {
        console.warn('Failed to parse custom categories from localStorage:', e);
      }
    }
    
    const savedHiddenCategories = localStorage.getItem('hiddenCategories');
    if (savedHiddenCategories) {
      try {
        setHiddenCategories(JSON.parse(savedHiddenCategories));
      } catch (e) {
        console.warn('Failed to parse hidden categories from localStorage:', e);
      }
    }
  }, []);

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

  // Pre-populate form when editing
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
      } else if (isSizeCustomizableCategory(editingProduct.category)) {
        // Parse jersey sizes from available_sizes
        try {
          let parsedSizes = null;
          if (editingProduct.available_sizes) {
            if (typeof editingProduct.available_sizes === 'string') {
              parsedSizes = JSON.parse(editingProduct.available_sizes);
            } else if (typeof editingProduct.available_sizes === 'object') {
              parsedSizes = editingProduct.available_sizes;
            }
            
            if (parsedSizes && typeof parsedSizes === 'object' && !Array.isArray(parsedSizes)) {
              // Support both old format (shirt/shorts) and new format (shirt.adult/kids, shorts.adult/kids)
              if (parsedSizes.shirt) {
                if (typeof parsedSizes.shirt === 'object' && !Array.isArray(parsedSizes.shirt)) {
                  setJerseyShirtSizesAdult(parsedSizes.shirt.adult || parsedSizes.shirt.Adult || []);
                  setJerseyShirtSizesKids(parsedSizes.shirt.kids || parsedSizes.shirt.Kids || []);
                } else {
                  // Old format - single array, treat as adult
                  setJerseyShirtSizesAdult(parsedSizes.shirt);
                  setJerseyShirtSizesKids([]);
                }
              }
              if (parsedSizes.shorts) {
                if (typeof parsedSizes.shorts === 'object' && !Array.isArray(parsedSizes.shorts)) {
                  setJerseyShortsSizesAdult(parsedSizes.shorts.adult || parsedSizes.shorts.Adult || []);
                  setJerseyShortsSizesKids(parsedSizes.shorts.kids || parsedSizes.shorts.Kids || []);
                } else {
                  // Old format - single array, treat as adult
                  setJerseyShortsSizesAdult(parsedSizes.shorts);
                  setJerseyShortsSizesKids([]);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse jersey sizes:', e);
          setJerseyShirtSizesAdult([]);
          setJerseyShirtSizesKids([]);
          setJerseyShortsSizesAdult([]);
          setJerseyShortsSizesKids([]);
        }
      } else {
        setAvailableSizes([]);
      }
      setSizeInputError('');
      setNewSizeInput('');
      setShirtSizeAdultError('');
      setShirtSizeKidsError('');
      setShortsSizeAdultError('');
      setShortsSizeKidsError('');
      setNewShirtSizeAdult('');
      setNewShirtSizeKids('');
      setNewShortsSizeAdult('');
      setNewShortsSizeKids('');
      
      // Set existing images
      if (editingProduct.main_image) {
        setMainImage(editingProduct.main_image);
      }
      if (editingProduct.additional_images && editingProduct.additional_images.length > 0) {
        setAdditionalImages(editingProduct.additional_images);
      }
    }
  }, [isEditMode, editingProduct]);

  const predefinedCategories = [
    'Jerseys',
    'T-Shirts', 
    'Long Sleeves',
    'Uniforms',
    'Jackets',
    'Hoodies',
    'Accessories',
    'Balls',
    'Trophies',
    'Hats'
  ];

  // Filter out hidden categories and merge predefined and custom categories
  const visiblePredefinedCategories = predefinedCategories.filter(
    cat => !hiddenCategories.includes(cat)
  );
  const categories = [...visiblePredefinedCategories, ...customCategories];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const trophyCategorySelected = isTrophyCategory(formData.category);
  const jerseyCategorySelected = isJerseyCategory(formData.category);
  const sizeCustomizableCategorySelected = isSizeCustomizableCategory(formData.category);
  const showShortsSizes = shouldShowShortsSizes(formData.category);

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
        // Keep previously entered trophy sizes when toggling between trophy options
        setAvailableSizes(prev => prev.length > 0 ? prev : []);
        setSizeInputError('');
        // Clear jersey sizes
        setJerseyShirtSizesAdult([]);
        setJerseyShirtSizesKids([]);
        setJerseyShortsSizesAdult([]);
        setJerseyShortsSizesKids([]);
        setNewShirtSizeAdult('');
        setNewShirtSizeKids('');
        setNewShortsSizeAdult('');
        setNewShortsSizeKids('');
        setShirtSizeAdultError('');
        setShirtSizeKidsError('');
        setShortsSizeAdultError('');
        setShortsSizeKidsError('');
      } else if (isSizeCustomizableCategory(value)) {
        // Keep previously entered sizes when toggling
        setShirtSizeAdultError('');
        setShirtSizeKidsError('');
        setShortsSizeAdultError('');
        setShortsSizeKidsError('');
        // Clear trophy sizes
        setAvailableSizes([]);
        setNewSizeInput('');
        setSizeInputError('');
      } else {
        setAvailableSizes([]);
        setNewSizeInput('');
        setSizeInputError('');
        setJerseyShirtSizesAdult([]);
        setJerseyShirtSizesKids([]);
        setJerseyShortsSizesAdult([]);
        setJerseyShortsSizesKids([]);
        setNewShirtSizeAdult('');
        setNewShirtSizeKids('');
        setNewShortsSizeAdult('');
        setNewShortsSizeKids('');
        setShirtSizeAdultError('');
        setShirtSizeKidsError('');
        setShortsSizeAdultError('');
        setShortsSizeKidsError('');
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

  const handleAddCategory = () => {
    const categoryName = newCategoryInput.trim();
    
    if (!categoryName) {
      setCategoryError('Please enter a category name.');
      return;
    }

    // Check if category already exists (case-insensitive)
    const categoryExists = categories.some(
      cat => cat.toLowerCase() === categoryName.toLowerCase()
    );

    if (categoryExists) {
      setCategoryError('This category already exists.');
      return;
    }

    // Add to custom categories
    const updatedCustomCategories = [...customCategories, categoryName];
    setCustomCategories(updatedCustomCategories);
    
    // Save to localStorage
    localStorage.setItem('customCategories', JSON.stringify(updatedCustomCategories));
    
    // Set the new category as selected
    setFormData(prev => ({
      ...prev,
      category: categoryName
    }));

    // Clear input and error
    setNewCategoryInput('');
    setCategoryError('');
  };

  const handleDeleteCategory = (categoryToDelete) => {
    // Don't allow deleting if it's currently selected
    if (formData.category === categoryToDelete) {
      setCategoryError('Cannot delete the currently selected category. Please select another category first.');
      return;
    }

    // Check if it's a custom category or predefined
    const isCustomCategory = customCategories.includes(categoryToDelete);
    const isPredefinedCategory = predefinedCategories.includes(categoryToDelete);

    if (isCustomCategory) {
      // Remove from custom categories (permanent delete)
      const updatedCustomCategories = customCategories.filter(
        cat => cat !== categoryToDelete
      );
      setCustomCategories(updatedCustomCategories);
      localStorage.setItem('customCategories', JSON.stringify(updatedCustomCategories));
    } else if (isPredefinedCategory) {
      // Hide predefined category (add to deleted list - permanent delete from dropdown)
      const updatedHiddenCategories = [...hiddenCategories, categoryToDelete];
      setHiddenCategories(updatedHiddenCategories);
      localStorage.setItem('hiddenCategories', JSON.stringify(updatedHiddenCategories));
      
      // Clear the category selection if it was the deleted one
      if (formData.category === categoryToDelete) {
        setFormData(prev => ({
          ...prev,
          category: ''
        }));
      }
    }

    setCategoryError('');
  };

  const handleRestoreCategory = (categoryToRestore) => {
    // Remove from hidden categories
    const updatedHiddenCategories = hiddenCategories.filter(
      cat => cat !== categoryToRestore
    );
    setHiddenCategories(updatedHiddenCategories);
    localStorage.setItem('hiddenCategories', JSON.stringify(updatedHiddenCategories));
  };

  const handleAddJerseyShirtSizeAdult = () => {
    if (!isSizeCustomizableCategory(formData.category)) {
      return;
    }

    const value = newShirtSizeAdult.trim();
    if (!value) {
      setShirtSizeAdultError('Enter a size before adding.');
      return;
    }

    const exists = jerseyShirtSizesAdult.some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setShirtSizeAdultError('Size already added.');
      return;
    }

    setJerseyShirtSizesAdult(prev => [...prev, value]);
    setNewShirtSizeAdult('');
    setShirtSizeAdultError('');
  };

  const handleAddJerseyShirtSizeKids = () => {
    if (!isSizeCustomizableCategory(formData.category)) {
      return;
    }

    const value = newShirtSizeKids.trim();
    if (!value) {
      setShirtSizeKidsError('Enter a size before adding.');
      return;
    }

    const exists = jerseyShirtSizesKids.some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setShirtSizeKidsError('Size already added.');
      return;
    }

    setJerseyShirtSizesKids(prev => [...prev, value]);
    setNewShirtSizeKids('');
    setShirtSizeKidsError('');
  };

  const handleAddJerseyShortsSizeAdult = () => {
    if (!isSizeCustomizableCategory(formData.category)) {
      return;
    }

    const value = newShortsSizeAdult.trim();
    if (!value) {
      setShortsSizeAdultError('Enter a size before adding.');
      return;
    }

    const exists = jerseyShortsSizesAdult.some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setShortsSizeAdultError('Size already added.');
      return;
    }

    setJerseyShortsSizesAdult(prev => [...prev, value]);
    setNewShortsSizeAdult('');
    setShortsSizeAdultError('');
  };

  const handleAddJerseyShortsSizeKids = () => {
    if (!isSizeCustomizableCategory(formData.category)) {
      return;
    }

    const value = newShortsSizeKids.trim();
    if (!value) {
      setShortsSizeKidsError('Enter a size before adding.');
      return;
    }

    const exists = jerseyShortsSizesKids.some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setShortsSizeKidsError('Size already added.');
      return;
    }

    setJerseyShortsSizesKids(prev => [...prev, value]);
    setNewShortsSizeKids('');
    setShortsSizeKidsError('');
  };

  const handleRemoveJerseyShirtSizeAdult = (sizeToRemove) => {
    setJerseyShirtSizesAdult(prev => prev.filter(size => size !== sizeToRemove));
    setShirtSizeAdultError('');
  };

  const handleRemoveJerseyShirtSizeKids = (sizeToRemove) => {
    setJerseyShirtSizesKids(prev => prev.filter(size => size !== sizeToRemove));
    setShirtSizeKidsError('');
  };

  const handleRemoveJerseyShortsSizeAdult = (sizeToRemove) => {
    setJerseyShortsSizesAdult(prev => prev.filter(size => size !== sizeToRemove));
    setShortsSizeAdultError('');
  };

  const handleRemoveJerseyShortsSizeKids = (sizeToRemove) => {
    setJerseyShortsSizesKids(prev => prev.filter(size => size !== sizeToRemove));
    setShortsSizeKidsError('');
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
    setError('');
    setSizeInputError('');
    setShirtSizeAdultError('');
    setShirtSizeKidsError('');
    setShortsSizeAdultError('');
    setShortsSizeKidsError('');

    const isTrophyProduct = isTrophyCategory(formData.category);
    const isSizeCustomizableProduct = isSizeCustomizableCategory(formData.category);
    
    if (isTrophyProduct && availableSizes.length === 0) {
      setError('Please add at least one available size for trophy products.');
      return;
    }

    if (isSizeCustomizableProduct && jerseyShirtSizesAdult.length === 0 && jerseyShirtSizesKids.length === 0) {
      setError('Please add at least one shirt size (Adult or Kids) for this product.');
      return;
    }

    if (isSizeCustomizableProduct && showShortsSizes && jerseyShortsSizesAdult.length === 0 && jerseyShortsSizesKids.length === 0) {
      setError('Please add at least one shorts size (Adult or Kids) for this product.');
      return;
    }

    setLoading(true);

    try {
      // Get current session
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

      if (isTrophyProduct) {
        productData.available_sizes = availableSizes;
      }

      if (isSizeCustomizableProduct) {
        const sizesData = {
          shirt: {
            adult: jerseyShirtSizesAdult,
            kids: jerseyShirtSizesKids
          }
        };
        
        // Only include shorts sizes if the category supports them
        if (showShortsSizes) {
          sizesData.shorts = {
            adult: jerseyShortsSizesAdult,
            kids: jerseyShortsSizesKids
          };
        } else {
          // For categories without shorts, set empty arrays
          sizesData.shorts = {
            adult: [],
            kids: []
          };
        }
        
        productData.available_sizes = JSON.stringify(sizesData);
      }


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
    <div className="modal-overlay add-product-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'EDIT PRODUCT' : 'ADD NEW ITEMS'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
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
                      <FontAwesomeIcon icon={faXmark} />
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
                          <FontAwesomeIcon icon={faXmark} />
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
                <div className="category-select-wrapper">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                    className="category-select"
                >
                  <option value="">Select Category</option>
                    {visiblePredefinedCategories.length > 0 && visiblePredefinedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                    {customCategories.length > 0 && (
                      <optgroup label="Custom Categories">
                        {customCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </optgroup>
                    )}
                </select>
              </div>

                {/* Add Custom Category Section */}
                <div className="add-category-section">
                  <div className="add-category-input-wrapper">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => {
                        setNewCategoryInput(e.target.value);
                        if (categoryError) setCategoryError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="Add new category"
                      className="add-category-input"
                    />
                    <button
                      type="button"
                      className="add-category-btn"
                      onClick={handleAddCategory}
                    >
                      Add Category
                    </button>
                  </div>
                  {categoryError && (
                    <div className="form-inline-error">{categoryError}</div>
                  )}
                  <div className="categories-management">
                    {/* Show all visible categories with delete option */}
                    {categories.length > 0 && (
                      <div className="existing-categories-list">
                        <small className="existing-categories-label">Existing Categories (Click × to delete):</small>
                        <div className="categories-chips-wrapper">
                          {visiblePredefinedCategories.map(cat => (
                            <span key={cat} className="existing-category-chip">
                              {cat}
                              <button
                                type="button"
                                aria-label={`Delete category ${cat}`}
                                onClick={() => handleDeleteCategory(cat)}
                                className="delete-category-btn"
                                title="Delete category"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </span>
                          ))}
                          {customCategories.map(cat => (
                            <span key={cat} className="custom-category-chip">
                              {cat}
                              <button
                                type="button"
                                aria-label={`Delete category ${cat}`}
                                onClick={() => handleDeleteCategory(cat)}
                                className="delete-category-btn"
                                title="Delete category"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hiddenCategories.length > 0 && (
                      <div className="hidden-categories-list">
                        <small className="hidden-categories-label">Deleted Categories (Click ↻ to restore):</small>
                        <div className="categories-chips-wrapper">
                          {hiddenCategories.map(cat => (
                            <span key={cat} className="hidden-category-chip">
                              {cat}
                              <button
                                type="button"
                                aria-label={`Restore category ${cat}`}
                                onClick={() => handleRestoreCategory(cat)}
                                className="restore-category-btn"
                                title="Restore category"
                              >
                                <FontAwesomeIcon icon={faRotateLeft} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {sizeCustomizableCategorySelected ? (
                <div className="form-group">
                  <label>Available Sizes</label>
                  
                  {/* Jersey Shirt Sizes */}
                  <div className="jersey-size-section">
                    <h4 className="jersey-size-subtitle">Shirt Sizes</h4>
                    
                    {/* Adult Shirt Sizes */}
                    <div className="jersey-size-subsection">
                      <h5 className="jersey-size-label">Adult Sizes</h5>
                      <div className="available-sizes-input">
                        <input
                          type="text"
                          value={newShirtSizeAdult}
                          onChange={(e) => setNewShirtSizeAdult(e.target.value)}
                          placeholder='e.g. S, M, L, XL'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddJerseyShirtSizeAdult();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="size-add-btn"
                          onClick={handleAddJerseyShirtSizeAdult}
                        >
                          Add
                        </button>
                      </div>
                      {shirtSizeAdultError && (
                        <div className="form-inline-error">{shirtSizeAdultError}</div>
                      )}
                      {jerseyShirtSizesAdult.length > 0 && (
                        <div className="available-sizes-list">
                          {jerseyShirtSizesAdult.map(size => (
                            <span key={size} className="available-size-chip">
                              {size}
                              <button
                                type="button"
                                aria-label={`Remove adult shirt size ${size}`}
                                onClick={() => handleRemoveJerseyShirtSizeAdult(size)}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kids Shirt Sizes */}
                    <div className="jersey-size-subsection">
                      <h5 className="jersey-size-label">Kids Sizes</h5>
                      <div className="available-sizes-input">
                        <input
                          type="text"
                          value={newShirtSizeKids}
                          onChange={(e) => setNewShirtSizeKids(e.target.value)}
                          placeholder='e.g. XS, S, M, L'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddJerseyShirtSizeKids();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="size-add-btn"
                          onClick={handleAddJerseyShirtSizeKids}
                        >
                          Add
                        </button>
                      </div>
                      {shirtSizeKidsError && (
                        <div className="form-inline-error">{shirtSizeKidsError}</div>
                      )}
                      {jerseyShirtSizesKids.length > 0 && (
                        <div className="available-sizes-list">
                          {jerseyShirtSizesKids.map(size => (
                            <span key={size} className="available-size-chip">
                              {size}
                              <button
                                type="button"
                                aria-label={`Remove kids shirt size ${size}`}
                                onClick={() => handleRemoveJerseyShirtSizeKids(size)}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shorts Sizes - Only show for categories that have shorts */}
                  {showShortsSizes && (
                  <div className="jersey-size-section">
                    <h4 className="jersey-size-subtitle">Shorts Sizes</h4>
                    
                    {/* Adult Shorts Sizes */}
                    <div className="jersey-size-subsection">
                      <h5 className="jersey-size-label">Adult Sizes</h5>
                      <div className="available-sizes-input">
                        <input
                          type="text"
                          value={newShortsSizeAdult}
                          onChange={(e) => setNewShortsSizeAdult(e.target.value)}
                          placeholder='e.g. S, M, L, XL'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddJerseyShortsSizeAdult();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="size-add-btn"
                          onClick={handleAddJerseyShortsSizeAdult}
                        >
                          Add
                        </button>
                      </div>
                      {shortsSizeAdultError && (
                        <div className="form-inline-error">{shortsSizeAdultError}</div>
                      )}
                      {jerseyShortsSizesAdult.length > 0 && (
                        <div className="available-sizes-list">
                          {jerseyShortsSizesAdult.map(size => (
                            <span key={size} className="available-size-chip">
                              {size}
                              <button
                                type="button"
                                aria-label={`Remove adult shorts size ${size}`}
                                onClick={() => handleRemoveJerseyShortsSizeAdult(size)}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kids Shorts Sizes */}
                    <div className="jersey-size-subsection">
                      <h5 className="jersey-size-label">Kids Sizes</h5>
                      <div className="available-sizes-input">
                        <input
                          type="text"
                          value={newShortsSizeKids}
                          onChange={(e) => setNewShortsSizeKids(e.target.value)}
                          placeholder='e.g. XS, S, M, L'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddJerseyShortsSizeKids();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="size-add-btn"
                          onClick={handleAddJerseyShortsSizeKids}
                        >
                          Add
                        </button>
                      </div>
                      {shortsSizeKidsError && (
                        <div className="form-inline-error">{shortsSizeKidsError}</div>
                      )}
                      {jerseyShortsSizesKids.length > 0 && (
                        <div className="available-sizes-list">
                          {jerseyShortsSizesKids.map(size => (
                            <span key={size} className="available-size-chip">
                              {size}
                              <button
                                type="button"
                                aria-label={`Remove kids shorts size ${size}`}
                                onClick={() => handleRemoveJerseyShortsSizeKids(size)}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                  <small className="form-help">
                    {showShortsSizes 
                      ? 'Add the available sizes for shirts and shorts (Adult and Kids) that customers can choose from.'
                      : 'Add the available sizes for shirts (Adult and Kids) that customers can choose from.'}
                  </small>
                </div>
              ) : trophyCategorySelected ? (
                <div className="form-group">
                  <label>Available Sizes</label>
                  <div className="available-sizes-input">
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
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
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <small className="form-help">Add the trophy sizes customers can choose from (e.g., 13&quot;, 16&quot;, 19&quot;, 21&quot;).</small>
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
