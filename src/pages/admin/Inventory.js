import React, { useState, useEffect } from 'react';
import './Inventory.css';
import Sidebar from '../../components/admin/Sidebar';
import AddProductModal from '../../components/admin/AddProductModal';
import { supabase } from '../../lib/supabase';

const Inventory = () => {
  const [activePage, setActivePage] = useState('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const handleAddProduct = (newProduct) => {
    setProducts([newProduct, ...products]);
    setShowAddModal(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
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
    <div className="inventory-page">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
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

                  <table key={refreshKey} className="inventory-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Sold</th>
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
                              <div className="no-image">No Image</div>
                            )}
                          </div>
                        </td>
                        <td className="product-name-cell">
                          <div className="product-name">{product.name}</div>
                        </td>
                        <td className="product-price-cell">
                          <div className="product-price">₱{product.price}</div>
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
                            >
                              <span>✏️</span>
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete Product"
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                  </tbody>
                </table>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Product Button */}
      <button 
        className="floating-add-btn"
        onClick={() => setShowAddModal(true)}
      >
        <span>+</span>
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
