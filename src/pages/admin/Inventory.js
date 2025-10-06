import React, { useState, useEffect } from 'react';
import './Inventory.css';
import Sidebar from '../../components/admin/Sidebar';
import AddProductModal from '../../components/admin/AddProductModal';

const Inventory = () => {
  const [activePage, setActivePage] = useState('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleAddProduct = (newProduct) => {
    setProducts([newProduct, ...products]);
    setShowAddModal(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`http://localhost:4000/api/products/${productId}`, {
          method: 'DELETE'
        });
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
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
            <div className="products-grid">
              {products.length === 0 ? (
                <div className="no-products">
                  <h3>No products found</h3>
                  <p>Click the "Add Product" button to get started</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      {product.main_image ? (
                        <img src={product.main_image} alt={product.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-category">{product.category}</p>
                      <p className="product-price">₱{product.price}</p>
                      <p className="product-stock">Stock: {product.stock_quantity}</p>
                      {product.branch_name && (
                        <p className="product-branch">{product.branch_name}</p>
                      )}
                    </div>
                    <div className="product-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => {/* TODO: Implement edit */}}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
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

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
        />
      )}
    </div>
  );
};

export default Inventory;
