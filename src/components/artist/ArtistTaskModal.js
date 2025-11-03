import React, { useState } from 'react';
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
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';

const ArtistTaskModal = ({ task, isOpen, onClose, onStatusUpdate, onOpenChat }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const getProductImages = () => {
    const images = [];
    if (task.products?.main_image) {
      images.push(task.products.main_image);
    }
    if (task.products?.additional_images) {
      try {
        const additionalImages = Array.isArray(task.products.additional_images) 
          ? task.products.additional_images 
          : JSON.parse(task.products.additional_images);
        images.push(...additionalImages);
      } catch (e) {
        console.error('Error parsing additional images:', e);
      }
    }
    return images.filter(Boolean);
  };

  const images = getProductImages();
  const orderItems = getOrderItems();

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        {/* Integrated Header */}
        <div className="modal-header-integrated">
          <div className="header-content">
            <h3>{task.task_title}</h3>
            <div className="header-badges">
              <span className={`priority-badge ${task.priority}`}>
                <FontAwesomeIcon icon={getPriorityIcon(task.priority)} />
                {task.priority.toUpperCase()}
              </span>
              <span className={`status-badge ${task.status}`}>
                <FontAwesomeIcon icon={getStatusIcon(task.status)} />
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="content-body">
            <div className="content-two-column">
              {/* Left Column - Task Details */}
              <div className="content-left-column">
                <div className="task-details-container">
                  <h4 className="section-title">Task Details</h4>
                  <div className="task-details-fields">
                    <div className="detail-field">
                      <label className="field-label">DESCRIPTION</label>
                      <div className="field-box">{task.task_description || ''}</div>
                    </div>
                    
                    <div className="detail-field">
                      <label className="field-label">ORDER TYPE</label>
                      <div className="field-box">
                        <span className={`order-type-badge ${task.order_type}`}>
                          {task.order_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-field">
                      <label className="field-label">DEADLINE</label>
                      <div className="field-box">{formatDate(task.deadline)}</div>
                    </div>

                    {task.design_requirements && (
                      <div className="detail-field">
                        <label className="field-label">DESIGN REQUIREMENTS</label>
                        <div className="field-box">{task.design_requirements}</div>
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
                    className="chat-btn"
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

        {/* Actions */}
        <div className="modal-actions">
          <button className="action-btn secondary-btn" onClick={onClose}>
            Close
          </button>
          {task.status === 'pending' && (
            <button 
              className="action-btn primary-btn"
              onClick={() => onStatusUpdate(task.id, 'in_progress')}
            >
              <FontAwesomeIcon icon={faCheck} />
              Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <button 
              className="action-btn success-btn"
              onClick={() => onStatusUpdate(task.id, 'submitted')}
            >
              <FontAwesomeIcon icon={faUpload} />
              Submit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistTaskModal;
