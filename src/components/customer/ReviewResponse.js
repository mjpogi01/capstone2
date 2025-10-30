import React, { useState } from 'react';
import './ReviewResponse.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments, 
  faEye,
  faDownload,
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

const ReviewResponse = ({ reviewMessage, onRespond }) => {
  const [response, setResponse] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  console.log('🎨 ReviewResponse received data:', reviewMessage);
  console.log('🎨 Attachments:', reviewMessage.attachments);

  const handleResponse = (action) => {
    setSelectedAction(action);
    setShowResponseForm(true);
  };

  const handleSubmitResponse = () => {
    if (!response.trim() && selectedAction !== 'approve') {
      alert('Please provide feedback for your response.');
      return;
    }

    onRespond({
      action: selectedAction,
      feedback: response.trim(),
      reviewId: reviewMessage.id
    });

    setResponse('');
    setShowResponseForm(false);
    setSelectedAction('');
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="review-response-container">
      <div className="review-header">
        <div className="review-title-section">
          <h4>Design Review Request</h4>
          <span className="review-timestamp">
            {new Date(reviewMessage.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="review-content">
        <div className="review-message">
          <p dangerouslySetInnerHTML={{
            __html: reviewMessage.message
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br>')
          }} />
        </div>

        {reviewMessage.attachments && reviewMessage.attachments.length > 0 && (
          <div className="review-files">
            <h5>Design Files:</h5>
            <div className="files-grid">
              {reviewMessage.attachments.map((file, index) => (
                <div key={index} className="file-card">
                  <div className="review-file-preview">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="review-file-image"
                      />
                    ) : (
                      <div className="review-file-icon">
                        <FontAwesomeIcon icon={faDownload} />
                      </div>
                    )}
                  </div>
                  <div className="review-file-info">
                    <span className="review-file-name">{file.name}</span>
                    <div className="review-file-actions">
                      <button 
                        className="review-view-btn"
                        onClick={() => window.open(file.url, '_blank')}
                        title="View file"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="review-download-btn"
                        onClick={() => handleDownload(file)}
                        title="Download file"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!showResponseForm ? (
        <div className="review-actions">
          <button 
            className="approve-btn"
            onClick={() => handleResponse('approve')}
          >
            <FontAwesomeIcon icon={faCheck} />
            Approve Design
          </button>
          <button 
            className="request-changes-btn"
            onClick={() => handleResponse('request_changes')}
          >
            <FontAwesomeIcon icon={faTimes} />
            Request Changes
          </button>
          <button 
            className="provide-feedback-btn"
            onClick={() => handleResponse('feedback')}
          >
            <FontAwesomeIcon icon={faComments} />
            Provide Feedback
          </button>
        </div>
      ) : (
        <div className="response-form">
          <div className="response-header">
            <h5>
              {selectedAction === 'approve' && 'Approving Design'}
              {selectedAction === 'request_changes' && 'Requesting Changes'}
              {selectedAction === 'feedback' && 'Providing Feedback'}
            </h5>
            <button 
              className="close-form-btn"
              onClick={() => setShowResponseForm(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="response-content">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={
                selectedAction === 'approve' 
                  ? 'Add any additional comments (optional)...'
                  : selectedAction === 'request_changes'
                  ? 'Please describe what changes you would like...'
                  : 'Please provide your feedback...'
              }
              className="response-textarea"
              rows={4}
            />
            
            <div className="response-actions">
              <button 
                className="cancel-response-btn"
                onClick={() => setShowResponseForm(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-response-btn"
                onClick={handleSubmitResponse}
                disabled={!response.trim() && selectedAction !== 'approve'}
              >
                {selectedAction === 'approve' && 'Approve Design'}
                {selectedAction === 'request_changes' && 'Request Changes'}
                {selectedAction === 'feedback' && 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewResponse;
