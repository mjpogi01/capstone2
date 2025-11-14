import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ArtistTaskModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCalendarAlt, 
  faTag, 
  faExclamationTriangle,
  faInfoCircle,
  faCheck,
  faClock,
  faEdit,
  faUpload,
  faImage,
  faShoppingCart,
  faComments,
  faExternalLinkAlt,
  faChevronDown,
  faChevronUp,
  faSpinner,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { FaBasketballBall, FaTrophy, FaTshirt, FaUser, FaUserFriends } from 'react-icons/fa';
import designUploadService from '../../services/designUploadService';
import { useNotification } from '../../contexts/NotificationContext';
import chatService from '../../services/chatService';
import { getApparelSizeVisibility } from '../../utils/orderSizing';

const ArtistTaskModal = ({ task, isOpen, onClose, onStatusUpdate, onOpenChat }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedOrderIndex, setExpandedOrderIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Check if design is approved or review timed out (60 minutes)
  const checkDesignApprovalStatus = useCallback(async (orderId) => {
    if (!orderId) return false;
    
    setCheckingApproval(true);
    try {
      // Get chat room for this order
      const chatRoom = await chatService.getChatRoomByOrder(orderId);
      if (!chatRoom) {
        setIsApproved(false);
        return false; // No chat room means no review request yet
      }

      // Get all messages for the chat room
      const messages = await chatService.getChatRoomMessages(chatRoom.id);
      if (!messages || messages.length === 0) {
        setIsApproved(false);
        return false;
      }

      // Sort messages by created_at to process in chronological order
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      // Find the most recent review_request
      const reviewRequests = sortedMessages.filter(msg => 
        msg.message_type === 'review_request' && msg.sender_type === 'artist'
      );

      if (reviewRequests.length === 0) {
        setIsApproved(false);
        return false; // No review request found
      }

      const mostRecentReviewRequest = reviewRequests[reviewRequests.length - 1];
      const reviewRequestTime = new Date(mostRecentReviewRequest.created_at);
      const now = new Date();
      const sixtyMinutesInMs = 60 * 60 * 1000; // 60 minutes in milliseconds
      const timeSinceRequest = now - reviewRequestTime;

      // Check if there's an approval response after the review request
      const approvalResponse = sortedMessages.find(msg => {
        const msgTime = new Date(msg.created_at);
        return msg.message_type === 'review_response' &&
               msg.sender_type === 'customer' &&
               msgTime > reviewRequestTime &&
               msg.message.toLowerCase().includes('design approved');
      });

      // Return true if:
      // 1. Customer approved the design, OR
      // 2. 60 minutes have passed since review request with no response
      const approved = !!approvalResponse;
      const timedOut = timeSinceRequest >= sixtyMinutesInMs && !approvalResponse;
      const result = approved || timedOut;
      
      setIsApproved(result);
      return result;
    } catch (error) {
      console.error(`Error checking approval status for order ${orderId}:`, error);
      setIsApproved(false);
      return false; // Default to false on error
    } finally {
      setCheckingApproval(false);
    }
  }, []);

  // Check approval status when modal opens or task changes
  useEffect(() => {
    if (isOpen && task && task.order_id && task.status === 'in_progress') {
      checkDesignApprovalStatus(task.order_id);
      
      // Set up interval to check every minute (for 60-minute timeout detection)
      const interval = setInterval(() => {
        checkDesignApprovalStatus(task.order_id);
      }, 60 * 1000); // Check every minute

      return () => clearInterval(interval);
    } else {
      setIsApproved(false);
    }
  }, [isOpen, task?.order_id, task?.status, checkDesignApprovalStatus]);

  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return faExclamationTriangle;
      case 'high':
        return faExclamationTriangle;
      case 'medium':
        return faInfoCircle;
      case 'low':
        return faInfoCircle;
      default:
        return faInfoCircle;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return faCheck;
      case 'in_progress':
        return faEdit;
      case 'submitted':
        return faUpload;
      case 'pending':
        return faClock;
      default:
        return faClock;
    }
  };

  const getOrderTypeLabel = (task) => {
    // Combine order_type and order_source to create proper labels
    const orderType = task.order_type || 'regular';
    const orderSource = task.order_source || 'online';
    
    if (orderType === 'custom_design' && orderSource === 'online') {
      return 'Custom-Online';
    } else if (orderType === 'regular' && orderSource === 'online') {
      return 'Store-Online';
    } else if (orderType === 'regular' && orderSource === 'walk_in') {
      return 'Store-Walk-In';
    } else if (orderType === 'walk_in') {
      return 'Store-Walk-In';
    } else if (orderType === 'custom_design') {
      return 'Custom-Online'; // Default for custom_design
    } else {
      return 'Store-Online'; // Default for regular
    }
  };

  const getOrderTypeClass = (task) => {
    // Return CSS class based on order type
    const orderType = task.order_type || 'regular';
    const orderSource = task.order_source || 'online';
    
    if (orderType === 'custom_design') {
      return 'custom_design';
    } else if (orderType === 'walk_in' || (orderType === 'regular' && orderSource === 'walk_in')) {
      return 'walk_in';
    } else {
      return 'regular';
    }
  };

  const getOrderItems = () => {
    if (task.orders?.order_items) {
      try {
        return Array.isArray(task.orders.order_items) 
          ? task.orders.order_items 
          : JSON.parse(task.orders.order_items);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const orderItems = getOrderItems();

  const handleSubmitDesign = () => {
    if (!isApproved) {
      showError('Design must be approved by customer or wait 60 minutes after review request before submitting.');
      return;
    }
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    if (!task.order_id) {
      showError('Order ID not found. Cannot upload design files.');
      return;
    }

    setUploading(true);
    try {
      console.log('🎨 Uploading design files for order:', task.order_id);
      console.log('🎨 Files selected:', files.length);

      // Upload files using designUploadService
      const result = await designUploadService.uploadDesignFiles(task.order_id, files);
      
      console.log('✅ Design files uploaded successfully:', result);
      showSuccess(result.message || 'Design files uploaded successfully and order moved to sizing status');

      // Update task status to submitted after successful upload
      if (onStatusUpdate) {
        await onStatusUpdate(task.id, 'submitted');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('❌ Error uploading design files:', error);
      showError(error.message || 'Failed to upload design files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="artist-task-modal-overlay" onClick={onClose}>
      <div className="artist-task-modal" onClick={(e) => e.stopPropagation()}>
        {/* Integrated Header */}
        <div className="artist-task-modal-header-integrated">
          <div className="artist-task-header-content">
            <h3>{task.task_title}</h3>
            <div className="artist-task-header-badges">
              <span className={`artist-task-priority-badge ${task.priority}`}>
                <FontAwesomeIcon icon={getPriorityIcon(task.priority)} />
                {task.priority.toUpperCase()}
              </span>
              <span className={`artist-task-status-badge ${task.status}`}>
                <FontAwesomeIcon icon={getStatusIcon(task.status)} />
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button className="artist-task-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="artist-task-modal-content">
          <div className="content-body">
            <div className="content-two-column">
              {/* Left Column - Order Details */}
              <div className="content-left-column">
                <div className="task-details-container">
                  <h4 className="section-title">Order Details</h4>
                  
                  {/* Order Type and Deadline */}
                  <div className="artist-order-meta-info">
                    <div className="artist-order-meta-row">
                      <span className="artist-order-meta-label">Order Type:</span>
                      <span className={`artist-order-type-badge ${getOrderTypeClass(task)}`}>
                        {getOrderTypeLabel(task)}
                      </span>
                    </div>
                    <div className="artist-order-meta-row">
                      <span className="artist-order-meta-label">Deadline:</span>
                      <span className="artist-order-meta-value">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="order-details-list">
                    {orderItems.length > 0 ? (
                      orderItems.map((item, index) => {
                        // Determine product category
                        const isBall = item.category?.toLowerCase() === 'balls';
                        const isTrophy = item.category?.toLowerCase() === 'trophies';
                        const isCustomDesign = item.product_type === 'custom_design';
                        const isApparel = !isBall && !isTrophy && !isCustomDesign;
                        const isTeamOrder = item.isTeamOrder || (item.teamMembers && item.teamMembers.length > 0);
                        
                        return (
                          <div key={index} className="artist-order-item-card">
                            <div className="artist-order-item-header">
                              <div className="artist-order-item-image">
                                <img 
                                  src={item.main_image || item.image || item.imageUrl || item.photo || item.image_url || item.product_image || item.thumbnail || '/image_highlights/image.png'} 
                                  alt={item.name}
                                  onError={(e) => {
                                    e.target.src = '/image_highlights/image.png';
                                  }}
                                />
                              </div>
                              <div className="artist-order-item-info">
                                <div className="artist-order-item-name">{item.name}</div>
                                <div className="artist-order-item-category">
                                  {isBall ? (
                                    <><FaBasketballBall /> Basketball</>
                                  ) : isTrophy ? (
                                    <><FaTrophy /> Trophy</>
                                  ) : (
                                    <><FaTshirt /> {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Apparel'}</>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div 
                              className="artist-order-type-toggle"
                              onClick={() => setExpandedOrderIndex(expandedOrderIndex === index ? null : index)}
                            >
                              <div className="artist-order-type-label">
                                {isBall ? (
                                  <><FaBasketballBall /> Ball</>
                                ) : isTrophy ? (
                                  <><FaTrophy /> Trophy</>
                                ) : isTeamOrder ? (
                                  <><FaUserFriends /> Team Order</>
                                ) : (
                                  <><FaUser /> Single Order</>
                                )}
                                <FontAwesomeIcon 
                                  icon={expandedOrderIndex === index ? faChevronUp : faChevronDown} 
                                  className="artist-order-chevron"
                                />
                              </div>
                            </div>
                            {expandedOrderIndex === index && (
                              <div className="artist-order-details-dropdown">
                                {/* Apparel - Team Orders */}
                                {isApparel && isTeamOrder && item.teamMembers && item.teamMembers.length > 0 ? (
                                  <div className="artist-order-team-details">
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Team:</span>
                                      <span className="artist-order-detail-value">{item.teamName || item.team_name || item.teamMembers?.[0]?.teamName || item.teamMembers?.[0]?.team_name || 'N/A'}</span>
                                    </div>
                                    <div className="artist-order-team-divider"></div>
                                    <div className="artist-order-members-list">
                                      {(() => {
                                        const fallbackVisibility = {
                                          jersey: item.teamMembers.some(member => Boolean(member?.jerseySize || member?.size)),
                                          shorts: item.teamMembers.some(member => Boolean(member?.shortsSize))
                                        };
                                        const { showJersey: showTeamJerseySize, showShorts: showTeamShortsSize } = getApparelSizeVisibility(item, fallbackVisibility);
                                        return item.teamMembers.map((member, memberIndex) => (
                                        <div key={memberIndex} className="artist-order-member-item">
                                          <div className="artist-order-detail-row">
                                            <span className="artist-order-detail-label">Surname:</span>
                                            <span className="artist-order-detail-value">{member.surname || member.lastName || 'N/A'}</span>
                                          </div>
                                          <div className="artist-order-detail-row">
                                            <span className="artist-order-detail-label">Jersey No:</span>
                                            <span className="artist-order-detail-value">{member.number || member.jerseyNo || member.jerseyNumber || 'N/A'}</span>
                                          </div>
                                            {showTeamJerseySize && (
                                          <div className="artist-order-detail-row">
                                            <span className="artist-order-detail-label">Jersey Size:</span>
                                            <span className="artist-order-detail-value">{member.jerseySize || member.size || 'N/A'} ({member.sizingType || item.sizeType || 'Adult'})</span>
                                          </div>
                                            )}
                                            {showTeamShortsSize && (
                                          <div className="artist-order-detail-row">
                                            <span className="artist-order-detail-label">Shorts Size:</span>
                                                <span className="artist-order-detail-value">{member.shortsSize || 'N/A'} ({member.sizingType || item.sizeType || 'Adult'})</span>
                                              </div>
                                            )}
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                ) : isApparel ? (
                                  /* Apparel - Single Orders */
                                  <div className="artist-order-single-details">
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Team:</span>
                                      <span className="artist-order-detail-value">{item.singleOrderDetails?.teamName || item.singleOrderDetails?.team_name || item.teamName || 'N/A'}</span>
                                    </div>
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Surname:</span>
                                      <span className="artist-order-detail-value">{item.singleOrderDetails?.surname || item.singleOrderDetails?.lastName || 'N/A'}</span>
                                    </div>
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Jersey No:</span>
                                      <span className="artist-order-detail-value">{item.singleOrderDetails?.number || item.singleOrderDetails?.jerseyNo || item.singleOrderDetails?.jerseyNumber || 'N/A'}</span>
                                    </div>
                                    {(() => {
                                      const fallbackVisibility = {
                                        jersey: Boolean(item.singleOrderDetails?.jerseySize || item.singleOrderDetails?.size || item.size),
                                        shorts: Boolean(item.singleOrderDetails?.shortsSize)
                                      };
                                      const { showJersey: showSingleJerseySize, showShorts: showSingleShortsSize } = getApparelSizeVisibility(item, fallbackVisibility);
                                      return (
                                        <>
                                          {showSingleJerseySize && (
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Jersey Size:</span>
                                      <span className="artist-order-detail-value">{item.singleOrderDetails?.jerseySize || item.singleOrderDetails?.size || item.size || 'N/A'} ({item.singleOrderDetails?.sizingType || item.sizeType || 'Adult'})</span>
                                    </div>
                                          )}
                                          {showSingleShortsSize && (
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Shorts Size:</span>
                                              <span className="artist-order-detail-value">{item.singleOrderDetails?.shortsSize || 'N/A'} ({item.singleOrderDetails?.sizingType || item.sizeType || 'Adult'})</span>
                                    </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : isBall ? (
                                  /* Balls */
                                  <div className="artist-order-ball-details">
                                    {item.ballDetails?.sportType && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Sport:</span>
                                        <span className="artist-order-detail-value">{item.ballDetails.sportType}</span>
                                      </div>
                                    )}
                                    {item.ballDetails?.brand && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Brand:</span>
                                        <span className="artist-order-detail-value">{item.ballDetails.brand}</span>
                                      </div>
                                    )}
                                    {item.ballDetails?.size && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Size:</span>
                                        <span className="artist-order-detail-value">{item.ballDetails.size}</span>
                                      </div>
                                    )}
                                    {item.ballDetails?.material && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Material:</span>
                                        <span className="artist-order-detail-value">{item.ballDetails.material}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isTrophy ? (
                                  /* Trophies */
                                  <div className="artist-order-trophy-details">
                                    {item.trophyDetails?.type && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Type:</span>
                                        <span className="artist-order-detail-value">{item.trophyDetails.type}</span>
                                      </div>
                                    )}
                                    {item.trophyDetails?.size && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Size:</span>
                                        <span className="artist-order-detail-value">{item.trophyDetails.size}</span>
                                      </div>
                                    )}
                                    {item.trophyDetails?.material && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Material:</span>
                                        <span className="artist-order-detail-value">{item.trophyDetails.material}</span>
                                      </div>
                                    )}
                                    {item.trophyDetails?.engraving && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Engraving:</span>
                                        <span className="artist-order-detail-value">{item.trophyDetails.engraving}</span>
                                      </div>
                                    )}
                                    {item.trophyDetails?.occasion && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Occasion:</span>
                                        <span className="artist-order-detail-value">{item.trophyDetails.occasion}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isCustomDesign ? (
                                  /* Custom Design */
                                  <div className="artist-order-custom-details">
                                    <div className="artist-order-detail-row">
                                      <span className="artist-order-detail-label">Order Type:</span>
                                      <span className="artist-order-detail-value">{getOrderTypeLabel(task)}</span>
                                    </div>
                                    {item.name && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Product Name:</span>
                                        <span className="artist-order-detail-value">{item.name}</span>
                                      </div>
                                    )}
                                    {item.quantity && (
                                      <div className="artist-order-detail-row">
                                        <span className="artist-order-detail-label">Quantity:</span>
                                        <span className="artist-order-detail-value">{item.quantity}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="artist-order-empty">
                        <p>No order items found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Customer Communication */}
              <div className="content-right-column">
                <div className="chat-section-container">
                  <h4 className="section-title">
                    <FontAwesomeIcon icon={faComments} className="chat-icon" />
                    Customer Communication
                  </h4>
                  <p className="chat-description">
                    Use the chat feature to communicate with the customer about this order.
                  </p>
                  <button 
                    className="artist-task-chat-btn"
                    onClick={() => onOpenChat && onOpenChat(task)}
                  >
                    <FontAwesomeIcon icon={faComments} />
                    Open Chat
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.ai,.psd,.eps,.svg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Actions */}
        <div className="artist-task-modal-actions">
          <button className="artist-task-action-btn artist-task-secondary-btn" onClick={onClose} disabled={uploading}>
            Close
          </button>
          {task.status === 'pending' && (
            <button 
              className="artist-task-action-btn artist-task-primary-btn"
              onClick={() => onStatusUpdate(task.id, 'in_progress')}
              disabled={uploading}
            >
              <FontAwesomeIcon icon={faCheck} />
              Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <button 
              className={`artist-task-action-btn artist-task-success-btn ${!isApproved ? 'artist-task-btn-disabled' : ''}`}
              onClick={handleSubmitDesign}
              disabled={uploading || !isApproved || checkingApproval}
              title={!isApproved ? 'Design must be approved by customer or wait 60 minutes after review request' : 'Submit design files'}
            >
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Uploading...
                </>
              ) : checkingApproval ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Checking...
                </>
              ) : !isApproved ? (
                <>
                  <FontAwesomeIcon icon={faLock} />
                  Awaiting Approval
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} />
                  Submit Design
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistTaskModal;
