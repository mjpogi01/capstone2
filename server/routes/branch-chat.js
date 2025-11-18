const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { authenticateSupabaseToken } = require('../middleware/supabaseAuth');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_SELECT_FIELDS = `
  id,
  branch_id,
  customer_id,
  admin_id,
  subject,
  status,
  last_message_at,
  created_at,
  updated_at,
  branch:branches ( id, name, phone, email )
`;

async function getRoomForUser(roomId, user) {
  const { data: room, error } = await supabase
    .from('branch_chat_rooms')
    .select('id, branch_id, customer_id, admin_id, status')
    .eq('id', roomId)
    .maybeSingle();

  if (error || !room) {
    const message = error?.message || 'Chat room not found';
    const status = error?.code === 'PGRST116' ? 404 : 404;
    const err = new Error(message);
    err.status = status;
    throw err;
  }

  const role = user?.role || 'customer';

  if (role === 'customer') {
    if (room.customer_id !== user.id) {
      const err = new Error('Access denied to this chat room');
      err.status = 403;
      throw err;
    }
  } else if (role === 'admin') {
    if (!user.branch_id || room.branch_id !== user.branch_id) {
      const err = new Error('Access denied to this branch chat');
      err.status = 403;
      throw err;
    }
  } else if (role === 'owner') {
    // Owners can access all rooms
  } else {
    const err = new Error('Role not permitted for branch chat');
    err.status = 403;
    throw err;
  }

  return room;
}

async function appendMessage({
  roomId,
  senderId,
  senderType,
  message,
  messageType = 'text',
  attachments = []
}) {
  const { data: inserted, error } = await supabase
    .from('branch_chat_messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      sender_type: senderType,
      message,
      message_type: messageType,
      attachments
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message || 'Failed to send message');
    err.status = 500;
    throw err;
  }

  const updatePayload = {
    last_message_at: inserted.created_at,
    status: 'open'
  };

  if (senderType === 'admin') {
    updatePayload.admin_id = senderId;
  }

  await supabase
    .from('branch_chat_rooms')
    .update(updatePayload)
    .eq('id', roomId);

  return inserted;
}

