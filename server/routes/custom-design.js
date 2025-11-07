const express = require('express');
const multer = require('multer');
const { supabase } = require('../lib/db');
const { uploadToCloudinary } = require('../middleware/upload');
const emailService = require('../lib/emailService');
const router = express.Router();

const branches = [
  { id: 'san-pascual', name: 'SAN PASCUAL (MAIN BRANCH)', address: 'Villa Maria Subdivision Sambat, San Pascual, 4204 Batangas' },
  { id: 'calapan', name: 'CALAPAN BRANCH', address: 'Unit 2, G/F Basa Bldg., Infantado St., San Vicente West, Calapan City' },
  { id: 'muzon', name: 'MUZON BRANCH', address: 'Barangay Muzon, San Luis, 4226 Batangas' },
  { id: 'lemery', name: 'LEMERY BRANCH', address: 'Miranda Bldg, Illustre Ave., Brgy. District III 4209 Lemery Batangas' },
  { id: 'batangas-city', name: 'BATANGAS CITY BRANCH', address: 'Unit 1 Casa Buena Bldg, P. Burgos St. Ext Calicanto, Batangas' },
  { id: 'bauan', name: 'BAUAN BRANCH', address: 'J.P Rizal St. Poblacion, Bauan Batangas' },
  { id: 'calaca', name: 'CALACA BRANCH', address: 'Block D-8 Calaca Public Market, Poblacion 4, Calaca City' },
  { id: 'balayan', name: 'BALAYAN BRANCH', address: 'Balayan, Batangas' },
  { id: 'lipa', name: 'LIPA BRANCH', address: 'Lipa City, Batangas' },
];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

