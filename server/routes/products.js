const express = require('express');
const { query } = require('../lib/db');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT p.*, b.name as branch_name 
      FROM products p 
      LEFT JOIN branches b ON p.branch_id = b.id 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
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
router.post('/', async (req, res) => {
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
      branch_id 
    } = req.body;

    const { rows } = await query(`
      INSERT INTO products (
        name, category, size, price, description, 
        main_image, additional_images, stock_quantity, branch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      name, category, size, price, description,
      main_image, additional_images || [], stock_quantity || 0, branch_id
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
      branch_id 
    } = req.body;

    const { rows } = await query(`
      UPDATE products SET 
        name = $1, category = $2, size = $3, price = $4, 
        description = $5, main_image = $6, additional_images = $7, 
        stock_quantity = $8, branch_id = $9, updated_at = now()
      WHERE id = $10
      RETURNING *
    `, [
      name, category, size, price, description,
      main_image, additional_images || [], stock_quantity || 0, branch_id, id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
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
