const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateSupabaseToken } = require('../middleware/supabaseAuth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Get user's default address
router.get('/address', authenticateSupabaseToken, async (req, res) => {
  try {
    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error fetching address:', error);
      return res.status(500).json({ error: 'Failed to fetch address' });
    }

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ error: 'No address found' });
    }

    res.json(addresses[0]);
  } catch (error) {
    console.error('Error fetching user address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

// Get all user addresses
router.get('/addresses', authenticateSupabaseToken, async (req, res) => {
  try {
    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching addresses:', error);
      return res.status(500).json({ error: 'Failed to fetch addresses' });
    }

    res.json(addresses || []);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Save user's address
router.post('/address', authenticateSupabaseToken, async (req, res) => {
  try {
    const { fullName, phone, streetAddress, barangay, barangay_code, city, province, postalCode, address, isDefault = true } = req.body;

    // Check if user already has an address
    const { data: existingAddresses, error: checkError } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('user_id', req.user.id);

    if (checkError) {
      console.error('Supabase error checking existing addresses:', checkError);
      return res.status(500).json({ error: 'Failed to check existing addresses' });
    }

    let result;
    if (existingAddresses && existingAddresses.length > 0) {
      // Update existing address
      const { data, error } = await supabase
        .from('user_addresses')
        .update({
          full_name: fullName,
          phone: phone,
          street_address: streetAddress,
          barangay: barangay,
          barangay_code: barangay_code || null, // Include barangay code for coordinate lookup
          city: city,
          province: province,
          postal_code: postalCode,
          address: address,
          is_default: isDefault,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating address:', error);
        return res.status(500).json({ error: 'Failed to update address' });
      }

      result = data;
    } else {
      // Create new address
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: req.user.id,
          full_name: fullName,
          phone: phone,
          street_address: streetAddress,
          barangay: barangay,
          barangay_code: barangay_code || null, // Include barangay code for coordinate lookup
          city: city,
          province: province,
          postal_code: postalCode,
          address: address,
          is_default: isDefault
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating address:', error);
        return res.status(500).json({ error: 'Failed to create address' });
      }

      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving user address:', error);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

// Update specific address by ID
router.put('/address/:id', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, streetAddress, barangay, barangay_code, city, province, postalCode, address, isDefault } = req.body;

    const { data, error } = await supabase
      .from('user_addresses')
      .update({
        full_name: fullName,
        phone: phone,
        street_address: streetAddress,
        barangay: barangay,
        barangay_code: barangay_code || null, // Include barangay code for coordinate lookup
        city: city,
        province: province,
        postal_code: postalCode,
        address: address,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating address:', error);
      return res.status(500).json({ error: 'Failed to update address' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating user address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address by ID
router.delete('/address/:id', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error deleting address:', error);
      return res.status(500).json({ error: 'Failed to delete address' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting user address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Set default address
router.patch('/address/:id/default', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First, unset all default addresses for this user
    const { error: unsetError } = await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', req.user.id);

    if (unsetError) {
      console.error('Supabase error unsetting default addresses:', unsetError);
      return res.status(500).json({ error: 'Failed to unset default addresses' });
    }

    // Then set the selected address as default
    const { data, error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error setting default address:', error);
      return res.status(500).json({ error: 'Failed to set default address' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

module.exports = router;