// Create custom design order
router.post('/', upload.array('designImages', 10), async (req, res) => {
  try {
    console.log('🎨 Custom design order submission received');
    
    // Check if user ID is provided (authentication required)
    const userId = req.body.userId;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to place a custom design order'
      });
    }
    
    const {
      clientName,
      email,
      phone,
      teamName,
      members,
      shippingMethod,
      pickupBranchId,
      deliveryAddress,
      orderNotes
    } = req.body;

    // Validate required fields
    if (!clientName || !email || !teamName || !members) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['clientName', 'email', 'teamName', 'members']
      });
    }

    // Parse members JSON if it's a string
    const membersArray = typeof members === 'string' ? JSON.parse(members) : members;
    
    if (!Array.isArray(membersArray) || membersArray.length === 0) {
      return res.status(400).json({ error: 'At least one team member is required' });
    }

    // Validate each member
    for (const member of membersArray) {
      if (!member.number || !member.surname || !member.size || !member.shortsSize || !member.sizingType) {
        return res.status(400).json({ 
          error: 'All team members must have number, surname, jersey size, shorts size, and sizing type' 
        });
      }
    }

    // Generate order number
    const orderNumber = `CD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Calculate pricing (you can adjust these based on your pricing structure)
    const basePricePerJersey = 500; // Base price per jersey
    const customDesignFee = 200; // Additional fee for custom design
    const subtotalAmount = (basePricePerJersey + customDesignFee) * membersArray.length;
    const shippingCost = shippingMethod === 'delivery' ? 50 : 0;
    const totalAmount = subtotalAmount + shippingCost;

    // Handle image uploads if provided
    let designImages = [];
    if (req.files && req.files.length > 0) {
      console.log(`🎨 Uploading ${req.files.length} design images to Cloudinary`);
      
      try {
        const uploadPromises = req.files.map((file, index) => {
          console.log(`🎨 Uploading image ${index + 1}/${req.files.length}: ${file.originalname}`);
          return uploadToCloudinary(file, 'yohanns-custom-designs');
        });
        
        const results = await Promise.all(uploadPromises);
        designImages = results.map((result, index) => ({
          filename: req.files[index].originalname,
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date().toISOString()
        }));
        
        console.log('🎨 Design images uploaded successfully');
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload design images',
          details: uploadError.message 
        });
      }
    }

    // Verify the provided user exists (authentication required)
    let finalUserId = userId;
    
    try {
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(finalUserId);
      
      if (userError || !existingUser.user) {
        console.error('❌ User not found:', userError);
        return res.status(401).json({ 
          error: 'Invalid user',
          message: 'The provided user ID is not valid'
        });
      } else {
        console.log('✅ Using authenticated user:', finalUserId);
      }
    } catch (error) {
      console.error('❌ Error verifying user:', error);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Unable to verify user authentication'
      });
    }

    // Create order data - using existing schema with custom data in JSON fields
    const orderData = {
      user_id: finalUserId,
      order_number: orderNumber,
      status: 'pending',
      order_type: 'custom_design', // Set order type for proper artist assignment
      shipping_method: shippingMethod === 'delivery' ? 'cod' : shippingMethod, // Convert 'delivery' to 'cod'
      pickup_location: shippingMethod === 'pickup' ? branches.find(b => b.id === pickupBranchId)?.name : null,
      delivery_address: shippingMethod === 'delivery' ? { address: deliveryAddress } : null,
      order_notes: orderNotes,
      subtotal_amount: subtotalAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      total_items: membersArray.length,
      order_items: [{
        product_type: 'custom_design',
        name: teamName || 'Custom Design', // Add name field for artist task assignment
        team_name: teamName,
        team_members: membersArray,
        design_images: designImages,
        client_name: clientName,
        client_email: email,
        client_phone: phone,
        pickup_branch_id: shippingMethod === 'pickup' ? pickupBranchId : null
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert order into database
    console.log('🎨 Inserting custom design order into database');
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (insertError || !insertedOrder) {
      console.error('❌ Database insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create custom design order',
        details: insertError?.message 
      });
    }

    console.log(`✅ Custom design order created: ${orderNumber}`);

    // Assign artist task immediately when custom design order is created
    try {
      console.log(`🎨 Assigning artist task for new custom design order ${orderNumber}`);
      console.log(`🎨 Order ID: ${insertedOrder.id}`);
      
      const { data: customTaskData, error: customError } = await supabase.rpc('assign_custom_design_task', {
        p_order_id: insertedOrder.id,
        p_product_name: insertedOrder.order_items?.[0]?.name || teamName || 'Custom Design',
        p_quantity: insertedOrder.total_items || membersArray.length || 1,
        p_customer_requirements: orderNotes || `Team: ${teamName}, Members: ${membersArray.length}`,
        p_priority: 'medium',
        p_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        p_product_id: insertedOrder.order_items?.[0]?.id || null
      });
      
      if (customError) {
        console.error('❌ Error assigning custom design task:', customError);
        console.error('❌ Custom task error details:', JSON.stringify(customError, null, 2));
      } else {
        console.log(`✅ Custom design task assigned: ${customTaskData}`);
        
        // Create chat room automatically when task is assigned
        try {
          // Get the assigned artist ID from the task
          const { data: assignedTask, error: taskFetchError } = await supabase
            .from('artist_tasks')
            .select('artist_id')
            .eq('id', customTaskData)
            .single();
          
          if (!taskFetchError && assignedTask?.artist_id) {
            // Check if chat room already exists
            const { data: existingRoom } = await supabase
              .from('design_chat_rooms')
              .select('id')
              .eq('order_id', insertedOrder.id)
              .single();
            
            if (!existingRoom) {
              // Create chat room
              const { data: chatRoom, error: roomError } = await supabase
                .from('design_chat_rooms')
                .insert({
                  order_id: insertedOrder.id,
                  customer_id: insertedOrder.user_id,
                  artist_id: assignedTask.artist_id,
                  task_id: customTaskData,
                  room_name: `Order ${orderNumber} Chat`
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
          console.error('❌ Error in chat room creation during custom design order creation:', chatError);
          // Don't fail the entire request if chat room creation fails
        }
      }
    } catch (error) {
      console.error('❌ Error in artist task assignment during custom design order creation:', error);
      // Don't fail the entire request if artist assignment fails
    }

    // Send confirmation email
    let emailResult = null;
    if (process.env.EMAIL_USER) {
      try {
        emailResult = await emailService.sendCustomDesignConfirmation(
          insertedOrder,
          email,
          clientName
        );
        console.log(`📧 Custom design confirmation email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        // Don't fail the order creation if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.status(201).json({
      success: true,
      message: 'Custom design order created successfully',
      order: insertedOrder,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });

  } catch (error) {
    console.error('❌ Custom design order error:', error);
    res.status(500).json({ 
      error: 'Failed to create custom design order',
      details: error.message 
    });
  }
});

// Get custom design orders (for admin)
router.get('/', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'custom_design')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching custom design orders:', error);
      return res.status(500).json({ error: 'Failed to fetch custom design orders' });
    }

    res.json({ orders });
  } catch (error) {
    console.error('❌ Error in get custom design orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific custom design order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('order_type', 'custom_design')
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Custom design order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('❌ Error fetching custom design order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
