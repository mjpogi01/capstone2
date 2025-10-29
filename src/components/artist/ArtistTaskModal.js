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
        {/* Header */}
        <div className="modal-header">
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
          {/* Product Images Section */}
          {images.length > 0 && (
            <div className="product-images-section">
              <h4>
                <FontAwesomeIcon icon={faImage} />
                Product Reference
              </h4>
              <div className="product-image-gallery">
                <div className="main-image">
                  <img 
                    src={images[activeImageIndex]} 
                    alt="Product reference"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="image-thumbnails">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`Product ${index + 1}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Information */}
          {task.products && (
            <div className="product-info-section">
              <h4>
                <FontAwesomeIcon icon={faShoppingCart} />
                Product Details
              </h4>
              <div className="product-details">
                <div className="product-name">{task.products.name}</div>
                <div className="product-meta">
                  <span className="product-category">{task.products.category}</span>
                  <span className="product-price">${task.products.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="order-items-section">
              <h4>
                <FontAwesomeIcon icon={faShoppingCart} />
                Order Items
              </h4>
              <div className="order-items-list">
                {orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name || item.product_name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                    {item.size && (
                      <span className="item-size">Size: {item.size}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Information */}
          <div className="task-info-section">
            <h4>
              <FontAwesomeIcon icon={faEdit} />
              Task Details
            </h4>
            <div className="task-details-grid">
              <div className="detail-item">
                <label>
                  <FontAwesomeIcon icon={faInfoCircle} />
                  Description
                </label>
                <p>{task.task_description}</p>
              </div>
              
              <div className="detail-item">
                <label>
                  <FontAwesomeIcon icon={faTag} />
                  Order Type
                </label>
                <span className={`order-type-badge ${task.order_type}`}>
                  {task.order_type.replace('_', ' ')}
                </span>
              </div>
              
              <div className="detail-item">
                <label>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Deadline
                </label>
                <span className="deadline-text">{formatDate(task.deadline)}</span>
              </div>

              {task.design_requirements && (
                <div className="detail-item full-width">
                  <label>
                    <FontAwesomeIcon icon={faEdit} />
                    Design Requirements
                  </label>
                  <p>{task.design_requirements}</p>
                </div>
              )}

              {task.artist_notes && (
                <div className="detail-item full-width">
                  <label>
                    <FontAwesomeIcon icon={faEdit} />
                    Your Notes
                  </label>
                  <p>{task.artist_notes}</p>
                </div>
              )}

              {task.admin_notes && (
                <div className="detail-item full-width">
                  <label>
                    <FontAwesomeIcon icon={faInfoCircle} />
                    Admin Notes
                  </label>
                  <p>{task.admin_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <h4>
              <FontAwesomeIcon icon={faComments} />
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
              <FontAwesomeIcon icon={faEdit} />
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
