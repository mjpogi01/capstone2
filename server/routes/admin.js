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
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 50; // Default 50 per page
    const searchTerm = req.query.search || '';
    
    // Fetch all users to get accurate total count
    // We need to fetch all pages to get accurate count, but we'll optimize by:
    // 1. Fetching in batches
    // 2. Only processing what we need for display
    let allUsers = [];
    let currentPage = 1;
    const fetchPerPage = 1000;
    let hasMore = true;
    
    // Fetch all users (needed for accurate total count)
    while (hasMore) {
      const { data: usersData, error } = await supabase.auth.admin.listUsers({
        page: currentPage,
        perPage: fetchPerPage
      });
      
      if (error) {
        console.error(`Supabase error fetching users (page ${currentPage}):`, error);
        break;
      }
      
      const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
      
      if (users && Array.isArray(users) && users.length > 0) {
        allUsers = allUsers.concat(users);
        hasMore = users.length === fetchPerPage;
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    // Filter for customer users
    const customerUsers = allUsers.filter(user => {
      const role = user.user_metadata?.role;
      return role === 'customer';
    });
    
    console.log(`👥 Fetched ${allUsers.length} total users, found ${customerUsers.length} customers`);
    
    // Apply search filter if provided
    let filteredCustomers = customerUsers;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredCustomers = customerUsers.filter(user => {
        const email = user.email?.toLowerCase() || '';
        const firstName = user.user_metadata?.first_name?.toLowerCase() || '';
        const lastName = user.user_metadata?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
        return email.includes(searchLower) || fullName.includes(searchLower);
      });
    }
    
    // Get accurate total count from filtered customers
    const totalCustomers = filteredCustomers.length;

    // Get user IDs for batch profile lookup (only for customers we're displaying)
    // Note: We use filteredCustomers (before pagination) to get addresses for all customers on current page
    const userIds = filteredCustomers.map(user => user.id);
    console.log(`👥 Processing ${userIds.length} customers for address lookup`);
    
    // Fetch user profiles from user_profiles table (only for customers on current page)
    let userProfilesMap = {};
    if (userIds.length > 0) {
      // Supabase has a limit on IN clause, so batch if needed
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, phone, address')
          .in('user_id', batch);
        
        if (!profilesError && profiles) {
          profiles.forEach(profile => {
            userProfilesMap[profile.user_id] = profile;
          });
        } else if (profilesError) {
          console.warn(`⚠️ Error fetching user profiles batch ${Math.floor(i / batchSize) + 1}:`, profilesError.message);
        }
      }
      console.log(`✅ Fetched ${Object.keys(userProfilesMap).length} user profiles`);
    }
    
    // Fetch user addresses from user_addresses table (prefer default, fallback to any address)
    let userAddressesMap = {};
    if (userIds.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        // First try to get default addresses
        const { data: defaultAddresses, error: defaultError } = await supabase
          .from('user_addresses')
          .select('user_id, address, is_default')
          .in('user_id', batch)
          .eq('is_default', true);
        
        if (!defaultError && defaultAddresses) {
          defaultAddresses.forEach(addr => {
            if (addr.address && addr.address.trim() !== '') {
              userAddressesMap[addr.user_id] = addr;
            }
          });
        }
        
        // For users without default addresses, get any address
        const usersWithoutDefault = batch.filter(id => !userAddressesMap[id]);
        if (usersWithoutDefault.length > 0) {
          const { data: anyAddresses, error: anyError } = await supabase
            .from('user_addresses')
            .select('user_id, address, is_default')
            .in('user_id', usersWithoutDefault)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(usersWithoutDefault.length);
          
          if (!anyError && anyAddresses) {
            anyAddresses.forEach(addr => {
              // Only add if we don't have an address for this user yet and address is not empty
              if (!userAddressesMap[addr.user_id] && addr.address && addr.address.trim() !== '') {
                userAddressesMap[addr.user_id] = addr;
              }
            });
          }
        }
      }
      console.log(`✅ Fetched ${Object.keys(userAddressesMap).length} user addresses`);
    }
    
    // Fetch addresses from most recent orders (for customers without addresses in user_addresses)
    let orderAddressesMap = {};
    const usersWithoutAddress = userIds.filter(id => !userAddressesMap[id]);
    if (usersWithoutAddress.length > 0) {
      console.log(`🔍 Looking for addresses in orders for ${usersWithoutAddress.length} users without addresses`);
      const batchSize = 50; // Smaller batch for orders query
      for (let i = 0; i < usersWithoutAddress.length; i += batchSize) {
        const batch = usersWithoutAddress.slice(i, i + batchSize);
        // Get most recent order with delivery address for each user
        // Use a different approach to filter out null delivery_address
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('user_id, delivery_address, created_at')
          .in('user_id', batch)
          .order('created_at', { ascending: false });
        
        if (!ordersError && orders) {
          // Filter out orders with null delivery_address
          const ordersWithAddress = orders.filter(order => order.delivery_address != null);
          console.log(`📦 Found ${ordersWithAddress.length} orders with delivery_address (out of ${orders.length} total) for batch ${Math.floor(i / batchSize) + 1}`);
          // Group by user_id and take the most recent order for each user
          const userOrderMap = {};
          ordersWithAddress.forEach(order => {
            if (!userOrderMap[order.user_id]) {
              userOrderMap[order.user_id] = order;
            }
          });
          
          // Extract addresses from delivery_address
          Object.keys(userOrderMap).forEach(userId => {
            const order = userOrderMap[userId];
            let deliveryAddr = order.delivery_address;
            
            // Debug: log the structure
            if (i === 0 && Object.keys(userOrderMap).indexOf(userId) === 0) {
              console.log('🔍 Sample delivery_address structure:', JSON.stringify(deliveryAddr, null, 2));
            }
            
            // Parse if delivery address is a JSON string
            if (typeof deliveryAddr === 'string') {
              try {
                deliveryAddr = JSON.parse(deliveryAddr);
              } catch (e) {
                // If parsing fails, use as string
                if (deliveryAddr && deliveryAddr.trim() !== '') {
                  orderAddressesMap[userId] = { address: deliveryAddr.trim() };
                }
                return;
              }
            }
            
            // Extract address from delivery_address object
            if (deliveryAddr && typeof deliveryAddr === 'object') {
              // Check for address field first (this is what generate script uses)
              if (deliveryAddr.address && typeof deliveryAddr.address === 'string' && deliveryAddr.address.trim() !== '') {
                orderAddressesMap[userId] = { address: deliveryAddr.address.trim() };
              } 
              // Check for streetAddress (camelCase) or street_address (snake_case) or street
              else if ((deliveryAddr.streetAddress || deliveryAddr.street_address || deliveryAddr.street) && deliveryAddr.city) {
                // Build address from components - check both camelCase and snake_case
                const street = deliveryAddr.streetAddress || deliveryAddr.street_address || deliveryAddr.street || '';
                const barangay = deliveryAddr.barangay || '';
                const city = deliveryAddr.city || '';
                const province = deliveryAddr.province || '';
                const postalCode = deliveryAddr.postalCode || deliveryAddr.postal_code || '';
                
                const parts = [street, barangay, city, province, postalCode].filter(Boolean);
                if (parts.length > 0) {
                  orderAddressesMap[userId] = { address: parts.join(', ') };
                }
              }
              // If we still don't have an address, log it for debugging (only for first user in first batch)
              else if (i === 0 && Object.keys(userOrderMap).indexOf(userId) === 0) {
                console.log('⚠️ Could not extract address from delivery_address. Keys:', Object.keys(deliveryAddr));
                console.log('⚠️ Sample delivery_address:', JSON.stringify(deliveryAddr, null, 2));
              }
            } else if (deliveryAddr && typeof deliveryAddr !== 'string') {
              // If it's not a string and not an object, log it
              if (i === 0 && Object.keys(userOrderMap).indexOf(userId) === 0) {
                console.log('⚠️ Unexpected delivery_address type:', typeof deliveryAddr, deliveryAddr);
              }
            }
          });
        } else if (ordersError) {
          console.warn(`⚠️ Error fetching order addresses batch ${Math.floor(i / batchSize) + 1}:`, ordersError.message);
        } else {
          console.log(`ℹ️ No orders found for batch ${Math.floor(i / batchSize) + 1}`);
        }
      }
      console.log(`✅ Fetched ${Object.keys(orderAddressesMap).length} addresses from orders`);
    }

    // Format customer data with priority: user_profiles > user_metadata
    // Process all customers first, then filter and paginate
    const allFormattedCustomers = filteredCustomers.map(user => {
      const profile = userProfilesMap[user.id];
      const userAddress = userAddressesMap[user.id];
      const orderAddress = orderAddressesMap[user.id];
      
      // Get name: priority is user_profiles.full_name > user_metadata (first_name + last_name) > email
      let name = null;
      if (profile?.full_name) {
        name = profile.full_name;
      } else {
        const firstName = user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || '';
        const lastName = user.user_metadata?.last_name || user.raw_user_meta_data?.last_name || '';
        name = `${firstName} ${lastName}`.trim() || user.email || 'N/A';
      }
      
      // Get contact number: priority is user_profiles.phone > user_metadata.phone > user_metadata.contact_number
      // Check if phone is not null, not undefined, and not empty string
      let contact_number = null;
      if (profile?.phone && profile.phone.trim() !== '') {
        contact_number = profile.phone.trim();
      } else if (user.user_metadata?.phone && user.user_metadata.phone.trim() !== '') {
        contact_number = user.user_metadata.phone.trim();
      } else if (user.raw_user_meta_data?.phone && user.raw_user_meta_data.phone.trim() !== '') {
        contact_number = user.raw_user_meta_data.phone.trim();
      } else if (user.user_metadata?.contact_number && user.user_metadata.contact_number.trim() !== '') {
        contact_number = user.user_metadata.contact_number.trim();
      } else if (user.raw_user_meta_data?.contact_number && user.raw_user_meta_data.contact_number.trim() !== '') {
        contact_number = user.raw_user_meta_data.contact_number.trim();
      }
      
      // Get address: priority is user_addresses.address > orders.delivery_address > user_profiles.address > user_metadata.address
      let address = null;
      if (userAddress?.address && userAddress.address.trim() !== '') {
        address = userAddress.address.trim();
      } else if (orderAddress?.address && orderAddress.address.trim() !== '') {
        address = orderAddress.address.trim();
      } else if (profile?.address && profile.address.trim() !== '') {
        address = profile.address.trim();
      } else if (user.user_metadata?.address && user.user_metadata.address.trim() !== '') {
        address = user.user_metadata.address.trim();
      } else if (user.raw_user_meta_data?.address && user.raw_user_meta_data.address.trim() !== '') {
        address = user.raw_user_meta_data.address.trim();
      }
      
      // Debug: Log first customer's address sources (only for first customer)
      if (filteredCustomers.indexOf(user) === 0) {
        console.log('🔍 Address lookup for user:', user.id);
        console.log('  - userAddress:', userAddress?.address || 'N/A');
        console.log('  - orderAddress:', orderAddress?.address || 'N/A');
        console.log('  - profile.address:', profile?.address || 'N/A');
        console.log('  - Final address:', address || 'N/A');
      }
      
      return {
        id: user.id,
        email: user.email,
        name: name,
        contact_number: contact_number,
        address: address,
        created_at: user.created_at
      };
    });

    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedCustomers = allFormattedCustomers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCustomers / perPage);

    console.log(`📤 Sending paginated customers: Page ${page}/${totalPages}, Showing ${paginatedCustomers.length} of ${totalCustomers} customers`);
    
    // Debug: Log sample customers to see contact numbers
    if (paginatedCustomers.length > 0) {
      const customersWithPhone = paginatedCustomers.filter(c => c.contact_number);
      const customersWithoutPhone = paginatedCustomers.filter(c => !c.contact_number);
      console.log(`📞 Customers with phone: ${customersWithPhone.length}, without phone: ${customersWithoutPhone.length}`);
    }
    
    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Return paginated results with metadata
    res.json({
      customers: paginatedCustomers,
      pagination: {
        page,
        perPage,
        total: totalCustomers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
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
        let totalTasksAssigned = 0;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('artist_profiles')
            .select('id, artist_name, is_active, is_verified, total_tasks_completed, rating, commission_rate')
            .eq('user_id', user.id)
            .single();
          
          if (!profileError && profileData) {
            artistProfile = profileData;
            
            // Get total tasks assigned to this artist
            const { count, error: tasksError } = await supabase
              .from('artist_tasks')
              .select('*', { count: 'exact', head: true })
              .eq('artist_id', profileData.id);
            
            if (!tasksError && count !== null) {
              totalTasksAssigned = count;
            }
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
          total_tasks_assigned: totalTasksAssigned,
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

// Toggle artist active status (owner or artist themselves)
router.patch('/artists/:id/toggle-status', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const user = req.user;
    const userRole = user?.user_metadata?.role || user?.raw_user_meta_data?.role;
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';
    
    console.log('🔄 Toggling artist status:', { id, is_active, userRole, userId: user?.id });
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean value' });
    }
    
    // Get artist profile by user_id
    const { data: profileData, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id, user_id, artist_name')
      .eq('user_id', id)
      .single();
    
    if (profileError || !profileData) {
      console.error('Error finding artist profile:', profileError);
      return res.status(404).json({ error: 'Artist profile not found' });
    }
    
    // Check permissions: owner/admin can toggle any artist, artist can only toggle themselves
    if (!isOwner && !isAdmin) {
      if (user?.id !== id) {
        return res.status(403).json({ error: 'You can only toggle your own status' });
      }
    }
    
    // Update is_active status
    const { data: updatedProfile, error: updateError } = await supabase
      .from('artist_profiles')
      .update({ is_active: is_active })
      .eq('id', profileData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating artist status:', updateError);
      return res.status(500).json({ error: 'Failed to update artist status' });
    }
    
    console.log('✅ Artist status updated successfully');
    res.json({ 
      message: `Artist status updated to ${is_active ? 'active' : 'inactive'}`,
      data: {
        id: id,
        artist_name: updatedProfile.artist_name,
        is_active: is_active
      }
    });
    
  } catch (error) {
    console.error('Error toggling artist status:', error);
    res.status(500).json({ error: 'Failed to toggle artist status' });
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
