const express = require('express');
const { authenticateSupabaseToken, requireAdminOrOwner, requireOwner, requireBranchAccess } = require('../middleware/supabaseAuth');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateSupabaseToken);

// Get dashboard metrics (admin or owner)
router.get('/dashboard', requireAdminOrOwner, async (req, res) => {
  try {
    // Get basic metrics
    const metrics = {
      totalSales: 24810,
      totalCustomers: 105,
      totalOrders: 1500,
      // Add more metrics based on your business logic
    };

    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all branches (owner only)
router.get('/branches', requireOwner, async (req, res) => {
  try {
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Supabase error fetching branches:', error);
      return res.status(500).json({ error: 'Failed to fetch branches' });
    }
    
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get all admin users (owner only)
router.get('/users', requireOwner, async (req, res) => {
  try {
    // Use Supabase client to fetch users with cache busting
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (error) {
      console.error('Supabase error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch admin users' });
    }

    // Filter for admin and owner users
    const adminUsers = users.users.filter(user => {
      const role = user.user_metadata?.role;
      return role === 'admin' || role === 'owner';
    });
    
    console.log('👥 Total users found:', users.users.length);
    console.log('👑 Admin/Owner users found:', adminUsers.length);

    // Get branch information for each user
    const usersWithBranches = await Promise.all(
      adminUsers.map(async (user) => {
        let branchName = null;
        if (user.user_metadata?.branch_id) {
          try {
            const { data: branchData, error: branchError } = await supabase
              .from('branches')
              .select('name')
              .eq('id', user.user_metadata.branch_id)
              .single();
            
            if (!branchError && branchData) {
              branchName = branchData.name;
            }
          } catch (err) {
            console.error('Error fetching branch name:', err);
          }
        }

        return {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
          role: user.user_metadata?.role || 'customer',
          branch_id: user.user_metadata?.branch_id || null,
          contact_number: user.user_metadata?.contact_number || null,
          branch_name: branchName,
          created_at: user.created_at
        };
      })
    );

    console.log('📤 Sending admin users to frontend:', usersWithBranches.length);
    
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(usersWithBranches);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// Create new admin user (owner only)
router.post('/users', requireOwner, async (req, res) => {
  try {
    const { name, password, contact_number, branch_id } = req.body;
    
    // This would typically use Supabase Admin API to create user
    // For now, return a mock response
    res.json({ 
      message: 'Admin user created successfully',
      user: { name, contact_number, branch_id }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Delete admin user (owner only)
router.delete('/users/:id', requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Attempting to delete user with ID:', id);
    
    // Use Supabase Admin API to delete user
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    
    if (error) {
      console.error('❌ Supabase error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete admin user' });
    }
    
    console.log('✅ User deleted successfully from Supabase');
    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting admin user:', error);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

// Get all customer accounts (admin or owner)
router.get('/customers', requireAdminOrOwner, async (req, res) => {
  try {
    // Use Supabase client to fetch users with cache busting
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (error) {
      console.error('Supabase error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }

    // Filter for customer users
    const customerUsers = users.users.filter(user => {
      const role = user.user_metadata?.role;
      return role === 'customer';
    });
    
    console.log('👥 Total users found:', users.users.length);
    console.log('👤 Customer users found:', customerUsers.length);

    // Format customer data
    const customers = customerUsers.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      contact_number: user.user_metadata?.contact_number || null,
      address: user.user_metadata?.address || null,
      created_at: user.created_at
    }));

    console.log('📤 Sending customer users to frontend:', customers.length);
    
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Delete customer account (admin or owner)
router.delete('/customers/:id', requireAdminOrOwner, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Attempting to delete customer with ID:', id);
    
    // Use Supabase Admin API to delete user
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    
    console.log('🔍 Supabase delete response:', { data, error });
    
    if (error) {
      console.error('❌ Supabase error deleting customer:', error);
      return res.status(500).json({ error: 'Failed to delete customer account' });
    }
    
    console.log('✅ Customer deleted successfully from Supabase');
    
    // Verify the user is actually deleted
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing users after delete:', listError);
    } else {
      const userStillExists = users.users.find(u => u.id === id);
      console.log('🔍 User still exists after delete:', !!userStillExists);
      if (userStillExists) {
        console.log('❌ PROBLEM: User still exists after delete!');
      } else {
        console.log('✅ CONFIRMED: User successfully deleted');
      }
    }
    
    res.json({ message: 'Customer account deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer account' });
  }
});

// Get all artist accounts (admin or owner)
router.get('/artists', requireAdminOrOwner, async (req, res) => {
  try {
    // Use Supabase client to fetch users with cache busting
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (error) {
      console.error('Supabase error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch artists' });
    }

    // Filter for artist users
    const artistUsers = users.users.filter(user => {
      const role = user.user_metadata?.role;
      return role === 'artist';
    });
    
    console.log('👥 Total users found:', users.users.length);
    console.log('🎨 Artist users found:', artistUsers.length);

    // Get artist profile information for each user
    const artistsWithProfiles = await Promise.all(
      artistUsers.map(async (user) => {
        let artistProfile = null;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('artist_profiles')
            .select('artist_name, is_active, is_verified, total_tasks_completed, rating, commission_rate')
            .eq('user_id', user.id)
            .single();
          
          if (!profileError && profileData) {
            artistProfile = profileData;
          }
        } catch (err) {
          console.error('Error fetching artist profile:', err);
        }

        return {
          id: user.id,
          email: user.email,
          artist_name: user.user_metadata?.artist_name || artistProfile?.artist_name || 'N/A',
          full_name: user.user_metadata?.full_name || user.user_metadata?.artist_name || 'N/A',
          is_active: artistProfile?.is_active !== undefined ? artistProfile.is_active : true,
          is_verified: artistProfile?.is_verified || false,
          total_tasks_completed: artistProfile?.total_tasks_completed || 0,
          rating: artistProfile?.rating || 0,
          commission_rate: artistProfile?.commission_rate || 0,
          created_at: user.created_at
        };
      })
    );

    console.log('📤 Sending artist users to frontend:', artistsWithProfiles.length);
    
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(artistsWithProfiles);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

// Update artist information (owner only)
router.put('/artists/:id', requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { artist_name, email } = req.body;
    
    console.log('🔄 Updating artist with ID:', id);
    console.log('📝 New data:', { artist_name, email });
    
    // Validate required fields
    if (!artist_name || !email) {
      return res.status(400).json({ error: 'Artist name and email are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if email is already taken by another user
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error checking existing users:', listError);
      return res.status(500).json({ error: 'Failed to check existing users' });
    }
    
    const emailTaken = existingUsers.users.find(user => 
      user.email === email && user.id !== id
    );
    
    if (emailTaken) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }
    
    // Update user email in Supabase Auth
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      email: email
    });
    
    if (updateError) {
      console.error('Error updating user email:', updateError);
      return res.status(500).json({ error: 'Failed to update user email' });
    }
    
    // Update artist profile in database
    const { data: profileData, error: profileError } = await supabase
      .from('artist_profiles')
      .update({ artist_name: artist_name })
      .eq('user_id', id)
      .select()
      .single();
    
    if (profileError) {
      console.error('Error updating artist profile:', profileError);
      return res.status(500).json({ error: 'Failed to update artist profile' });
    }
    
    console.log('✅ Artist updated successfully');
    res.json({ 
      message: 'Artist information updated successfully',
      data: {
        id: id,
        artist_name: artist_name,
        email: email
      }
    });
    
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Failed to update artist information' });
  }
});

// Delete artist account (admin or owner)
router.delete('/artists/:id', requireAdminOrOwner, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Attempting to delete artist with ID:', id);
    
    // Use Supabase Admin API to delete user
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    
    console.log('🔍 Supabase delete response:', { data, error });
    
    if (error) {
      console.error('❌ Supabase error deleting artist:', error);
      return res.status(500).json({ error: 'Failed to delete artist account' });
    }
    
    console.log('✅ Artist deleted successfully from Supabase');
    
    res.json({ message: 'Artist account deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting artist:', error);
    res.status(500).json({ error: 'Failed to delete artist account' });
  }
});


// Get current user info
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
