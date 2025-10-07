const API_BASE_URL = 'http://localhost:4000/api';

class ProductService {
  async getAllProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getProductsByBranch(branchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/branch/${branchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products by branch');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products by branch:', error);
      throw error;
    }
  }

  async getProductsByCategory(category) {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }
}

export default new ProductService();
