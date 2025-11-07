const express = require('express');
const { supabase, query } = require('../lib/db');
const emailService = require('../lib/emailService');
const router = express.Router();

// Test endpoint to verify server is working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Supabase client and query helper are provided by ../lib/db

// Function to update sold_quantity for products in an order
async function updateSoldQuantityForOrder(orderItems) {
  try {
    console.log('📊 Updating sold quantity for order items:', orderItems);
    
    for (const item of orderItems) {
      if (item.id && item.quantity) {
        const quantityToAdd = parseInt(item.quantity) || 1;
        
        // Get current sold_quantity
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('sold_quantity')
          .eq('id', item.id)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching current sold quantity for product ${item.id}:`, fetchError);
          continue;
        }
        
        const currentSoldQuantity = currentProduct?.sold_quantity || 0;
        const newSoldQuantity = currentSoldQuantity + quantityToAdd;
        
        // Update sold_quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            sold_quantity: newSoldQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`Error updating sold quantity for product ${item.id}:`, updateError);
        } else {
          console.log(`✅ Updated sold quantity for product ${item.id} from ${currentSoldQuantity} to ${newSoldQuantity}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in updateSoldQuantityForOrder:', error);
    throw error;
  }
}

// Get all orders with filters
router.get('/', async (req, res) => {
  try {
    const {
      dateSort,
      priceSort,
      quantitySort,
      pickupBranch,
      status,
      page = 1,
      limit = 150  // Changed from 50 to 150
    } = req.query;

    console.log(`📦 [Orders API] Fetching orders - page: ${page}, limit: ${limit}, branch: ${pickupBranch}, status: ${status}`);

    // Check if any filter is applied
    const hasFilters = pickupBranch || status;

    // Build Supabase query
    let query = supabase
      .from('orders')
      .select('*');

    // Apply filters
    if (pickupBranch) {
      query = query.eq('pickup_location', pickupBranch);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    if (dateSort === 'asc') {
      query = query.order('created_at', { ascending: true });
    } else if (dateSort === 'desc') {
      query = query.order('created_at', { ascending: false });
    } else if (priceSort === 'asc') {
      query = query.order('total_amount', { ascending: true });
    } else if (priceSort === 'desc') {
      query = query.order('total_amount', { ascending: false });
    } else if (quantitySort === 'asc') {
      query = query.order('total_items', { ascending: true });
    } else if (quantitySort === 'desc') {
      query = query.order('total_items', { ascending: false });
    } else {
      // Default sorting by date descending
      query = query.order('created_at', { ascending: false });
    }

    // Get total count BEFORE applying range
    const countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact' });
    
    if (pickupBranch) {
      countQuery.eq('pickup_location', pickupBranch);
    }
    if (status) {
      countQuery.eq('status', status);
    }
    
    const { count: totalCount } = await countQuery;
    console.log(`📦 [Orders API] Total count from DB: ${totalCount}`);

    // Apply pagination ONLY if filters are applied, otherwise fetch all
    if (hasFilters) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);
      console.log(`📦 [Orders API] Filters applied - using pagination (offset: ${offset}, limit: ${limit})`);
    } else {
      // Fetch ALL orders when no filter - use large limit
      query = query.limit(10000);
      console.log(`📦 [Orders API] No filters - fetching all orders (up to 10000)`);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`📦 [Orders API] Returning ${orders?.length} orders, total: ${totalCount}`);

    // Get unique user IDs from orders
    const userIds = [...new Set(orders.map(order => order.user_id).filter(Boolean))];
    
    // Fetch user data for all unique user IDs
    let userData = {};
    if (userIds.length > 0) {
      try {
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError && users?.users) {
          users.users.forEach(user => {
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            const fullName = user.user_metadata?.full_name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);
            
            userData[user.id] = {
              email: user.email,
              full_name: fullName || null
            };
          });
        }
      } catch (error) {
        console.warn('Could not fetch user data:', error.message);
      }
    }

    // Transform data to match expected format
    const transformedOrders = (orders || []).map(order => {
      // Extract customer info from user data or delivery address
      let customerName = 'Unknown Customer';
      let customerEmail = 'N/A';
      
      // For all orders, prioritize user account information
      const user = userData[order.user_id];
      if (user?.email) {
        customerEmail = user.email;
      }
      if (user?.full_name) {
        customerName = user.full_name;
      } else if (order.delivery_address?.receiver) {
        customerName = order.delivery_address.receiver;
      }
      
      // For custom design orders, if no user name is available, fall back to client info
      if (order.order_type === 'custom_design' && order.order_items && order.order_items.length > 0 && !user?.full_name) {
        const firstItem = order.order_items[0];
        if (firstItem.client_name) {
          customerName = firstItem.client_name;
        }
        if (firstItem.client_email) {
          customerEmail = firstItem.client_email;
        }
      }
      
      return {
        ...order,
        customer_email: customerEmail,
        customer_name: customerName
      };
    });

    res.json({
      orders: transformedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Fetch user data for this order
    let userData = null;
    if (order.user_id) {
      try {
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError && users?.users) {
          const user = users.users.find(u => u.id === order.user_id);
          if (user) {
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            const fullName = user.user_metadata?.full_name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);
            
            userData = {
              email: user.email,
              full_name: fullName || null
            };
          }
        }
      } catch (error) {
        console.warn('Could not fetch user data:', error.message);
      }
    }

    // Transform data to match expected format
    let customerName = 'Unknown Customer';
    let customerEmail = 'N/A';
    
    // For all orders, prioritize user account information
    if (userData?.email) {
      customerEmail = userData.email;
    }
    if (userData?.full_name) {
      customerName = userData.full_name;
    } else if (order.delivery_address?.receiver) {
      customerName = order.delivery_address.receiver;
    }
    
    // For custom design orders, if no user name is available, fall back to client info
    if (order.order_type === 'custom_design' && order.order_items && order.order_items.length > 0 && !userData?.full_name) {
      const firstItem = order.order_items[0];
      if (firstItem.client_name) {
        customerName = firstItem.client_name;
      }
      if (firstItem.client_email) {
        customerEmail = firstItem.client_email;
      }
    }
    
    const transformedOrder = {
      ...order,
      customer_email: customerEmail,
      customer_name: customerName
    };

    res.json(transformedOrder);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  console.log('🚀 STATUS UPDATE ROUTE CALLED');
  console.log('🚀 Request params:', req.params);
  console.log('🚀 Request body:', req.body);
  
  try {
    const { id } = req.params;
    const { status, skipEmail = false } = req.body;

    // Updated to support new production stage statuses
    const validStatuses = [
      'pending', 'confirmed', 'layout', 'sizing', 'printing', 
      'press', 'prod', 'packing_completing', 'picked_up_delivered', 
      'cancelled'
    ];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    // Get user making the request (for role validation)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userRole = requestingUser.user_metadata?.role || 'customer';
    console.log('👤 User making request:', { id: requestingUser.id, role: userRole });

    // Get current order data before update
    const { data: currentOrderData, error: currentError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentOrderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get user data separately
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(currentOrderData.user_id);
    
    const currentOrder = {
      ...currentOrderData,
      customer_email: userData?.user?.email || null,
      customer_name: userData?.user?.user_metadata?.full_name || null
    };
    const previousStatus = currentOrder.status;

    // ARTIST-ONLY SIZING CONTROL
    if (status === 'sizing') {
      console.log('📏 SIZING STATUS VALIDATION');
      
      // Check if user is an artist
      if (userRole !== 'artist') {
        console.log('❌ Non-artist trying to move to sizing:', userRole);
        return res.status(403).json({ 
          error: 'Only artists can move orders to sizing status',
          requiredRole: 'artist',
          currentRole: userRole
        });
      }

      // Check if design files have been uploaded
      const hasDesignFiles = currentOrder.design_files && 
                            Array.isArray(currentOrder.design_files) && 
                            currentOrder.design_files.length > 0;
      
      if (!hasDesignFiles) {
        console.log('❌ No design files uploaded for sizing');
        return res.status(400).json({ 
          error: 'Design files must be uploaded before moving to sizing status',
          currentStatus: previousStatus,
          requiredAction: 'Upload design files first'
        });
      }

      // Check if order is in layout status (prerequisite)
      if (previousStatus !== 'layout') {
        console.log('❌ Order not in layout status:', previousStatus);
        return res.status(400).json({ 
          error: 'Order must be in layout status before moving to sizing',
          currentStatus: previousStatus,
          requiredStatus: 'layout'
        });
      }

      console.log('✅ Artist sizing validation passed');
    }

    // Update order status
    const { data: updatedOrderData, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedOrderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = updatedOrderData;

    // Debug: Log all status changes
    console.log(`🔄 Order ${updatedOrder.order_number} status changed: ${previousStatus} → ${status}`);

    // Assign artist task when order moves to 'layout' status
    if (status === 'layout' && previousStatus !== 'layout') {
      try {
        console.log(`🎨 Assigning artist task for order ${updatedOrder.order_number}`);
        console.log(`🎨 Order ID: ${currentOrder.id}`);
        console.log(`🎨 Order Type: ${currentOrder.order_type}`);
        console.log(`🎨 Order Items:`, JSON.stringify(currentOrder.order_items, null, 2));
        
        // Determine order type and assign appropriate task
        let taskId = null;
        
        if (currentOrder.order_type === 'custom_design') {
          // Custom design order
          const { data: customTaskData, error: customError } = await supabase.rpc('assign_custom_design_task', {
            p_order_id: currentOrder.id,
            p_product_name: currentOrder.order_items?.[0]?.name || 'Custom Design',
            p_quantity: currentOrder.total_items || 1,
            p_customer_requirements: currentOrder.order_notes || null,
            p_priority: 'medium',
            p_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            p_product_id: currentOrder.order_items?.[0]?.id || null
          });
          
          if (customError) {
            console.error('❌ Error assigning custom design task:', customError);
            console.error('❌ Custom task error details:', JSON.stringify(customError, null, 2));
          } else {
            taskId = customTaskData;
            console.log(`✅ Custom design task assigned: ${taskId}`);
          }
        } else if (currentOrder.order_number?.startsWith('WALKIN-')) {
          // Walk-in order
          const { data: walkInTaskData, error: walkInError } = await supabase.rpc('assign_walk_in_order_task', {
            p_product_name: currentOrder.order_items?.[0]?.name || 'Walk-in Product',
            p_quantity: currentOrder.total_items || 1,
            p_customer_requirements: currentOrder.order_notes || null,
            p_priority: 'high',
            p_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
            p_order_id: currentOrder.id,
            p_product_id: currentOrder.order_items?.[0]?.id || null
          });
          
          if (walkInError) {
            console.error('❌ Error assigning walk-in order task:', walkInError);
            console.error('❌ Walk-in task error details:', JSON.stringify(walkInError, null, 2));
          } else {
            taskId = walkInTaskData;
            console.log(`✅ Walk-in order task assigned: ${taskId}`);
          }
        } else {
          // Regular order (store products)
          // Get product image from order items for artist reference
          const firstItem = currentOrder.order_items?.[0];
          const productImage = firstItem?.image || firstItem?.main_image || null;
          let customerRequirements = currentOrder.order_notes || '';
          
          // Add product image to requirements if available
          if (productImage) {
            customerRequirements = customerRequirements 
              ? `${customerRequirements}\n\n📸 Product Image: ${productImage}`
              : `📸 Product Image: ${productImage}`;
          }
          
          const { data: regularTaskData, error: regularError } = await supabase.rpc('assign_regular_order_task', {
            p_product_name: firstItem?.name || 'Store Product',
            p_quantity: currentOrder.total_items || 1,
            p_customer_requirements: customerRequirements || null,
            p_priority: 'medium',
            p_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            p_order_id: currentOrder.id,
            p_product_id: firstItem?.id || null,
            p_order_source: 'online'
          });
          
          if (regularError) {
            console.error('❌ Error assigning regular order task:', regularError);
            console.error('❌ Regular task error details:', JSON.stringify(regularError, null, 2));
          } else {
            taskId = regularTaskData;
            console.log(`✅ Regular order task assigned: ${taskId}`);
            
            // If task was created successfully and we have an image, update the task with image reference
            if (taskId && productImage) {
              try {
                // Update the task's design_requirements and product_thumbnail to include the image
                const { data: existingTask } = await supabase
                  .from('artist_tasks')
                  .select('design_requirements')
                  .eq('id', taskId)
                  .single();
                
                if (existingTask) {
                  const updatedRequirements = existingTask.design_requirements 
                    ? `${existingTask.design_requirements}\n\n🖼️ Product Reference Image: ${productImage}`
                    : `🖼️ Product Reference Image: ${productImage}`;
                  
                  // Update both design_requirements and product_thumbnail
                  await supabase
                    .from('artist_tasks')
                    .update({ 
                      design_requirements: updatedRequirements,
                      product_thumbnail: productImage
                    })
                    .eq('id', taskId);
                  
                  console.log(`✅ Added product image to task ${taskId}`);
                }
              } catch (updateError) {
                console.error('⚠️ Could not update task with image (non-critical):', updateError);
              }
            }
          }
        }
        
        if (taskId) {
          console.log(`🎨 Artist task successfully assigned for order ${updatedOrder.order_number}`);
        } else {
          console.warn(`⚠️ Failed to assign artist task for order ${updatedOrder.order_number}`);
        }
        
      } catch (error) {
        console.error('❌ Error in artist task assignment:', error);
        // Don't fail the entire request if artist assignment fails
      }
    }

    // Update sold_quantity when order is completed (picked_up_delivered)
    if (status === 'picked_up_delivered' && previousStatus !== 'picked_up_delivered') {
      try {
        await updateSoldQuantityForOrder(currentOrder.order_items || []);
        console.log(`📊 Updated sold quantity for completed order ${updatedOrder.order_number}`);
      } catch (error) {
        console.error('Error updating sold quantity for completed order:', error);
        // Don't fail the status update if sold quantity update fails
      }
    }

    // Send email notification if not skipped and email is configured
    let emailResult = null;
    if (!skipEmail && currentOrder.customer_email && process.env.EMAIL_USER) {
      try {
        emailResult = await emailService.sendOrderStatusUpdate(
          updatedOrder,
          currentOrder.customer_email,
          currentOrder.customer_name,
          status,
          previousStatus
        );
        console.log(`📧 Email sent for order ${updatedOrder.order_number} status update: ${status}`);
      } catch (emailError) {
        console.error('❌ Failed to send status update email:', emailError);
        // Don't fail the entire request if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.json({
      ...updatedOrder,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Create new order (for testing purposes)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const userId = body.userId || body.user_id;
    const orderNumber = body.orderNumber || body.order_number;
    const shippingMethod = body.shippingMethod || body.shipping_method;
    const pickupLocation = body.pickupLocation || body.pickup_location;
    const deliveryAddress = body.deliveryAddress || body.delivery_address;
    const orderNotes = body.orderNotes || body.order_notes || null;
    const subtotalAmount = body.subtotalAmount || body.subtotal_amount || 0;
    const shippingCost = body.shippingCost || body.shipping_cost || 0;
    const totalAmount = body.totalAmount || body.total_amount || 0;
    const totalItems = body.totalItems || body.total_items || 0;
    const orderItems = body.orderItems || body.order_items || [];

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || `ORD-${Date.now()}`;

    // Insert using Supabase client
    const { data: inserted, error: insertError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          order_number: finalOrderNumber,
          status: body.status || 'pending',
          shipping_method: shippingMethod,
          pickup_location: pickupLocation,
          delivery_address: deliveryAddress || null,
          order_notes: orderNotes,
          subtotal_amount: subtotalAmount,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          total_items: totalItems,
          order_items: orderItems
        }
      ])
      .select()
      .single();

    if (insertError || !inserted) {
      // Provide more details for debugging
      console.error('Insert order failed:', insertError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const newOrder = inserted;

    // Assign artist task immediately when order is created
    // This ensures every order has an assigned artist from the start
    if (newOrder.status === 'pending' || newOrder.status === 'confirmed') {
      try {
        console.log(`🎨 Assigning artist task for new order ${newOrder.order_number}`);
        console.log(`🎨 Order ID: ${newOrder.id}`);
        console.log(`🎨 Order Type: ${newOrder.order_type || 'regular'}`);
        
        let taskId = null;
        
        // Determine order type and assign appropriate task
        if (newOrder.order_type === 'custom_design') {
          // Custom design order
          const { data: customTaskData, error: customError } = await supabase.rpc('assign_custom_design_task', {
            p_order_id: newOrder.id,
            p_product_name: newOrder.order_items?.[0]?.name || 'Custom Design',
            p_quantity: newOrder.total_items || 1,
            p_customer_requirements: newOrder.order_notes || null,
            p_priority: 'medium',
            p_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            p_product_id: newOrder.order_items?.[0]?.id || null
          });
          
          if (customError) {
            console.error('❌ Error assigning custom design task:', customError);
          } else {
            taskId = customTaskData;
            console.log(`✅ Custom design task assigned: ${taskId}`);
          }
        } else if (newOrder.order_number?.startsWith('WALKIN-')) {
          // Walk-in order
          const { data: walkInTaskData, error: walkInError } = await supabase.rpc('assign_walk_in_order_task', {
            p_product_name: newOrder.order_items?.[0]?.name || 'Walk-in Product',
            p_quantity: newOrder.total_items || 1,
            p_customer_requirements: newOrder.order_notes || null,
            p_priority: 'high',
            p_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
            p_order_id: newOrder.id,
            p_product_id: newOrder.order_items?.[0]?.id || null
          });
          
          if (walkInError) {
            console.error('❌ Error assigning walk-in order task:', walkInError);
          } else {
            taskId = walkInTaskData;
            console.log(`✅ Walk-in order task assigned: ${taskId}`);
          }
        } else {
          // Regular order (store products)
          // Get product image from order items for artist reference
          const firstItem = newOrder.order_items?.[0];
          const productImage = firstItem?.image || firstItem?.main_image || null;
          let customerRequirements = newOrder.order_notes || '';
          
          // Add product image to requirements if available
          if (productImage) {
            customerRequirements = customerRequirements 
              ? `${customerRequirements}\n\n📸 Product Image: ${productImage}`
              : `📸 Product Image: ${productImage}`;
          }
          
          const { data: regularTaskData, error: regularError } = await supabase.rpc('assign_regular_order_task', {
            p_product_name: firstItem?.name || 'Store Product',
            p_quantity: newOrder.total_items || 1,
            p_customer_requirements: customerRequirements || null,
            p_priority: 'medium',
            p_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            p_order_id: newOrder.id,
            p_product_id: firstItem?.id || null,
            p_order_source: 'online'
          });
          
          if (regularError) {
            console.error('❌ Error assigning regular order task:', regularError);
          } else {
            taskId = regularTaskData;
            console.log(`✅ Regular order task assigned: ${taskId}`);
            
            // If task was created successfully and we have an image, update the task with image reference
            if (taskId && productImage) {
              try {
                // Update the task's design_requirements and product_thumbnail to include the image
                const { data: existingTask } = await supabase
                  .from('artist_tasks')
                  .select('design_requirements')
                  .eq('id', taskId)
                  .single();
                
                if (existingTask) {
                  const updatedRequirements = existingTask.design_requirements 
                    ? `${existingTask.design_requirements}\n\n🖼️ Product Reference Image: ${productImage}`
                    : `🖼️ Product Reference Image: ${productImage}`;
                  
                  // Update both design_requirements and product_thumbnail
                  await supabase
                    .from('artist_tasks')
                    .update({ 
                      design_requirements: updatedRequirements,
                      product_thumbnail: productImage
                    })
                    .eq('id', taskId);
                  
                  console.log(`✅ Added product image to task ${taskId}`);
                }
              } catch (updateError) {
                console.error('⚠️ Could not update task with image (non-critical):', updateError);
              }
            }
          }
        }
        
        if (taskId) {
          console.log(`🎨 Artist task successfully assigned for order ${newOrder.order_number}`);
          
          // Create chat room automatically when task is assigned
          try {
            // Get the assigned artist ID from the task
            const { data: assignedTask, error: taskFetchError } = await supabase
              .from('artist_tasks')
              .select('artist_id')
              .eq('id', taskId)
              .single();
            
            if (!taskFetchError && assignedTask?.artist_id) {
              // Check if chat room already exists
              const { data: existingRoom } = await supabase
                .from('design_chat_rooms')
                .select('id')
                .eq('order_id', newOrder.id)
                .single();
              
              if (!existingRoom) {
                // Create chat room
                const { data: chatRoom, error: roomError } = await supabase
                  .from('design_chat_rooms')
                  .insert({
                    order_id: newOrder.id,
                    customer_id: newOrder.user_id,
                    artist_id: assignedTask.artist_id,
                    task_id: taskId,
                    room_name: `Order ${newOrder.order_number} Chat`
                  })
                  .select()
                  .single();
                
                if (roomError) {
                  console.error('❌ Error creating chat room:', roomError);
                } else {
                  console.log(`✅ Chat room created automatically: ${chatRoom.id}`);
                }
              } else {
                console.log(`✅ Chat room already exists: ${existingRoom.id}`);
              }
            }
          } catch (chatError) {
            console.error('❌ Error in chat room creation during order creation:', chatError);
            // Don't fail the entire request if chat room creation fails
          }
        } else {
          console.warn(`⚠️ Failed to assign artist task for order ${newOrder.order_number}`);
        }
      } catch (error) {
        console.error('❌ Error in artist task assignment during order creation:', error);
        // Don't fail the entire request if artist assignment fails
      }
    }

    // Note: sold_quantity will be updated when order status changes to 'picked_up_delivered'
    // This prevents double-counting when orders are created and then completed

    // Send order confirmation email if email is configured
    let emailResult = null;
    if (process.env.EMAIL_USER && userId) {
      try {
        // Get customer email via Supabase Auth Admin API
        const { data: userResp, error: userLookupError } = await supabase.auth.admin.getUserById(userId);
        if (!userLookupError && userResp?.user?.email) {
          emailResult = await emailService.sendOrderConfirmation(
            newOrder,
            userResp.user.email,
            userResp.user.user_metadata?.full_name || null
          );
          console.log(`📧 Order confirmation email sent for order ${newOrder.order_number}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation email:', emailError);
        // Don't fail the entire request if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.status(201).json({
      ...newOrder,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
