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
  
  // Check if it's a jersey size object (starts with {)
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Return a flattened list of all jersey sizes
        const allSizes = [];
        if (parsed.shirts) {
          if (Array.isArray(parsed.shirts.adults)) allSizes.push(...parsed.shirts.adults);
          if (Array.isArray(parsed.shirts.kids)) allSizes.push(...parsed.shirts.kids);
        }
        if (parsed.shorts) {
          if (Array.isArray(parsed.shorts.adults)) allSizes.push(...parsed.shorts.adults);
          if (Array.isArray(parsed.shorts.kids)) allSizes.push(...parsed.shorts.kids);
        }
        return allSizes.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
      }
    } catch (error) {
      console.warn('Failed to parse jersey sizes:', error.message);
    }
  }
  
  // Check if it's an array (trophy sizes)
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
      size
    });

    // Handle price - parse as float
    const priceValue = parseFloat(price);

    // Handle jersey_prices - ensure it's properly formatted as JSONB
    let jerseyPricesValue = null;
    if (req.body.jersey_prices) {
      // If it's already an object, use it directly; if it's a string, parse it
      if (typeof req.body.jersey_prices === 'string') {
        try {
          jerseyPricesValue = JSON.parse(req.body.jersey_prices);
        } catch (e) {
          console.error('❌ [Products API] Error parsing jersey_prices string:', e);
          jerseyPricesValue = req.body.jersey_prices;
        }
      } else {
        jerseyPricesValue = req.body.jersey_prices;
      }
      console.log('📦 [Products API] Received jersey_prices:', jerseyPricesValue);
      console.log('📦 [Products API] Type of jersey_prices:', typeof jerseyPricesValue);
      console.log('📦 [Products API] jersey_prices content:', JSON.stringify(jerseyPricesValue, null, 2));
    }

    // Handle trophy_prices - ensure it's properly formatted as JSONB
    let trophyPricesValue = null;
    if (req.body.trophy_prices) {
      // If it's already an object, use it directly; if it's a string, parse it
      if (typeof req.body.trophy_prices === 'string') {
        try {
          trophyPricesValue = JSON.parse(req.body.trophy_prices);
        } catch (e) {
          console.error('❌ [Products API] Error parsing trophy_prices string:', e);
          trophyPricesValue = req.body.trophy_prices;
        }
      } else {
        trophyPricesValue = req.body.trophy_prices;
      }
      console.log('🏆 [Products API] Received trophy_prices:', trophyPricesValue);
      console.log('🏆 [Products API] Type of trophy_prices:', typeof trophyPricesValue);
      console.log('🏆 [Products API] trophy_prices content:', JSON.stringify(trophyPricesValue, null, 2));
    }

    // Build insert data object
    const insertData = {
      name,
      category,
      size,
      price: priceValue,
      description,
      main_image,
      additional_images: additional_images || [],
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      sold_quantity: sold_quantity ? parseInt(sold_quantity) : 0,
      branch_id: branch_id ? parseInt(branch_id) : 1
    };
    
    // Only add jersey_prices if it's not null (Supabase handles null differently)
    if (jerseyPricesValue !== null && jerseyPricesValue !== undefined) {
      insertData.jersey_prices = jerseyPricesValue;
    }
    
    // Only add trophy_prices if it's not null
    if (trophyPricesValue !== null && trophyPricesValue !== undefined) {
      insertData.trophy_prices = trophyPricesValue;
    }

    console.log('📦 [Products API] Final insert data:', insertData);
    console.log('📦 [Products API] jersey_prices in insertData:', insertData.jersey_prices);

    console.log('📦 [Products API] About to insert into Supabase with data:', JSON.stringify(insertData, null, 2));
    
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
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Insert data that failed:', JSON.stringify(insertData, null, 2));
      return res.status(500).json({ error: error.message });
    }
    
    console.log('✅ [Products API] Product inserted successfully');
    console.log('✅ [Products API] Inserted product jersey_prices:', data?.jersey_prices);

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
      size
    });
    
    // Handle price - parse as float
    const priceValue = parseFloat(price);

    // Handle jersey_prices - ensure it's properly formatted as JSONB
    let jerseyPricesValue = null;
    if (req.body.jersey_prices) {
      // If it's already an object, use it directly; if it's a string, parse it
      if (typeof req.body.jersey_prices === 'string') {
        try {
          jerseyPricesValue = JSON.parse(req.body.jersey_prices);
        } catch (e) {
          console.error('❌ [Products API] Error parsing jersey_prices string:', e);
          jerseyPricesValue = req.body.jersey_prices;
        }
      } else {
        jerseyPricesValue = req.body.jersey_prices;
      }
      console.log('📦 [Products API] Received jersey_prices for update:', jerseyPricesValue);
      console.log('📦 [Products API] Type of jersey_prices:', typeof jerseyPricesValue);
      console.log('📦 [Products API] jersey_prices content:', JSON.stringify(jerseyPricesValue, null, 2));
    }

    // Handle trophy_prices - ensure it's properly formatted as JSONB
    let trophyPricesValue = null;
    if (req.body.trophy_prices) {
      // If it's already an object, use it directly; if it's a string, parse it
      if (typeof req.body.trophy_prices === 'string') {
        try {
          trophyPricesValue = JSON.parse(req.body.trophy_prices);
        } catch (e) {
          console.error('❌ [Products API] Error parsing trophy_prices string:', e);
          trophyPricesValue = req.body.trophy_prices;
        }
      } else {
        trophyPricesValue = req.body.trophy_prices;
      }
      console.log('🏆 [Products API] Received trophy_prices for update:', trophyPricesValue);
      console.log('🏆 [Products API] Type of trophy_prices:', typeof trophyPricesValue);
      console.log('🏆 [Products API] trophy_prices content:', JSON.stringify(trophyPricesValue, null, 2));
    }

    // Build update data object
    const updateData = {
      name,
      category,
      size,
      price: priceValue,
      description,
      main_image,
      additional_images: additional_images || [],
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      sold_quantity: soldQuantityValue,
      branch_id: branch_id ? parseInt(branch_id) : 1,
      updated_at: new Date().toISOString()
    };
    
    // Only add jersey_prices if it's not null (Supabase handles null differently)
    // For updates, we need to explicitly set it even if null to clear it, or omit it to keep existing value
    if (jerseyPricesValue !== null && jerseyPricesValue !== undefined) {
      updateData.jersey_prices = jerseyPricesValue;
    } else if (req.body.hasOwnProperty('jersey_prices') && req.body.jersey_prices === null) {
      // Explicitly set to null if the request wants to clear it
      updateData.jersey_prices = null;
    }
    
    // Only add trophy_prices if it's not null
    if (trophyPricesValue !== null && trophyPricesValue !== undefined) {
      updateData.trophy_prices = trophyPricesValue;
    } else if (req.body.hasOwnProperty('trophy_prices') && req.body.trophy_prices === null) {
      // Explicitly set to null if the request wants to clear it
      updateData.trophy_prices = null;
    }

    console.log('📦 [Products API] Final update data:', updateData);
    console.log('📦 [Products API] jersey_prices in updateData:', updateData.jersey_prices);
    
    console.log('📦 [Products API] About to update in Supabase with data:', JSON.stringify(updateData, null, 2));
    
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
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Update data that failed:', JSON.stringify(updateData, null, 2));
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
