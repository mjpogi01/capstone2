import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ArtistChatModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faPaperclip, 
  faTimes, 
  faUser,
  faFile,
  faTimes as faX,
  faSpinner,
  faEye,
  faUpload,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ArtistChatModal = ({ room, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFiles, setReviewFiles] = useState([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const reviewFileInputRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔧 Initializing chat for room:', room.id);
      
      // Get customer information
      const { data: customerData } = await supabase
        .from('user_profiles')
        .select('full_name, phone')
        .eq('user_id', room.customer_id)
        .single();

      console.log('👤 Customer data:', customerData);
      if (customerData) {
        setCustomer(customerData);
      }
      
      // Load messages
      console.log('📥 Loading messages for room:', room.id);
      const messagesData = await chatService.getChatRoomMessages(room.id);
      console.log('📥 Loaded messages:', messagesData);
      
      const messagesWithSenders = (messagesData || []).map(msg => ({
        ...msg,
        sender_name: msg.sender_type === 'artist' ? 'You' : (customerData?.full_name || 'Customer')
      }));
      console.log('📥 Messages with senders:', messagesWithSenders);
      console.log('📥 Setting messages state with count:', messagesWithSenders.length);
      setMessages(messagesWithSenders);
      
      // Mark messages as read
      await chatService.markMessagesAsRead(room.id, user.id);
      
      // Subscribe to new messages
      console.log('🔔 Setting up real-time subscription for room:', room.id);
      const subscription = chatService.subscribeToChatRoom(room.id, (payload) => {
        console.log('📨 Real-time message received:', payload);
        if (payload.new) {
          const messageWithSender = {
            ...payload.new,
            sender_name: payload.new.sender_type === 'artist' ? 'You' : (customerData?.full_name || 'Customer')
          };
          console.log('📨 Adding new message to state:', messageWithSender);
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              console.log('📨 Message added to state, new count:', prev.length + 1);
              return [...prev, messageWithSender];
            }
            console.log('📨 Message already exists, not adding');
            return prev;
          });
          chatService.markMessagesAsRead(room.id, user.id);
        }
      });

      return () => {
        console.log('🔔 Unsubscribing from room:', room.id);
        subscription.unsubscribe();
      };
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert('Error loading chat: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [room, user]);

  useEffect(() => {
    if (isOpen && room) {
      initializeChat();
    }
  }, [isOpen, room, initializeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      setSending(true);
      console.log('📤 Sending message:', {
        roomId: room.id,
        userId: user.id,
        message: newMessage.trim(),
        attachments: attachments
      });
      
      await chatService.sendMessage(
        room.id, 
        user.id, 
        'artist', 
        newMessage.trim(), 
        'text', 
        attachments
      );
      
      console.log('✅ Message sent successfully');
      setNewMessage('');
      setAttachments([]);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return {
          name: file.name,
          url: data.url,
          type: file.type,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await response.json();
        return {
          name: file.name,
          url: data.url,
          type: file.type,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setReviewFiles(prev => [...prev, ...uploadedFiles]);
      
    } catch (error) {
      console.error('Error uploading review files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeReviewFile = (index) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (reviewFiles.length === 0) {
      alert('Please upload at least one design file for review.');
      return;
    }

    try {
      setSubmittingReview(true);
      
      // Submit review request with files and notes

      await chatService.sendMessage(
        room.id,
        user.id,
        'artist',
        `Design Review Request\n\n${reviewNotes || 'Please review the attached design files and provide your feedback.'}`,
        'review_request',
        reviewFiles
      );

      // Close review modal and reset state
      setShowReviewModal(false);
      setReviewFiles([]);
      setReviewNotes('');
      
      alert('Review request sent successfully! The customer will be notified.');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review request. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !room) return null;

  return (
    <div className="artist-chat-modal-overlay" onClick={onClose}>
      <div className="artist-chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>
              <FontAwesomeIcon icon={faUser} />
              {customer?.full_name || 'Customer'}
            </h3>
            <p>Order: {room.room_name}</p>
          </div>
          <button className="artist-chat-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {loading ? (
            <div className="artist-chat-loading-messages">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Loading messages...</span>
            </div>
          ) : (
            <>
              {console.log('🎨 Rendering messages, count:', messages.length)}
              {messages.map((message) => {
                console.log('🎨 Rendering message:', message.id, message.message);
                return (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender_type === 'artist' ? 'sent' : 'received'}`}
                  >
                  <div className="message-content">
                    <div className="message-header">
                      <span className="sender-name">{message.sender_name}</span>
                      <span className="message-time">{formatTime(message.created_at)}</span>
                    </div>
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          try {
                            if (typeof message.message === 'string' && message.message.startsWith('{')) {
                              const parsed = JSON.parse(message.message);
                              const text = parsed.message || message.message;
                              return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                            }
                            return message.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                          } catch (e) {
                            return message.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                          }
                        })()
                      }}
                    />
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="attachment">
                            {attachment.type.startsWith('image/') ? (
                              <div className="image-attachment">
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  onClick={() => window.open(attachment.url, '_blank')}
                                />
                                <span className="attachment-name">{attachment.name}</span>
                              </div>
                            ) : (
                              <div className="file-attachment">
                                <FontAwesomeIcon icon={faFile} />
                                <span className="attachment-name">{attachment.name}</span>
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="download-link"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Floating Ask for Review Button */}
        {isOpen && !showReviewModal && (
          <button 
            className="artist-review-fab"
            onClick={() => setShowReviewModal(true)}
            title="Submit design for customer review"
          >
            <FontAwesomeIcon icon={faClipboardCheck} />
            Ask for Review
          </button>
        )}

        {/* Message Input */}
        <div className="chat-input">
          
          {attachments.length > 0 && (
            <div className="attachments-preview">
              {attachments.map((attachment, index) => (
                <div key={index} className="attachment-preview">
                  {attachment.type.startsWith('image/') ? (
                    <img src={attachment.url} alt={attachment.name} />
                  ) : (
                    <FontAwesomeIcon icon={faFile} />
                  )}
                  <span>{attachment.name}</span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="remove-attachment"
                  >
                    <FontAwesomeIcon icon={faX} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="artist-chat-input-group">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              
              <button
                type="button"
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
                placeholder="Type your message..."
                className="message-input"
                disabled={sending}
              />
              
              <button
                type="submit"
                className="send-btn"
                disabled={sending || (!newMessage.trim() && attachments.length === 0)}
              >
                {sending ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Artist Review Modal */}
        {showReviewModal && (
          <div className="artist-review-modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="artist-review-modal" onClick={(e) => e.stopPropagation()}>
              <div className="artist-review-modal-header">
                <h3>
                  <FontAwesomeIcon icon={faClipboardCheck} />
                  Submit Design for Review
                </h3>
                <button 
                  className="artist-chat-close-btn" 
                  onClick={() => setShowReviewModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="artist-review-modal-content">
                <div className="artist-review-instructions">
                  <p>Upload your design files and add notes for the customer to review. They can approve, request changes, or provide feedback.</p>
                </div>

                {/* File Upload Section */}
                <div className="artist-review-file-upload">
                  <h4>Design Files</h4>
                  <div className="artist-file-upload-area">
                    <input
                      type="file"
                      ref={reviewFileInputRef}
                      multiple
                      accept="image/*,.pdf,.ai,.psd,.eps"
                      onChange={(e) => handleReviewFileUpload(e.target.files)}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    
                    <button
                      type="button"
                      className="upload-files-btn"
                      onClick={() => reviewFileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUpload} />
                          Choose Design Files
                        </>
                      )}
                    </button>
                    
                    <p className="upload-hint">
                      Supported formats: JPG, PNG, PDF, AI, PSD, EPS
                    </p>
                  </div>

                  {/* File Preview */}
                  {reviewFiles.length > 0 && (
                    <div className="artist-review-files-preview">
                      <h5>Selected Files:</h5>
                      <div className="files-list">
                        {reviewFiles.map((file, index) => (
                          <div key={index} className="artist-file-item">
                            <div className="artist-file-info">
                              {file.type.startsWith('image/') ? (
                                <img src={file.url} alt={file.name} className="artist-file-thumbnail" />
                              ) : (
                                <FontAwesomeIcon icon={faFile} className="artist-file-icon" />
                              )}
                              <span className="artist-file-name">{file.name}</span>
                            </div>
                            <button 
                              onClick={() => removeReviewFile(index)}
                              className="remove-file-btn"
                            >
                              <FontAwesomeIcon icon={faX} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="artist-review-notes">
                  <h4>Notes for Customer</h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes, instructions, or questions for the customer..."
                    className="artist-notes-textarea"
                    rows={4}
                  />
                </div>
              </div>

              <div className="artist-review-modal-actions">
                <button 
                  className="artist-chat-cancel-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="submit-review-btn"
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewFiles.length === 0}
                >
                  {submittingReview ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faClipboardCheck} />
                      Submit for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistChatModal;