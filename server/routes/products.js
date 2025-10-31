const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateSupabaseToken, requireAdminOrOwner } = require('../middleware/supabaseAuth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parseAvailableSizes = (sizeValue) => {
  if (!sizeValue || typeof sizeValue !== 'string') {
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
    console.warn('Failed to parse available sizes:', error.message);
  }

  return [];
};

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
      branch_name: product.branches?.name || null,
      available_sizes: parseAvailableSizes(product.size)
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
      available_sizes,
      price, 
      description, 
      main_image, 
      additional_images, 
      stock_quantity, 
      sold_quantity,
      branch_id 
    } = req.body;

    console.log('📦 [Products API] Creating product with data:', {
      name,
      category,
      available_sizes,
      available_sizes_type: typeof available_sizes,
      available_sizes_length: available_sizes?.length
    });

    const insertData = {
      name,
      category,
      size,
      price: parseFloat(price),
      description,
      main_image,
      additional_images: additional_images || [],
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      sold_quantity: sold_quantity ? parseInt(sold_quantity) : 0,
      branch_id: branch_id ? parseInt(branch_id) : 1
    };

    // Only add available_sizes if it exists (column might not exist in database yet)
    if (available_sizes !== null && available_sizes !== undefined) {
      insertData.available_sizes = available_sizes;
    }

    console.log('📦 [Products API] Final insert data:', insertData);

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select(`
        *,
        branches (
          name
        )
      `)
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // If error is about missing column, suggest adding it
      if (error.message && error.message.includes('available_sizes')) {
        return res.status(500).json({ 
          error: error.message,
          hint: 'The available_sizes column might not exist in your Supabase database. Please add it using: ALTER TABLE products ADD COLUMN available_sizes TEXT;'
        });
      }
      
      return res.status(500).json({ error: error.message });
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      branch_name: data.branches?.name || null,
      available_sizes: parseAvailableSizes(data.size)
    };

    res.status(201).json(transformedData);
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
      available_sizes,
      price, 
      description, 
      main_image, 
      additional_images, 
      stock_quantity, 
      sold_quantity,
      branch_id 
    } = req.body;

    const soldQuantityValue = sold_quantity === '' || sold_quantity === null || sold_quantity === undefined ? 0 : parseInt(sold_quantity);
    
    console.log('📦 [Products API] Updating product:', {
      id,
      available_sizes,
      available_sizes_type: typeof available_sizes,
      available_sizes_length: available_sizes?.length
    });
    
    const updateData = {
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
    };

    // Only add available_sizes if it exists (column might not exist in database yet)
    if (available_sizes !== null && available_sizes !== undefined) {
      updateData.available_sizes = available_sizes;
    }

    console.log('📦 [Products API] Final update data:', updateData);
    
    // Update the product using Supabase
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        branches (
          name
        )
      `)
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // If error is about missing column, suggest adding it
      if (error.message && error.message.includes('available_sizes')) {
        return res.status(500).json({ 
          error: error.message,
          hint: 'The available_sizes column might not exist in your Supabase database. Please add it using: ALTER TABLE products ADD COLUMN available_sizes TEXT;'
        });
      }
      
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Transform the data to match the expected format
    const transformedData = {
      ...data,
      branch_name: data.branches?.name || null,
      available_sizes: parseAvailableSizes(data.size)
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
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
