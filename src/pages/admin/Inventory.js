import React, { useState, useEffect } from 'react';
import './Inventory.css';
import './admin-shared.css';
import Sidebar from '../../components/admin/Sidebar';
import AddProductModal from '../../components/admin/AddProductModal';
import { supabase } from '../../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faImage, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const Inventory = () => {
  const [activePage, setActivePage] = useState('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedSizes, setExpandedSizes] = useState({});
  const [filters, setFilters] = useState({
    branch: 'all',
    category: 'all',
    stockSort: 'none',
    priceSort: 'none',
    soldSort: 'none'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filter by branch
    if (filters.branch !== 'all') {
      filtered = filtered.filter(product => product.branch_id === parseInt(filters.branch));
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Sort by stock
    if (filters.stockSort !== 'none') {
      filtered.sort((a, b) => {
        const aStock = a.stock_quantity || 0;
        const bStock = b.stock_quantity || 0;
        return filters.stockSort === 'asc' ? aStock - bStock : bStock - aStock;
      });
    }

    // Sort by price
    if (filters.priceSort !== 'none') {
      filtered.sort((a, b) => {
        const aPrice = parseFloat(a.price) || 0;
        const bPrice = parseFloat(b.price) || 0;
        return filters.priceSort === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    }

    // Sort by sold (assuming we'll add a sold field to products)
    if (filters.soldSort !== 'none') {
      filtered.sort((a, b) => {
        const aSold = a.sold_quantity || 0;
        const bSold = b.sold_quantity || 0;
        return filters.soldSort === 'asc' ? aSold - bSold : bSold - aSold;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getUniqueBranches = () => {
    const branches = [...new Set(products.map(p => p.branch_id).filter(Boolean))];
    return branches.map(id => {
      const product = products.find(p => p.branch_id === id);
      return { id, name: product?.branch_name || `Branch ${id}` };
    });
  };

  const getUniqueCategories = () => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  };

  const normalizeProductSurcharges = (product) => {
    if (!product) return product;

    let sizeSurcharges = product.size_surcharges;
    if (typeof sizeSurcharges === 'string') {
      try {
        sizeSurcharges = JSON.parse(sizeSurcharges);
      } catch (error) {
        console.warn('Failed to parse size_surcharges in Inventory:', error?.message);
        sizeSurcharges = null;
      }
    }

    let fabricSurcharges = product.fabric_surcharges;
    if (typeof fabricSurcharges === 'string') {
      try {
        fabricSurcharges = JSON.parse(fabricSurcharges);
      } catch (error) {
        console.warn('Failed to parse fabric_surcharges in Inventory:', error?.message);
        fabricSurcharges = null;
      }
    }

    return {
      ...product,
      size_surcharges: sizeSurcharges,
      fabric_surcharges: fabricSurcharges
    };
  };

  const handleAddProduct = (newProduct) => {
    const normalizedProduct = normalizeProductSurcharges(newProduct);
    setProducts([normalizedProduct, ...products]);
    setShowAddModal(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleUpdateProduct = (updatedProduct) => {
    const normalizedProduct = normalizeProductSurcharges(updatedProduct);
    const updatedProducts = products.map(p => p.id === normalizedProduct.id ? normalizedProduct : p);
    setProducts(updatedProducts);
    setRefreshKey(prev => prev + 1); // Force re-render
    setShowAddModal(false);
    setEditingProduct(null);
    // The useEffect will automatically apply filters and update filteredProducts
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const toggleSizesDropdown = (productId) => {
    setExpandedSizes(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getProductSizes = (product) => {
    let sizes = [];
    let jerseySizes = null;
    let hasSizes = false;

    if (product.size) {
      try {
        if (typeof product.size === 'string' && product.size.startsWith('{')) {
          const parsed = JSON.parse(product.size);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            jerseySizes = parsed;
            hasSizes = !!(
              parsed.shirts?.adults?.length ||
              parsed.shirts?.kids?.length ||
              parsed.shorts?.adults?.length ||
              parsed.shorts?.kids?.length
            );
          }
        } else if (typeof product.size === 'string' && product.size.startsWith('[')) {
          const parsed = JSON.parse(product.size);
          if (Array.isArray(parsed)) {
            sizes = parsed;
            hasSizes = sizes.length > 0;
          }
        } else if (Array.isArray(product.size)) {
          sizes = product.size;
          hasSizes = sizes.length > 0;
        } else {
          sizes = [product.size];
          hasSizes = true;
        }
      } catch (e) {
        sizes = [product.size];
        hasSizes = true;
      }
    }

    if (!hasSizes && product.available_sizes) {
      if (Array.isArray(product.available_sizes)) {
        sizes = product.available_sizes;
        hasSizes = sizes.length > 0;
      } else if (typeof product.available_sizes === 'string') {
        sizes = product.available_sizes
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        hasSizes = sizes.length > 0;
      }
    }

    return { sizes, jerseySizes, hasSizes };
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Get current session for authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          alert('Please log in to delete products');
          return;
        }

        const response = await fetch(`http://localhost:4000/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setProducts(products.filter(p => p.id !== productId));
          console.log('Product deleted successfully');
        } else {
          const errorData = await response.json();
          console.error('Delete failed:', errorData.error);
          alert(`Failed to delete product: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
      <div className="admin-main-content">
        <div className="inventory-main-content">
          <div className="inventory-header">
            <h1>Inventory Management</h1>
            <p>Manage your product inventory</p>
          </div>

          <div className="inventory-content">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="inventory-table-container">
              {products.length === 0 ? (
                <div className="no-products">
                  <h3>No products found</h3>
                  <p>Click the "Add Product" button to get started</p>
                </div>
              ) : (
                <>
                  {/* Filter Controls */}
                  <div className="filter-controls">
                    <div className="filter-group">
                      <label>Branch:</label>
                      <select 
                        value={filters.branch} 
                        onChange={(e) => handleFilterChange('branch', e.target.value)}
                      >
                        <option value="all">All Branches</option>
                        {getUniqueBranches().map(branch => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Category:</label>
                      <select 
                        value={filters.category} 
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {getUniqueCategories().map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Stock:</label>
                      <select 
                        value={filters.stockSort} 
                        onChange={(e) => handleFilterChange('stockSort', e.target.value)}
                      >
                        <option value="none">No Sort</option>
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Price:</label>
                      <select 
                        value={filters.priceSort} 
                        onChange={(e) => handleFilterChange('priceSort', e.target.value)}
                      >
                        <option value="none">No Sort</option>
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Sold:</label>
                      <select 
                        value={filters.soldSort} 
                        onChange={(e) => handleFilterChange('soldSort', e.target.value)}
                      >
                        <option value="none">No Sort</option>
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="desktop-table">
                    <table key={refreshKey} className="inventory-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Product Name</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Sold</th>
                          <th>Available Sizes</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                        <tr key={`${product.id}-${product.updated_at || Date.now()}`} className="product-row">
                          <td className="product-image-cell">
                            <div className="product-image">
                              {product.main_image ? (
                                <img src={product.main_image} alt={product.name} />
                              ) : (
                                <div className="no-image">
                                  <FontAwesomeIcon icon={faImage} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="inventory-product-name-cell">
                            <div className="inventory-product-name">{product.name}</div>
                          </td>
                          <td className="inventory-product-price-cell">
                            <div className="inventory-product-price">₱{product.price}</div>
                          </td>
                          <td className="product-stock-cell">
                            <div className={`stock-badge ${product.stock_quantity > 10 ? 'in-stock' : product.stock_quantity > 0 ? 'low-stock' : 'out-of-stock'}`}>
                              {product.stock_quantity}
                            </div>
                          </td>
                          <td className="product-sold-cell">
                            <div className="sold-badge">
                              {product.sold_quantity || 0}
                            </div>
                          </td>
                          <td className="product-available-sizes-cell">
                            <div className="product-available-sizes">
                              {(() => {
                                const { sizes, jerseySizes, hasSizes } = getProductSizes(product);

                                if (!hasSizes) {
                                  return <span className="no-sizes">No sizes</span>;
                                }

                                const isExpanded = expandedSizes[product.id];

                                return (
                                  <div className="sizes-dropdown-container">
                                    <button
                                      className="sizes-dropdown-toggle"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSizesDropdown(product.id);
                                      }}
                                      type="button"
                                    >
                                      <span className="sizes-preview">
                                        {jerseySizes ? 'View Sizes' : `${sizes.length} size${sizes.length > 1 ? 's' : ''}`}
                                      </span>
                                      <FontAwesomeIcon
                                        icon={isExpanded ? faChevronUp : faChevronDown}
                                        className="sizes-chevron"
                                      />
                                    </button>
                                    {isExpanded && (
                                      <div className="sizes-dropdown-content">
                                        {jerseySizes ? (
                                          <div className="jersey-sizes-dropdown">
                                            {jerseySizes.shirts?.adults?.length > 0 && (
                                              <div className="size-group-item">
                                                <strong>Shirts - Adults:</strong> {jerseySizes.shirts.adults.join(', ')}
                                              </div>
                                            )}
                                            {jerseySizes.shirts?.kids?.length > 0 && (
                                              <div className="size-group-item">
                                                <strong>Shirts - Kids:</strong> {jerseySizes.shirts.kids.join(', ')}
                                              </div>
                                            )}
                                            {jerseySizes.shorts?.adults?.length > 0 && (
                                              <div className="size-group-item">
                                                <strong>Shorts - Adults:</strong> {jerseySizes.shorts.adults.join(', ')}
                                              </div>
                                            )}
                                            {jerseySizes.shorts?.kids?.length > 0 && (
                                              <div className="size-group-item">
                                                <strong>Shorts - Kids:</strong> {jerseySizes.shorts.kids.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="sizes-list">
                                            {sizes.map((size, index) => (
                                              <span key={index} className="size-item">{size}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="product-category-cell">
                            <div className="product-category">{product.category}</div>
                          </td>
                          <td className="product-description-cell">
                            <div className="product-description">
                              {product.description ? (
                                product.description.length > 50 
                                  ? `${product.description.substring(0, 50)}...` 
                                  : product.description
                              ) : (
                                <span className="no-description">No description</span>
                              )}
                            </div>
                          </td>
                          <td className="product-actions-cell">
                            <div className="product-actions">
                              <button 
                                className="edit-btn"
                                onClick={() => handleEditProduct(product)}
                                title="Edit Product"
                                aria-label="Edit Product"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="delete-btn"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Delete Product"
                                aria-label="Delete Product"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="mobile-cards">
                    {filteredProducts.map((product) => (
                      <div key={`mobile-${product.id}-${product.updated_at || Date.now()}`} className="product-card">
                        <div className="inventory-card-header">
                          <div className="product-image">
                            {product.main_image ? (
                              <img src={product.main_image} alt={product.name} />
                            ) : (
                              <div className="no-image">
                                <FontAwesomeIcon icon={faImage} />
                              </div>
                            )}
                          </div>
                          <div className="product-info">
                            <h3 className="inventory-product-name">{product.name}</h3>
                            <div className="product-category">{product.category}</div>
                          </div>
                          <div className="inventory-product-price">₱{product.price}</div>
                        </div>
                        
                        <div className="card-body">
                          <div className="product-description">
                            {product.description ? (
                              product.description.length > 100 
                                ? `${product.description.substring(0, 100)}...` 
                                : product.description
                            ) : (
                              <span className="no-description">No description</span>
                            )}
                          </div>
                          
                          <div className="card-stats">
                            <div className="stat-item">
                              <span className="stat-label">Stock</span>
                              <div className={`stock-badge ${product.stock_quantity > 10 ? 'in-stock' : product.stock_quantity > 0 ? 'low-stock' : 'out-of-stock'}`}>
                                {product.stock_quantity}
                              </div>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Sold</span>
                              <div className="sold-badge">
                                {product.sold_quantity || 0}
                              </div>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Available Sizes</span>
                              <div className="product-available-sizes">
                                {(() => {
                                  const { sizes, jerseySizes, hasSizes } = getProductSizes(product);

                                  if (!hasSizes) {
                                    return <span className="no-sizes">No sizes</span>;
                                  }

                                  const dropdownKey = `${product.id}-mobile`;
                                  const isExpanded = expandedSizes[dropdownKey];
                                  
                                  return (
                                    <div className="sizes-dropdown-container">
                                      <button 
                                        className="sizes-dropdown-toggle"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSizesDropdown(dropdownKey);
                                        }}
                                        type="button"
                                      >
                                        <span className="sizes-preview">
                                          {jerseySizes ? 'View Sizes' : `${sizes.length} size${sizes.length > 1 ? 's' : ''}`}
                                        </span>
                                        <FontAwesomeIcon 
                                          icon={isExpanded ? faChevronUp : faChevronDown} 
                                          className="sizes-chevron"
                                        />
                                      </button>
                                      {isExpanded && (
                                        <div className="sizes-dropdown-content">
                                          {jerseySizes ? (
                                            <div className="jersey-sizes-dropdown">
                                              {jerseySizes.shirts?.adults?.length > 0 && (
                                                <div className="size-group-item">
                                                  <strong>Shirts - Adults:</strong> {jerseySizes.shirts.adults.join(', ')}
                                                </div>
                                              )}
                                              {jerseySizes.shirts?.kids?.length > 0 && (
                                                <div className="size-group-item">
                                                  <strong>Shirts - Kids:</strong> {jerseySizes.shirts.kids.join(', ')}
                                                </div>
                                              )}
                                              {jerseySizes.shorts?.adults?.length > 0 && (
                                                <div className="size-group-item">
                                                  <strong>Shorts - Adults:</strong> {jerseySizes.shorts.adults.join(', ')}
                                                </div>
                                              )}
                                              {jerseySizes.shorts?.kids?.length > 0 && (
                                                <div className="size-group-item">
                                                  <strong>Shorts - Kids:</strong> {jerseySizes.shorts.kids.join(', ')}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="sizes-list">
                                              {sizes.map((size, index) => (
                                                <span key={index} className="size-item">{size}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditProduct(product)}
                            title="Edit Product"
                            aria-label="Edit Product"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Edit</span>
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Delete Product"
                            aria-label="Delete Product"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Floating Add Product Button */}
      <button 
        className="floating-add-btn"
        onClick={() => setShowAddModal(true)}
      >
        <FontAwesomeIcon icon={faPlus} />
        Add Product
      </button>

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={handleCloseModal}
          onAdd={editingProduct ? handleUpdateProduct : handleAddProduct}
          editingProduct={editingProduct}
          isEditMode={!!editingProduct}
        />
      )}
    </div>
  );
};

export default Inventory;
