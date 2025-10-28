const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
require('dotenv').config();

// Create Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create chat room
router.post('/create-room', async (req, res) => {
  try {
    const { order_id, customer_id, artist_id, room_name } = req.body;

    // Check if room already exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('design_chat_rooms')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existingRoom) {
      return res.json({ room_id: existingRoom.id });
    }

    // Create new room
    const { data, error } = await supabase
      .from('design_chat_rooms')
      .insert({
        order_id,
        customer_id,
        artist_id,
        room_name
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat room:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ room_id: data.id });
  } catch (error) {
    console.error('Error in create-room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/send-message', async (req, res) => {
  try {
    const { room_id, sender_id, sender_type, message, message_type, attachments } = req.body;

    const { data, error } = await supabase
      .from('design_chat_messages')
      .insert({
        room_id,
        sender_id,
        sender_type,
        message,
        message_type: message_type || 'text',
        attachments: attachments || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message_id: data.id });
  } catch (error) {
    console.error('Error in send-message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat room messages
router.get('/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data, error } = await supabase
      .from('design_chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting messages:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ messages: data || [] });
  } catch (error) {
    console.error('Error in get-messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer chat rooms
router.get('/customer-rooms/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data, error } = await supabase
      .from('design_chat_rooms')
      .select('*')
      .eq('customer_id', customerId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error getting customer rooms:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ rooms: data || [] });
  } catch (error) {
    console.error('Error in get-customer-rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get artist chat rooms
router.get('/artist-rooms/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;

    const { data, error } = await supabase
      .from('design_chat_rooms')
      .select('*')
      .eq('artist_id', artistId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error getting artist rooms:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ rooms: data || [] });
  } catch (error) {
    console.error('Error in get-artist-rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.post('/mark-read', async (req, res) => {
  try {
    const { room_id, user_id } = req.body;

    const { error } = await supabase
      .from('design_chat_messages')
      .update({ is_read: true })
      .eq('room_id', room_id)
      .neq('sender_id', user_id);

    if (error) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in mark-read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat room by order ID
router.get('/room-by-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from('design_chat_rooms')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Room not found' });
      }
      console.error('Error getting room by order:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ room: data });
  } catch (error) {
    console.error('Error in get-room-by-order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update room
router.post('/update-room', async (req, res) => {
  try {
    const { room_id, last_message_at } = req.body;

    const { error } = await supabase
      .from('design_chat_rooms')
      .update({ last_message_at })
      .eq('id', room_id);

    if (error) {
      console.error('Error updating room:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in update-room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Close chat room
router.post('/close-room', async (req, res) => {
  try {
    const { room_id } = req.body;

    const { error } = await supabase
      .from('design_chat_rooms')
      .update({ status: 'closed' })
      .eq('id', room_id);

    if (error) {
      console.error('Error closing room:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in close-room:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