router.post('/rooms', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { branchId, subject, initialMessage } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', branchId)
      .maybeSingle();

    if (branchError || !branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const { data: existingRoom } = await supabase
      .from('branch_chat_rooms')
      .select('*')
      .eq('branch_id', branchId)
      .eq('customer_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let room = existingRoom;
    let isNew = false;

    if (!room) {
      const { data: createdRoom, error: createError } = await supabase
        .from('branch_chat_rooms')
        .insert({
          branch_id: branchId,
          customer_id: userId,
          subject: subject || `Support inquiry for ${branch.name}`,
          last_message_at: new Date().toISOString()
        })
        .select(DEFAULT_SELECT_FIELDS)
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      room = createdRoom;
      isNew = true;
    }

    let firstMessage = null;

    if (initialMessage && initialMessage.trim().length > 0) {
      firstMessage = await appendMessage({
        roomId: room.id,
        senderId: userId,
        senderType: 'customer',
        message: initialMessage.trim(),
        messageType: 'text'
      });

      const { data: refreshedRoom } = await supabase
        .from('branch_chat_rooms')
        .select(DEFAULT_SELECT_FIELDS)
        .eq('id', room.id)
        .single();

      if (refreshedRoom) {
        room = refreshedRoom;
      }
    }

    res.json({
      room,
      branch,
      isNew,
      initialMessage: firstMessage
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to open chat room' });
  }
});

router.get('/rooms/customer', authenticateSupabaseToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('branch_chat_rooms')
      .select(`${DEFAULT_SELECT_FIELDS}`)
      .eq('customer_id', req.user.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ rooms: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load branch chats' });
  }
});

router.get('/rooms/admin', authenticateSupabaseToken, async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({ error: 'Admin or owner access required' });
    }

    const statusFilter = req.query.status;
    const branchFilter = req.query.branchId ? parseInt(req.query.branchId, 10) : null;

    const query = supabase
      .from('branch_chat_rooms')
      .select(`${DEFAULT_SELECT_FIELDS}`)
      .order('last_message_at', { ascending: false });

    if (role === 'admin') {
      if (!req.user.branch_id) {
        return res.status(400).json({ error: 'Admin account is not linked to a branch' });
      }
      query.eq('branch_id', req.user.branch_id);
    } else if (branchFilter) {
      query.eq('branch_id', branchFilter);
    }

    if (statusFilter) {
      query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Fetch customer names from user_profiles and auth.users
    // Note: customer_id in branch_chat_rooms = user_id in user_profiles = id in auth.users
    if (data && data.length > 0) {
      const customerIds = [...new Set(data.map(room => room.customer_id).filter(Boolean))];
      
      if (customerIds.length > 0) {
        const profileMap = new Map();
        
        // Try 1: Get from user_profiles table (where user_id = customer_id)
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', customerIds);

          if (!profilesError && profiles && profiles.length > 0) {
            profiles.forEach(p => {
              if (p.full_name) {
                profileMap.set(p.user_id, p.full_name);
              }
            });
          }
        } catch (profileErr) {
          console.warn('Error fetching user_profiles:', profileErr.message);
        }

        // Try 2: For ALL customers, fetch from auth.users to get real names
        // Priority: full_name > first_name + last_name > username > display_name > email (as last resort)
        try {
          await Promise.all(
            customerIds.map(async (userId) => {
              try {
                const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
                if (!userError && user) {
                  // Only set if we don't already have a name from user_profiles
                  if (!profileMap.has(userId)) {
                    const metadata = user.user_metadata || user.raw_user_meta_data || {};
                    
                    // Priority 1: full_name from metadata
                    let customerName = metadata.full_name || null;
                    
                    // Priority 2: Combine first_name + last_name
                    if (!customerName) {
                      const firstName = metadata.first_name || '';
                      const lastName = metadata.last_name || '';
                      if (firstName && lastName) {
                        customerName = `${firstName} ${lastName}`.trim();
                      } else if (firstName) {
                        customerName = firstName.trim();
                      } else if (lastName) {
                        customerName = lastName.trim();
                      }
                    }
                    
                    // Priority 3: username or display_name
                    if (!customerName) {
                      customerName = metadata.username || metadata.display_name || metadata.name || null;
                    }
                    
                    // Priority 4: Extract name from email (e.g., "john.doe@email.com" -> "John Doe")
                    if (!customerName && user.email) {
                      const emailParts = user.email.split('@')[0];
                      // Try to extract name if email format is "firstname.lastname" or "firstname_lastname"
                      if (emailParts.includes('.') || emailParts.includes('_')) {
                        const separator = emailParts.includes('.') ? '.' : '_';
                        const parts = emailParts.split(separator);
                        if (parts.length >= 2) {
                          // Capitalize first letter of each part
                          customerName = parts.map(part => 
                            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                          ).join(' ');
                        }
                      }
                    }
                    
                    // Last resort: Use email (but format it nicely)
                    if (!customerName && user.email) {
                      // Extract the part before @ and capitalize it
                      const emailName = user.email.split('@')[0];
                      customerName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                    }
                    
                    if (customerName) {
                      profileMap.set(userId, customerName);
                    }
                  }
                } else if (userError) {
                  console.warn(`Could not fetch user ${userId}:`, userError.message);
                }
              } catch (authError) {
                console.warn(`Error fetching user data for ${userId}:`, authError.message);
              }
            })
          );
        } catch (authErr) {
          console.warn('Error in auth.users lookup:', authErr.message);
        }
        
        // Add customer name to each room - should always have at least email now
        data.forEach(room => {
          room.customer_name = profileMap.get(room.customer_id) || null;
        });
      }
    }

    res.json({ rooms: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load branch chats' });
  }
});

router.get('/rooms/:roomId/messages', authenticateSupabaseToken, async (req, res) => {
  try {
    await getRoomForUser(req.params.roomId, req.user);

    const { data, error } = await supabase
      .from('branch_chat_messages')
      .select('*')
      .eq('room_id', req.params.roomId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ messages: data || [] });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to load messages' });
  }
});

router.post('/rooms/:roomId/messages', authenticateSupabaseToken, async (req, res) => {
  try {
    const { message, messageType, attachments } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const room = await getRoomForUser(req.params.roomId, req.user);
    const role = req.user.role;
    const senderType = role === 'customer' ? 'customer' : 'admin';

    const inserted = await appendMessage({
      roomId: room.id,
      senderId: req.user.id,
      senderType,
      message: message.trim(),
      messageType: messageType || 'text',
      attachments: Array.isArray(attachments) ? attachments : []
    });

    res.json({ message: inserted });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to send message' });
  }
});

router.post('/rooms/:roomId/mark-read', authenticateSupabaseToken, async (req, res) => {
  try {
    await getRoomForUser(req.params.roomId, req.user);

    await supabase
      .from('branch_chat_messages')
      .update({ is_read: true })
      .eq('room_id', req.params.roomId)
      .neq('sender_id', req.user.id);

    res.json({ success: true });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to mark messages as read' });
  }
});

router.post('/rooms/:roomId/close', authenticateSupabaseToken, async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({ error: 'Admin or owner access required' });
    }

    const room = await getRoomForUser(req.params.roomId, req.user);

    await supabase
      .from('branch_chat_rooms')
      .update({ status: 'closed' })
      .eq('id', room.id);

    res.json({ success: true });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to close chat room' });
  }
});

module.exports = router;


