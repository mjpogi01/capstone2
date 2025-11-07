import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './AddProductModal.css';

const isTrophyCategory = (category) => typeof category === 'string' && category.toLowerCase() === 'trophies';
const isJerseyCategory = (category) => {
  if (!category || typeof category !== 'string') return false;
  const lowerCategory = category.toLowerCase();
  return lowerCategory === 'jerseys' || lowerCategory === 'uniforms' || 
         lowerCategory === 't-shirts' || lowerCategory === 'long sleeves' ||
         lowerCategory === 'hoodies';
};
const shouldShowShorts = (category) => {
  if (!category || typeof category !== 'string') return false;
  const lowerCategory = category.toLowerCase();
  // Only show shorts for actual Jerseys category
  return lowerCategory === 'jerseys';
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
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
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

const parseJerseySizes = (sizeValue) => {
  const defaultSizes = {
    shirts: { adults: [], kids: [] },
    shorts: { adults: [], kids: [] }
  };

  if (!sizeValue) {
    return defaultSizes;
  }

  if (typeof sizeValue !== 'string') {
    return defaultSizes;
  }

  const trimmed = sizeValue.trim();
  if (!trimmed.startsWith('{')) {
    return defaultSizes;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        shirts: {
          adults: Array.isArray(parsed.shirts?.adults) ? parsed.shirts.adults : [],
          kids: Array.isArray(parsed.shirts?.kids) ? parsed.shirts.kids : []
        },
        shorts: {
          adults: Array.isArray(parsed.shorts?.adults) ? parsed.shorts.adults : [],
          kids: Array.isArray(parsed.shorts?.kids) ? parsed.shorts.kids : []
        }
      };
    }
  } catch (error) {
    console.warn('Failed to parse jersey sizes in AddProductModal:', error.message);
  }

  return defaultSizes;
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
  const [jerseyPrices, setJerseyPrices] = useState({
    fullSet: '',
    shirtOnly: '',
    shortsOnly: ''
  });
  // Trophy prices: object mapping size to price, e.g., { "14\" (Large)": 1000, "10\" (Medium)": 750 }
  const [trophyPrices, setTrophyPrices] = useState({});
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
  
  // Jersey sizes structure: { shirts: { adults: [], kids: [] }, shorts: { adults: [], kids: [] } }
  const [jerseySizes, setJerseySizes] = useState({
    shirts: { adults: [], kids: [] },
    shorts: { adults: [], kids: [] }
  });
  const [newJerseySizeInput, setNewJerseySizeInput] = useState({
    shirts: { adults: '', kids: '' },
    shorts: { adults: '', kids: '' }
  });
  const [collapsedGroups, setCollapsedGroups] = useState({
    'adults': false,
    'kids': false
  });
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const predefinedCategories = [
    'Jerseys',
    'T-Shirts',
    'Long Sleeves',
    'Uniforms',
    'Accessories',
    'Balls',
    'Trophies',
    'Hats'
  ];

  const [categories, setCategories] = useState(predefinedCategories);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    // Load custom categories from localStorage
    const loadCustomCategories = () => {
      try {
        // Load deleted predefined categories
        let deletedPredefined = [];
        try {
          const savedDeletedPredefined = localStorage.getItem('deletedPredefinedCategories');
          if (savedDeletedPredefined) {
            deletedPredefined = JSON.parse(savedDeletedPredefined);
          }
        } catch (e) {
          console.warn('Failed to load deleted predefined categories:', e);
        }

        // Filter out deleted predefined categories
        const activePredefined = predefinedCategories.filter(
          cat => !deletedPredefined.includes(cat)
        );

        // Load custom categories
        const savedCustomCategories = localStorage.getItem('customCategories');
        if (savedCustomCategories) {
          const customCats = JSON.parse(savedCustomCategories);
          setCategories([...activePredefined, ...customCats]);
        } else {
          setCategories(activePredefined);
        }
      } catch (e) {
        console.warn('Failed to load custom categories:', e);
        setCategories(predefinedCategories);
      }
    };

    loadCustomCategories();
  }, []);

  const handleAddCategory = () => {
    const trimmedCategory = newCategoryInput.trim();
    
    if (!trimmedCategory) {
      setCategoryError('Please enter a category name');
      return;
    }

    // Check if category already exists (case insensitive)
    const categoryExists = categories.some(cat => 
      cat.toLowerCase() === trimmedCategory.toLowerCase()
    );

    if (categoryExists) {
      setCategoryError('This category already exists');
      return;
    }

    // Add to state
    const updatedCategories = [...categories, trimmedCategory];
    setCategories(updatedCategories);

    // Save to localStorage
    try {
      const customCategories = updatedCategories.filter(
        cat => !predefinedCategories.includes(cat)
      );
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
    } catch (e) {
      console.error('Failed to save custom categories:', e);
    }

    setNewCategoryInput('');
    setCategoryError('');
  };

  const handleRemoveCategory = (categoryToRemove) => {
    // Remove from state
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);

    // Update localStorage - store only custom categories (non-predefined ones)
    try {
      const customCategories = updatedCategories.filter(
        cat => !predefinedCategories.includes(cat)
      );
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
      
      // Also store deleted predefined categories separately to track what was hidden
      const deletedPredefined = predefinedCategories.filter(
        cat => !updatedCategories.includes(cat)
      );
      if (deletedPredefined.length > 0) {
        localStorage.setItem('deletedPredefinedCategories', JSON.stringify(deletedPredefined));
      }
    } catch (e) {
      console.error('Failed to update custom categories:', e);
    }

    setCategoryError('');

    // Clear the selected category if it was removed
    if (formData.category === categoryToRemove) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  };

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
      // Parse price - for jerseys, check jersey_prices column first, then fallback to price
      let priceValue = editingProduct.price || '';
      let jerseyPricesValue = { fullSet: '', shirtOnly: '', shortsOnly: '' };
      
      if (shouldShowShorts(editingProduct.category)) {
        // Check if jersey_prices column exists and has data
        if (editingProduct.jersey_prices) {
          // Use jersey_prices if available
          const prices = typeof editingProduct.jersey_prices === 'string' 
            ? JSON.parse(editingProduct.jersey_prices) 
            : editingProduct.jersey_prices;
          jerseyPricesValue = {
            fullSet: prices.fullSet || prices.full_set || '',
            shirtOnly: prices.shirtOnly || prices.shirt_only || '',
            shortsOnly: prices.shortsOnly || prices.shorts_only || ''
          };
          priceValue = prices.fullSet || prices.full_set || editingProduct.price || '';
        } else {
          // Fallback: use price column as full set price
          priceValue = editingProduct.price || '';
          jerseyPricesValue.fullSet = editingProduct.price || '';
        }
      }
      
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        size: editingProduct.size || '',
        price: priceValue,
        description: editingProduct.description || '',
        stock_quantity: editingProduct.stock_quantity || null,
        sold_quantity: editingProduct.sold_quantity || 0,
        branch_id: editingProduct.branch_id || 1
      });

      // Parse trophy prices if it's a trophy product
      let trophyPricesValue = {};
      if (isTrophyCategory(editingProduct.category)) {
        const parsedSizes = parseAvailableSizes(editingProduct.size);
        setAvailableSizes(parsedSizes);
        
        // Load trophy_prices if available
        if (editingProduct.trophy_prices) {
          try {
            const prices = typeof editingProduct.trophy_prices === 'string' 
              ? JSON.parse(editingProduct.trophy_prices) 
              : editingProduct.trophy_prices;
            trophyPricesValue = prices || {};
          } catch (e) {
            console.warn('Failed to parse trophy_prices:', e);
            trophyPricesValue = {};
          }
        }
      } else if (isJerseyCategory(editingProduct.category)) {
        const parsedJerseySizes = parseJerseySizes(editingProduct.size);
        setJerseySizes(parsedJerseySizes);
        setAvailableSizes([]); // Clear trophy sizes
      } else {
        setAvailableSizes([]);
        setJerseySizes({
          shirts: { adults: [], kids: [] },
          shorts: { adults: [], kids: [] }
        });
      }

      setJerseyPrices(jerseyPricesValue);
      setTrophyPrices(trophyPricesValue);
      setSizeInputError('');
      setNewSizeInput('');
      setNewJerseySizeInput({
        shirts: { adults: '', kids: '' },
        shorts: { adults: '', kids: '' }
      });

      if (editingProduct.main_image) {
        setMainImage(editingProduct.main_image);
      }
      if (editingProduct.additional_images && editingProduct.additional_images.length > 0) {
        setAdditionalImages(editingProduct.additional_images);
      }
    }
  }, [isEditMode, editingProduct]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL'];
  const kidsSizes = ['S6', 'S8', 'S10', 'S12', 'S14'];
  const trophyCategorySelected = isTrophyCategory(formData.category);
  const jerseyCategorySelected = isJerseyCategory(formData.category);
  const showMultipleSizes = trophyCategorySelected || jerseyCategorySelected;

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
          setJerseySizes({
            shirts: { adults: [], kids: [] },
            shorts: { adults: [], kids: [] }
          });
          setJerseyPrices({ fullSet: '', shirtOnly: '', shortsOnly: '' });
          setTrophyPrices({});
          setSizeInputError('');
        } else if (isJerseyCategory(value)) {
          setJerseySizes(prev => ({
            shirts: {
              adults: prev.shirts.adults.length > 0 ? prev.shirts.adults : [],
              kids: prev.shirts.kids.length > 0 ? prev.shirts.kids : []
            },
            shorts: {
              adults: prev.shorts.adults.length > 0 ? prev.shorts.adults : [],
              kids: prev.shorts.kids.length > 0 ? prev.shorts.kids : []
            }
          }));
          setAvailableSizes([]);
          setSizeInputError('');
        } else {
          setAvailableSizes([]);
          setJerseySizes({
            shirts: { adults: [], kids: [] },
            shorts: { adults: [], kids: [] }
          });
          setJerseyPrices({ fullSet: '', shirtOnly: '', shortsOnly: '' });
          setTrophyPrices({});
          setNewSizeInput('');
          setSizeInputError('');
          setNewJerseySizeInput({
            shirts: { adults: '', kids: '' },
            shorts: { adults: '', kids: '' }
          });
        }
      }
  };

  // Handle trophy price changes
  const handleTrophyPriceChange = (size, price) => {
    setTrophyPrices(prev => ({
      ...prev,
      [size]: price
    }));
  };

  // Remove trophy price when size is removed
  const handleRemoveTrophySize = (sizeToRemove) => {
    setAvailableSizes(prev => prev.filter(size => size !== sizeToRemove));
    setTrophyPrices(prev => {
      const updated = { ...prev };
      delete updated[sizeToRemove];
      return updated;
    });
    setSizeInputError('');
  };

  const handleSizeSelect = (size) => {
    setFormData(prev => ({
      ...prev,
      size: size
    }));
  };

  const handleAddAvailableSize = () => {
    if (!isTrophyCategory(formData.category) && !isJerseyCategory(formData.category)) {
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
    // Initialize price as empty for new trophy size
    if (isTrophyCategory(formData.category)) {
      setTrophyPrices(prev => ({
        ...prev,
        [value]: ''
      }));
    }
    setNewSizeInput('');
    setSizeInputError('');
  };

  const handleRemoveAvailableSize = (sizeToRemove) => {
    setAvailableSizes(prev => prev.filter(size => size !== sizeToRemove));
    setSizeInputError('');
  };

  // Jersey size handlers
  const handleAddJerseySize = (type, ageGroup) => {
    const value = newJerseySizeInput[type][ageGroup].trim();
    if (!value) {
      setSizeInputError(`Enter a size before adding for ${type} ${ageGroup}.`);
      return;
    }

    const exists = jerseySizes[type][ageGroup].some(size => size.toLowerCase() === value.toLowerCase());
    if (exists) {
      setSizeInputError(`Size ${value} already added for ${type} ${ageGroup}.`);
      return;
    }

    setJerseySizes(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [ageGroup]: [...prev[type][ageGroup], value]
      }
    }));

    setNewJerseySizeInput(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [ageGroup]: ''
      }
    }));
    setSizeInputError('');
  };

  const handleRemoveJerseySize = (type, ageGroup, sizeToRemove) => {
    setJerseySizes(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [ageGroup]: prev[type][ageGroup].filter(size => size !== sizeToRemove)
      }
    }));
    setSizeInputError('');
  };

  const handleQuickAddJerseySize = (type, ageGroup, size) => {
    const exists = jerseySizes[type][ageGroup].includes(size);
    if (exists) {
      handleRemoveJerseySize(type, ageGroup, size);
    } else {
      setJerseySizes(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [ageGroup]: [...prev[type][ageGroup], size]
        }
      }));
      setSizeInputError('');
    }
  };

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleSelectAllSizes = (type, ageGroup, sizesArray) => {
    // Toggle between selecting all and unselecting all
    const sizesToCheck = sizesArray || sizes;
    const currentSizes = jerseySizes[type][ageGroup];
    const allSelected = sizesToCheck.every(size => currentSizes.includes(size));
    
    if (allSelected) {
      // Unselect all - remove all sizes from the array
      setJerseySizes(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [ageGroup]: prev[type][ageGroup].filter(size => !sizesToCheck.includes(size))
        }
      }));
    } else {
      // Add all sizes from the provided array that aren't already included
      setJerseySizes(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [ageGroup]: [...new Set([...prev[type][ageGroup], ...sizesToCheck])]
        }
      }));
    }
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
    const isJerseyProduct = isJerseyCategory(formData.category);

    if (isTrophyProduct && availableSizes.length === 0) {
      setError('Please add at least one available size for trophy products.');
      return;
    }

    // Validate trophy prices - each size must have a price
    if (isTrophyProduct) {
      const missingPrices = availableSizes.filter(size => {
        const price = trophyPrices[size];
        return !price || price.toString().trim() === '' || isNaN(parseFloat(price)) || parseFloat(price) < 0;
      });
      
      if (missingPrices.length > 0) {
        setError(`Please enter a valid price for all trophy sizes. Missing prices for: ${missingPrices.join(', ')}`);
        return;
      }
    }

    if (isJerseyProduct) {
      const hasShirtSizes = jerseySizes.shirts.adults.length > 0 || jerseySizes.shirts.kids.length > 0;
      const hasShortSizes = jerseySizes.shorts.adults.length > 0 || jerseySizes.shorts.kids.length > 0;
      const showShorts = shouldShowShorts(formData.category);
      
      // For categories without shorts (Uniforms, T-Shirts, Long Sleeves), only check shirt sizes
      // For Jerseys, check both shirt and short sizes
      if (showShorts) {
        if (!hasShirtSizes && !hasShortSizes) {
          setError('Please add at least one size for shirts or shorts (adults or kids).');
          return;
        }
      } else {
        if (!hasShirtSizes) {
          setError('Please add at least one size for shirts (adults or kids).');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Please log in to add products');
        return;
      }

      let sizeValue = null;
      if (isTrophyProduct && availableSizes.length > 0) {
        sizeValue = JSON.stringify(availableSizes);
      } else if (isJerseyProduct) {
        const hasAnySizes = jerseySizes.shirts.adults.length > 0 || jerseySizes.shirts.kids.length > 0 ||
                           jerseySizes.shorts.adults.length > 0 || jerseySizes.shorts.kids.length > 0;
        if (hasAnySizes) {
          sizeValue = JSON.stringify(jerseySizes);
        }
      } else {
        sizeValue = formData.size || null;
      }

      // Handle price - for jerseys, store full set price in price column and all prices in jersey_prices
      // For trophies, store prices per size in trophy_prices
      let priceValue = formData.price;
      let jerseyPricesValue = null;
      let trophyPricesValue = null;
      
      // Check if this is specifically a Jerseys category (not uniforms, t-shirts, etc.)
      const isJerseysCategory = shouldShowShorts(formData.category);
      
      if (isTrophyProduct) {
        // Store trophy prices as JSONB object mapping size to price
        const pricesObject = {};
        availableSizes.forEach(size => {
          const price = trophyPrices[size];
          if (price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0) {
            pricesObject[size] = parseFloat(price);
          }
        });
        trophyPricesValue = pricesObject;
        // Use the first size's price as the base price (or minimum if needed)
        const firstSizePrice = availableSizes.length > 0 && trophyPrices[availableSizes[0]] 
          ? parseFloat(trophyPrices[availableSizes[0]]) 
          : parseFloat(formData.price) || 0;
        priceValue = firstSizePrice;
        console.log('🏆 [AddProductModal] Trophy prices being saved:', trophyPricesValue);
      } else if (isJerseysCategory) {
        // Validate jersey prices - check for empty strings and ensure values are valid numbers
        const fullSetValue = jerseyPrices.fullSet?.toString().trim();
        const shirtOnlyValue = jerseyPrices.shirtOnly?.toString().trim();
        const shortsOnlyValue = jerseyPrices.shortsOnly?.toString().trim();
        
        console.log('🔍 [AddProductModal] Validating jersey prices:', {
          fullSet: fullSetValue,
          shirtOnly: shirtOnlyValue,
          shortsOnly: shortsOnlyValue
        });
        
        if (!fullSetValue || fullSetValue === '' || isNaN(parseFloat(fullSetValue)) || parseFloat(fullSetValue) < 0) {
          setError('Please enter a valid Full Set Price.');
          setLoading(false);
          return;
        }
        
        if (!shirtOnlyValue || shirtOnlyValue === '' || isNaN(parseFloat(shirtOnlyValue)) || parseFloat(shirtOnlyValue) < 0) {
          setError('Please enter a valid Shirt Only Price.');
          setLoading(false);
          return;
        }
        
        if (!shortsOnlyValue || shortsOnlyValue === '' || isNaN(parseFloat(shortsOnlyValue)) || parseFloat(shortsOnlyValue) < 0) {
          setError('Please enter a valid Shorts Only Price.');
          setLoading(false);
          return;
        }
        
        // Store full set price in price column (for backward compatibility)
        priceValue = parseFloat(fullSetValue);
        // Store all prices in jersey_prices JSONB column
        jerseyPricesValue = {
          fullSet: parseFloat(fullSetValue),
          shirtOnly: parseFloat(shirtOnlyValue),
          shortsOnly: parseFloat(shortsOnlyValue)
        };
        
        console.log('✅ [AddProductModal] Jersey prices validated and formatted:', jerseyPricesValue);
      } else {
        // For non-jersey products, use regular price
        if (!formData.price) {
          setError('Please enter a price.');
          setLoading(false);
          return;
        }
        priceValue = parseFloat(formData.price);
      }

      const productData = {
        ...formData,
        price: priceValue,
        jersey_prices: jerseyPricesValue,
        trophy_prices: trophyPricesValue,
        size: sizeValue,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        sold_quantity: formData.sold_quantity ? parseInt(formData.sold_quantity) : 0,
        main_image: mainImage,
        additional_images: additionalImages
      };

      console.log('📦 [AddProductModal] Sending product data:', {
        ...productData,
        jersey_prices: jerseyPricesValue
      });
      console.log('📦 [AddProductModal] Jersey prices value:', jerseyPricesValue);
      console.log('📦 [AddProductModal] Jersey prices state:', jerseyPrices);

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
        console.error('❌ [AddProductModal] API Error:', errorData);
        throw new Error(errorData.error || 'Failed to add product');
      }

      const newProduct = await response.json();
      console.log('✅ [AddProductModal] Product added successfully:', newProduct);
      console.log('✅ [AddProductModal] Product jersey_prices:', newProduct.jersey_prices);
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
                <small className="form-help">Select an existing category or manage categories below</small>
                
                {/* Category Management Section */}
                <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: 'none',
                      borderBottom: categoriesExpanded ? '2px solid #e5e7eb' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
                      e.target.style.borderColor = categoriesExpanded ? '#e5e7eb' : 'transparent';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Manage Categories</h5>
                    <FontAwesomeIcon 
                      icon={categoriesExpanded ? faChevronUp : faChevronDown}
                      style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </button>
                  
                  {categoriesExpanded && (
                    <div style={{ padding: '1rem', animation: 'dropdownSlideDown 0.3s ease-out' }}>
                      {/* Add Category */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                          type="text"
                          value={newCategoryInput}
                          onChange={(e) => {
                            setNewCategoryInput(e.target.value);
                            setCategoryError('');
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                          placeholder="Enter new category name"
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            background: '#ffffff',
                            color: '#111827'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#3b82f6',
                            color: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                          onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                        >
                          Add
                        </button>
                      </div>
                      
                      {categoryError && (
                        <div style={{ 
                          color: '#dc2626', 
                          fontSize: '0.75rem', 
                          fontWeight: 500,
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          background: '#fef2f2',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          {categoryError}
                        </div>
                      )}
                      
                      {/* Category List with Remove Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {categories.map(cat => {
                          const isPredefined = predefinedCategories.includes(cat);
                          return (
                            <div key={cat} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.75rem',
                              background: isPredefined ? '#ffffff' : '#f1f5f9',
                              borderRadius: '6px',
                              border: isPredefined ? '1px solid #e2e8f0' : '1px solid #cbd5f5'
                            }}>
                              <span style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: 500,
                                color: '#111827'
                              }}>
                                {cat}
                                {isPredefined && (
                                  <span style={{ 
                                    marginLeft: '0.5rem',
                                    fontSize: '0.7rem',
                                    color: '#64748b',
                                    fontStyle: 'italic'
                                  }}>(Built-in)</span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                aria-label={`Remove category ${cat}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#fef2f2';
                                  e.target.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'none';
                                  e.target.style.transform = 'scale(1)';
                                }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {trophyCategorySelected ? (
                <div className="form-group">
                  <label>Available Sizes</label>
                  <div className="available-sizes-input">
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(event) => setNewSizeInput(event.target.value)}
                      onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddAvailableSize();
                        }
                      }}
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
                    <div className="available-sizes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                      {availableSizes.map(size => (
                        <div key={size} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <span style={{ flex: '0 0 150px', fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>{size}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: 500 }}>Price: <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                              type="number"
                              value={trophyPrices[size] || ''}
                              onChange={(e) => handleTrophyPriceChange(size, e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              required
                              style={{ 
                                width: '120px', 
                                padding: '0.5rem', 
                                border: '1px solid #d1d5db', 
                                borderRadius: '6px', 
                                fontSize: '0.875rem',
                                background: '#ffffff'
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove size ${size}`}
                            onClick={() => handleRemoveAvailableSize(size)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease',
                              flex: '0 0 auto'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#fef2f2';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'none';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            {'×'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <small className="form-help">
                    Add trophy sizes and their corresponding prices. Each size must have a price (e.g., 13" = 500, 16" = 750, 19" = 1000).
                  </small>
                </div>
              ) : jerseyCategorySelected ? (
                <div className="form-group jersey-sizes-section">
                  <label>Available Sizes for Jerseys</label>
                  
                  {/* Adults - Shirt and Short Sizes */}
                  <div className="jersey-size-group">
                    <button
                      type="button"
                      className="jersey-size-group-header"
                      onClick={() => toggleGroupCollapse('adults')}
                      aria-label={collapsedGroups['adults'] ? 'Expand' : 'Collapse'}
                    >
                      <h4 className="jersey-size-group-title">Adults Sizes</h4>
                      <FontAwesomeIcon 
                        icon={collapsedGroups['adults'] ? faChevronDown : faChevronUp} 
                        className="jersey-group-chevron"
                      />
                    </button>
                    {!collapsedGroups['adults'] && (
                      <div className="jersey-size-group-content">
                        {/* Shirt Sizes - Adults */}
                        <div className="jersey-size-subgroup">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h5 className="jersey-size-subgroup-title" style={{ margin: 0 }}>Shirt Sizes</h5>
                            <button
                              type="button"
                              onClick={() => handleSelectAllSizes('shirts', 'adults')}
                              style={{
                                background: 'none',
                                border: 'none',
                                textDecoration: 'underline',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                padding: 0,
                                fontFamily: 'inherit'
                              }}
                            >
                              {sizes.every(size => jerseySizes.shirts.adults.includes(size)) ? 'UNSELECT ALL' : 'SELECT ALL'}
                            </button>
                          </div>
                          <div className="size-quick-add">
                            <p>Quick add standard sizes:</p>
                            <div className="quick-size-buttons">
                              {sizes.map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  className={`quick-size-btn ${jerseySizes.shirts.adults.includes(size) ? 'selected' : ''}`}
                                  onClick={() => handleQuickAddJerseySize('shirts', 'adults', size)}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="available-sizes-input">
                            <input
                              type="text"
                              value={newJerseySizeInput.shirts.adults}
                              onChange={(e) => setNewJerseySizeInput(prev => ({
                                ...prev,
                                shirts: { ...prev.shirts, adults: e.target.value }
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddJerseySize('shirts', 'adults');
                                }
                              }}
                              placeholder="e.g. S, M, L or custom size"
                            />
                            <button
                              type="button"
                              className="size-add-btn"
                              onClick={() => handleAddJerseySize('shirts', 'adults')}
                            >
                              Add
                            </button>
                          </div>
                          {jerseySizes.shirts.adults.length > 0 && (
                            <div className="available-sizes-list">
                              {jerseySizes.shirts.adults.map(size => (
                                <span key={size} className="available-size-chip">
                                  {size}
                                  <button
                                    type="button"
                                    aria-label={`Remove size ${size}`}
                                    onClick={() => handleRemoveJerseySize('shirts', 'adults', size)}
                                  >
                                    {'×'}
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Short Sizes - Adults - Only show for Jerseys */}
                        {shouldShowShorts(formData.category) && (
                          <div className="jersey-size-subgroup">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <h5 className="jersey-size-subgroup-title" style={{ margin: 0 }}>Short Sizes</h5>
                              <button
                                type="button"
                                onClick={() => handleSelectAllSizes('shorts', 'adults')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  textDecoration: 'underline',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  padding: 0,
                                  fontFamily: 'inherit'
                                }}
                              >
                                {sizes.every(size => jerseySizes.shorts.adults.includes(size)) ? 'UNSELECT ALL' : 'SELECT ALL'}
                              </button>
                            </div>
                            <div className="size-quick-add">
                              <p>Quick add standard sizes:</p>
                              <div className="quick-size-buttons">
                                {sizes.map(size => (
                                  <button
                                    key={size}
                                    type="button"
                                    className={`quick-size-btn ${jerseySizes.shorts.adults.includes(size) ? 'selected' : ''}`}
                                    onClick={() => handleQuickAddJerseySize('shorts', 'adults', size)}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="available-sizes-input">
                              <input
                                type="text"
                                value={newJerseySizeInput.shorts.adults}
                                onChange={(e) => setNewJerseySizeInput(prev => ({
                                  ...prev,
                                  shorts: { ...prev.shorts, adults: e.target.value }
                                }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddJerseySize('shorts', 'adults');
                                  }
                                }}
                                placeholder="e.g. S, M, L or custom size"
                              />
                              <button
                                type="button"
                                className="size-add-btn"
                                onClick={() => handleAddJerseySize('shorts', 'adults')}
                              >
                                Add
                              </button>
                            </div>
                            {jerseySizes.shorts.adults.length > 0 && (
                              <div className="available-sizes-list">
                                {jerseySizes.shorts.adults.map(size => (
                                  <span key={size} className="available-size-chip">
                                    {size}
                                    <button
                                      type="button"
                                      aria-label={`Remove size ${size}`}
                                      onClick={() => handleRemoveJerseySize('shorts', 'adults', size)}
                                    >
                                      {'×'}
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kids - Shirt and Short Sizes */}
                  <div className="jersey-size-group">
                    <button
                      type="button"
                      className="jersey-size-group-header"
                      onClick={() => toggleGroupCollapse('kids')}
                      aria-label={collapsedGroups['kids'] ? 'Expand' : 'Collapse'}
                    >
                      <h4 className="jersey-size-group-title">Kids Sizes</h4>
                      <FontAwesomeIcon 
                        icon={collapsedGroups['kids'] ? faChevronDown : faChevronUp} 
                        className="jersey-group-chevron"
                      />
                    </button>
                    {!collapsedGroups['kids'] && (
                      <div className="jersey-size-group-content">
                        {/* Shirt Sizes - Kids */}
                        <div className="jersey-size-subgroup">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h5 className="jersey-size-subgroup-title" style={{ margin: 0 }}>Shirt Sizes</h5>
                            <button
                              type="button"
                              onClick={() => handleSelectAllSizes('shirts', 'kids', kidsSizes)}
                              style={{
                                background: 'none',
                                border: 'none',
                                textDecoration: 'underline',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                padding: 0,
                                fontFamily: 'inherit'
                              }}
                            >
                              {kidsSizes.every(size => jerseySizes.shirts.kids.includes(size)) ? 'UNSELECT ALL' : 'SELECT ALL'}
                            </button>
                          </div>
                          <div className="size-quick-add">
                            <p>Quick add standard sizes:</p>
                            <div className="quick-size-buttons">
                              {kidsSizes.map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  className={`quick-size-btn ${jerseySizes.shirts.kids.includes(size) ? 'selected' : ''}`}
                                  onClick={() => handleQuickAddJerseySize('shirts', 'kids', size)}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="available-sizes-input">
                            <input
                              type="text"
                              value={newJerseySizeInput.shirts.kids}
                              onChange={(e) => setNewJerseySizeInput(prev => ({
                                ...prev,
                                shirts: { ...prev.shirts, kids: e.target.value }
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddJerseySize('shirts', 'kids');
                                }
                              }}
                              placeholder="e.g. S6, S8, S10 or custom size"
                            />
                            <button
                              type="button"
                              className="size-add-btn"
                              onClick={() => handleAddJerseySize('shirts', 'kids')}
                            >
                              Add
                            </button>
                          </div>
                          {jerseySizes.shirts.kids.length > 0 && (
                            <div className="available-sizes-list">
                              {jerseySizes.shirts.kids.map(size => (
                                <span key={size} className="available-size-chip">
                                  {size}
                                  <button
                                    type="button"
                                    aria-label={`Remove size ${size}`}
                                    onClick={() => handleRemoveJerseySize('shirts', 'kids', size)}
                                  >
                                    {'×'}
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Short Sizes - Kids - Only show for Jerseys */}
                        {shouldShowShorts(formData.category) && (
                          <div className="jersey-size-subgroup">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <h5 className="jersey-size-subgroup-title" style={{ margin: 0 }}>Short Sizes</h5>
                              <button
                                type="button"
                                onClick={() => handleSelectAllSizes('shorts', 'kids', kidsSizes)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  textDecoration: 'underline',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  padding: 0,
                                  fontFamily: 'inherit'
                                }}
                              >
                                {kidsSizes.every(size => jerseySizes.shorts.kids.includes(size)) ? 'UNSELECT ALL' : 'SELECT ALL'}
                              </button>
                            </div>
                            <div className="size-quick-add">
                              <p>Quick add standard sizes:</p>
                              <div className="quick-size-buttons">
                                {kidsSizes.map(size => (
                                  <button
                                    key={size}
                                    type="button"
                                    className={`quick-size-btn ${jerseySizes.shorts.kids.includes(size) ? 'selected' : ''}`}
                                    onClick={() => handleQuickAddJerseySize('shorts', 'kids', size)}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="available-sizes-input">
                              <input
                                type="text"
                                value={newJerseySizeInput.shorts.kids}
                                onChange={(e) => setNewJerseySizeInput(prev => ({
                                  ...prev,
                                  shorts: { ...prev.shorts, kids: e.target.value }
                                }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddJerseySize('shorts', 'kids');
                                  }
                                }}
                                placeholder="e.g. S6, S8, S10 or custom size"
                              />
                              <button
                                type="button"
                                className="size-add-btn"
                                onClick={() => handleAddJerseySize('shorts', 'kids')}
                              >
                                Add
                              </button>
                            </div>
                            {jerseySizes.shorts.kids.length > 0 && (
                              <div className="available-sizes-list">
                                {jerseySizes.shorts.kids.map(size => (
                                  <span key={size} className="available-size-chip">
                                    {size}
                                    <button
                                      type="button"
                                      aria-label={`Remove size ${size}`}
                                      onClick={() => handleRemoveJerseySize('shorts', 'kids', size)}
                                    >
                                      {'×'}
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {sizeInputError && (
                    <div className="form-inline-error">{sizeInputError}</div>
                  )}
                  <small className="form-help">
                    Add available sizes for jersey shirts and shorts for both adults and kids. Use quick add buttons for standard sizes or type custom sizes.
                  </small>
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

              {shouldShowShorts(formData.category) ? (
                <div className="form-group">
                  <label>Jersey Prices</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Full Set Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={jerseyPrices.fullSet}
                        onChange={(e) => setJerseyPrices(prev => ({ ...prev, fullSet: e.target.value }))}
                        required
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Shirt Only Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={jerseyPrices.shirtOnly}
                        onChange={(e) => setJerseyPrices(prev => ({ ...prev, shirtOnly: e.target.value }))}
                        required
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Shorts Only Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={jerseyPrices.shortsOnly}
                        onChange={(e) => setJerseyPrices(prev => ({ ...prev, shortsOnly: e.target.value }))}
                        required
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                  <small className="form-help">Enter prices for full set, shirt only, and shorts only options</small>
                </div>
              ) : (
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
              )}

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



