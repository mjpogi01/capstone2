import React, { useState, useEffect, useRef } from 'react';
import './DesignChat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faPaperclip, 
  faTimes, 
  faUser,
  faImage,
  faFile,
  faCheck,
  faTimes as faX,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DesignChat = ({ orderId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [assignedArtist, setAssignedArtist] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && orderId) {
      initializeChat();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get assigned artist for this order
      const artist = await chatService.getAssignedArtist(orderId);
      setAssignedArtist(artist);
      
      // Try to get existing chat room
      let room = await chatService.getChatRoomByOrder(orderId);
      
      if (!room) {
        // Create new chat room if it doesn't exist
        // Use the assigned artist ID if available, otherwise use placeholder
        const artistId = artist?.id || '00000000-0000-0000-0000-000000000001';
        
        const roomId = await chatService.createChatRoom(orderId, user.id, artistId);
        room = { id: roomId, order_id: orderId, customer_id: user.id, artist_id: artistId };
      }

      setChatRoom(room);
      
      // Load messages
      const messagesData = await chatService.getChatRoomMessages(room.id);
      const messagesWithSenders = (messagesData || []).map(msg => ({
        ...msg,
        sender_name: msg.sender_type === 'customer' ? 'You' : (artist?.artist_name || 'Artist')
      }));
      setMessages(messagesWithSenders);
      
      // Mark messages as read
      await chatService.markMessagesAsRead(room.id, user.id);
      
      // Subscribe to new messages
      const subscription = chatService.subscribeToChatRoom(room.id, (payload) => {
        if (payload.new) {
          // Add sender name for better display
          const messageWithSender = {
            ...payload.new,
            sender_name: payload.new.sender_type === 'customer' ? 'You' : (assignedArtist?.artist_name || 'Artist')
          };
          
          // Only add if it's not already in the messages (avoid duplicates)
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              return [...prev, messageWithSender];
            }
            return prev;
          });
          
          chatService.markMessagesAsRead(room.id, user.id);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert('Error loading chat: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!chatRoom) return;

    try {
      setSending(true);
      
      const messageData = {
        roomId: chatRoom.id,
        senderId: user.id,
        senderType: 'customer',
        message: newMessage.trim(),
        messageType: attachments.length > 0 ? 'file' : 'text',
        attachments: attachments
      };

      // Add message to local state immediately for instant UI feedback
      const tempMessage = {
        id: `temp-${Date.now()}`,
        room_id: messageData.roomId,
        sender_id: messageData.senderId,
        sender_type: messageData.senderType,
        message: messageData.message,
        message_type: messageData.messageType,
        attachments: messageData.attachments,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: 'You' // Temporary name for local display
      };

      // Add to local state immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input immediately
      setNewMessage('');
      setAttachments([]);

      // Send to server
      const messageId = await chatService.sendMessage(
        messageData.roomId,
        messageData.senderId,
        messageData.senderType,
        messageData.message,
        messageData.messageType,
        messageData.attachments
      );

      // Update the temp message with the real ID from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: messageId }
          : msg
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
      
      // Remove the temp message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadPromises = files.map(file => chatService.uploadAttachment(file, chatRoom.id));
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case 'image':
        return faImage;
      case 'file':
        return faFile;
      case 'approval_request':
        return faCheck;
      case 'approval_response':
        return faCheck;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="design-chat-overlay" onClick={handleOverlayClick}>
      <div className="design-chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="design-chat-header">
          <div className="chat-header-info">
            <h3>Design Chat</h3>
            {chatRoom && (
              <p className="chat-order-info">
                Order: {chatRoom.order_id?.substring(0, 8) || 'N/A'} • 
                Artist: {assignedArtist ? assignedArtist.artist_name : 'Not Assigned'}
              </p>
            )}
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="design-chat-body">
          {loading ? (
            <div className="chat-loading">
              <FontAwesomeIcon icon={faSpinner} spin />
              <p>Loading chat...</p>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <FontAwesomeIcon icon={faUser} />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`chat-message ${message.sender_type === 'customer' ? 'customer' : 'artist'}`}
                    >
                      <div className="message-content">
                        <div className="message-header">
                          <span className="sender-name">{message.sender_name}</span>
                          <span className="message-time">{formatTime(message.created_at)}</span>
                        </div>
                        
                        <div className="message-body">
                          {message.message_type !== 'text' && (
                            <div className="message-type-indicator">
                              <FontAwesomeIcon icon={getMessageIcon(message.message_type)} />
                              <span>{message.message_type.replace('_', ' ')}</span>
                            </div>
                          )}
                          
                          {message.message && (
                            <p className="message-text">{message.message}</p>
                          )}
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="message-attachments">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="attachment-item">
                                  <FontAwesomeIcon icon={faFile} />
                                  <span>{attachment.filename}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                {attachments.length > 0 && (
                  <div className="attachments-preview">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="attachment-preview">
                        <FontAwesomeIcon icon={faFile} />
                        <span>{attachment.filename}</span>
                        <button onClick={() => removeAttachment(index)}>
                          <FontAwesomeIcon icon={faX} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="chat-input-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  
                  <button 
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperclip} />
                    )}
                  </button>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="chat-input"
                    disabled={sending}
                  />
                  
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignChat;
