const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateSupabaseToken, requireAdminOrOwner } = require('../middleware/supabaseAuth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        branches (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Transform the data to match the expected format
    const transformedData = data.map(product => ({
      ...product,
      branch_name: product.branches?.name || null
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get products by branch
router.get('/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { rows } = await query(`
      SELECT p.*, b.name as branch_name 
      FROM products p 
      LEFT JOIN branches b ON p.branch_id = b.id 
      WHERE p.branch_id = $1 
      ORDER BY p.created_at DESC
    `, [branchId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      SELECT p.*, b.name as branch_name 
      FROM products p 
      LEFT JOIN branches b ON p.branch_id = b.id 
      WHERE p.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product
router.post('/', authenticateSupabaseToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      size, 
      price, 
      description, 
      main_image, 
      additional_images, 
      stock_quantity, 
      sold_quantity,
      branch_id 
    } = req.body;

    const { rows } = await query(`
      INSERT INTO products (
        name, category, size, price, description, 
        main_image, additional_images, stock_quantity, sold_quantity, branch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name, category, size, price, description,
      main_image, additional_images || [], stock_quantity || 0, sold_quantity || 0, branch_id
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, 
      size, 
      price, 
      description, 
      main_image, 
      additional_images, 
      stock_quantity, 
      sold_quantity,
      branch_id 
    } = req.body;

    const soldQuantityValue = sold_quantity === '' || sold_quantity === null || sold_quantity === undefined ? 0 : parseInt(sold_quantity);
    
    // Update the product using Supabase
    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        category,
        size,
        price: parseFloat(price),
        description,
        main_image,
        additional_images: additional_images || [],
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
        sold_quantity: soldQuantityValue,
        branch_id: branch_id ? parseInt(branch_id) : 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        branches (
          name
        )
      `)
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      branch_name: data.branches?.name || null
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateSupabaseToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
