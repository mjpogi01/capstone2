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

// Test endpoint to debug user structure (temporary)
router.get('/users/debug', requireOwner, async (req, res) => {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Find an admin user
    const adminUser = users.users.find(u => {
      const role = u.user_metadata?.role || u.raw_user_meta_data?.role;
      return role === 'admin';
    });
    
    return res.json({
      total_users: users.users.length,
      sample_user_structure: users.users[0] ? {
        email: users.users[0].email,
        all_keys: Object.keys(users.users[0]),
        user_metadata: users.users[0].user_metadata,
        raw_user_meta_data: users.users[0].raw_user_meta_data,
        app_metadata: users.users[0].app_metadata
      } : null,
      admin_user_found: !!adminUser,
      admin_user_structure: adminUser ? {
        email: adminUser.email,
        all_keys: Object.keys(adminUser),
        user_metadata: adminUser.user_metadata,
        raw_user_meta_data: adminUser.raw_user_meta_data,
        app_metadata: adminUser.app_metadata
      } : null,
      all_users_roles: users.users.map(u => ({
        email: u.email,
        role: u.user_metadata?.role || u.raw_user_meta_data?.role || 'no-role',
        has_user_metadata: !!u.user_metadata,
        has_raw_metadata: !!u.raw_user_meta_data
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all admin users (owner only)
router.get('/users', requireOwner, async (req, res) => {
  try {
    // Fetch all users by paginating through all pages
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: usersData, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (error) {
        console.error(`Supabase error fetching users (page ${page}):`, error);
        break;
      }
      
      // Check the response structure - Supabase might return data directly or in a nested structure
      console.log(`🔍 Page ${page} response structure:`, {
        hasData: !!usersData,
        dataType: typeof usersData,
        isArray: Array.isArray(usersData),
        hasUsers: !!usersData?.users,
        usersIsArray: Array.isArray(usersData?.users),
        usersLength: usersData?.users?.length,
        directLength: Array.isArray(usersData) ? usersData.length : 'not array'
      });
      
      const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
      
      if (users && Array.isArray(users) && users.length > 0) {
        console.log(`📄 Fetched page ${page}: ${users.length} users`);
        allUsers = allUsers.concat(users);
        hasMore = users.length === perPage;
        page++;
      } else {
        console.log(`📄 Page ${page}: No more users (got ${users?.length || 0} users)`);
        hasMore = false;
      }
    }
    
    const users = { users: allUsers };
    
    if (allUsers.length === 0) {
      console.log('⚠️ No users found in database');
    } else {
      console.log(`✅ Fetched ${allUsers.length} total users from database`);
    }

    // Debug: Log the raw structure of the first user to understand the API response
    if (users.users && users.users.length > 0) {
      const firstUser = users.users[0];
      console.log('🔬 RAW FIRST USER OBJECT STRUCTURE:', JSON.stringify({
        email: firstUser.email,
        id: firstUser.id,
        has_user_metadata: !!firstUser.user_metadata,
        has_raw_user_meta_data: !!firstUser.raw_user_meta_data,
        user_metadata_value: firstUser.user_metadata,
        raw_user_meta_data_value: firstUser.raw_user_meta_data,
        all_properties: Object.keys(firstUser)
      }, null, 2));
    }

    // Debug: Log role distribution
    // Check both user_metadata and raw_user_meta_data
    const roleCounts = {};
    users.users.forEach(user => {
      // Try multiple ways to access the role
      const role = user.user_metadata?.role 
        || user.raw_user_meta_data?.role 
        || (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata.role : null)
        || 'no-role';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    console.log('🔍 Role distribution in database:', roleCounts);
    
    // Log a sample admin/owner user to see the structure
    const sampleAdmin = users.users.find(u => {
      const role = u.user_metadata?.role || u.raw_user_meta_data?.role;
      return role === 'admin' || role === 'owner';
    });
    if (sampleAdmin) {
      console.log('📊 Sample admin/owner user structure:', {
        email: sampleAdmin.email,
        id: sampleAdmin.id,
        user_metadata: sampleAdmin.user_metadata,
        raw_user_meta_data: sampleAdmin.raw_user_meta_data,
        all_keys: Object.keys(sampleAdmin),
        user_metadata_type: typeof sampleAdmin.user_metadata,
        raw_metadata_type: typeof sampleAdmin.raw_user_meta_data
      });
    }
    
    console.log('📊 Sample user metadata (first 3):', users.users.slice(0, 3).map(u => ({
      email: u.email,
      role: u.user_metadata?.role || u.raw_user_meta_data?.role,
      has_user_metadata: !!u.user_metadata,
      has_raw_metadata: !!u.raw_user_meta_data,
      user_metadata_keys: u.user_metadata ? Object.keys(u.user_metadata) : [],
      raw_metadata_keys: u.raw_user_meta_data ? Object.keys(u.raw_user_meta_data) : []
    })));
    
    // Filter for admin and owner users
    // Check both user_metadata and raw_user_meta_data (Supabase sometimes stores in different places)
    const adminUsers = users.users.filter(user => {
      // Try multiple ways to access the role
      const role = user.user_metadata?.role 
        || user.raw_user_meta_data?.role
        || (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata.role : null);
      const isAdminOrOwner = role === 'admin' || role === 'owner';
      if (!isAdminOrOwner && role) {
        console.log(`⚠️ User ${user.email} has role "${role}" (not admin/owner)`);
      }
      return isAdminOrOwner;
    });
    
    console.log('👥 Total users found:', users.users.length);
    console.log('👑 Admin/Owner users found:', adminUsers.length);

    // Get branch information for each user
    const usersWithBranches = await Promise.all(
      adminUsers.map(async (user) => {
        let branchName = null;
        const branchId = user.user_metadata?.branch_id || user.raw_user_meta_data?.branch_id;
        if (branchId) {
          try {
            const { data: branchData, error: branchError } = await supabase
              .from('branches')
              .select('name')
              .eq('id', branchId)
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
          name: `${user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || ''} ${user.user_metadata?.last_name || user.raw_user_meta_data?.last_name || ''}`.trim() || user.email,
          role: user.user_metadata?.role || user.raw_user_meta_data?.role || (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata.role : null) || 'customer',
          branch_id: user.user_metadata?.branch_id || user.raw_user_meta_data?.branch_id || null,
          contact_number: user.user_metadata?.contact_number || user.raw_user_meta_data?.contact_number || null,
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
    // Fetch all users by paginating through all pages
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: usersData, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (error) {
        console.error(`Supabase error fetching users (page ${page}):`, error);
        break;
      }
      
      // Check the response structure - Supabase might return data directly or in a nested structure
      console.log(`🔍 Page ${page} response structure:`, {
        hasData: !!usersData,
        dataType: typeof usersData,
        isArray: Array.isArray(usersData),
        hasUsers: !!usersData?.users,
        usersIsArray: Array.isArray(usersData?.users),
        usersLength: usersData?.users?.length,
        directLength: Array.isArray(usersData) ? usersData.length : 'not array'
      });
      
      const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
      
      if (users && Array.isArray(users) && users.length > 0) {
        console.log(`📄 Fetched page ${page}: ${users.length} users`);
        allUsers = allUsers.concat(users);
        hasMore = users.length === perPage;
        page++;
      } else {
        console.log(`📄 Page ${page}: No more users (got ${users?.length || 0} users)`);
        hasMore = false;
      }
    }
    
    const users = { users: allUsers };
    
    if (allUsers.length === 0) {
      console.log('⚠️ No users found in database');
    } else {
      console.log(`✅ Fetched ${allUsers.length} total users from database`);
    }

    // Debug: Log the raw structure of the first user to understand the API response
    if (users.users && users.users.length > 0) {
      const firstUser = users.users[0];
      console.log('🔬 RAW FIRST USER OBJECT STRUCTURE (artists):', JSON.stringify({
        email: firstUser.email,
        id: firstUser.id,
        has_user_metadata: !!firstUser.user_metadata,
        has_raw_user_meta_data: !!firstUser.raw_user_meta_data,
        user_metadata_value: firstUser.user_metadata,
        raw_user_meta_data_value: firstUser.raw_user_meta_data,
        all_properties: Object.keys(firstUser)
      }, null, 2));
    }

    // Debug: Log role distribution
    // Check both user_metadata and raw_user_meta_data
    const roleCounts = {};
    users.users.forEach(user => {
      const role = user.user_metadata?.role || user.raw_user_meta_data?.role || 'no-role';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    console.log('🔍 Role distribution in database (for artists):', roleCounts);
    console.log('📊 Sample user metadata (first 3):', users.users.slice(0, 3).map(u => ({
      email: u.email,
      role: u.user_metadata?.role || u.raw_user_meta_data?.role,
      has_user_metadata: !!u.user_metadata,
      has_raw_metadata: !!u.raw_user_meta_data,
      user_metadata_keys: u.user_metadata ? Object.keys(u.user_metadata) : [],
      raw_metadata_keys: u.raw_user_meta_data ? Object.keys(u.raw_user_meta_data) : []
    })));
    
    // Filter for artist users
    // Check both user_metadata and raw_user_meta_data (Supabase sometimes stores in different places)
    const artistUsers = users.users.filter(user => {
      // Try multiple ways to access the role
      const role = user.user_metadata?.role 
        || user.raw_user_meta_data?.role
        || (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata.role : null);
      const isArtist = role === 'artist';
      if (!isArtist && role) {
        console.log(`⚠️ User ${user.email} has role "${role}" (not artist)`);
      }
      return isArtist;
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
          artist_name: user.user_metadata?.artist_name || user.raw_user_meta_data?.artist_name || artistProfile?.artist_name || 'N/A',
          full_name: user.user_metadata?.full_name || user.raw_user_meta_data?.full_name || user.user_metadata?.artist_name || user.raw_user_meta_data?.artist_name || 'N/A',
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
