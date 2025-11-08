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


