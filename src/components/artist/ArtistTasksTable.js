import React, { useState, useEffect, useCallback } from 'react';
import './ArtistTasksTable.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faUpload, 
  faCheck,
  faClock,
  faExclamationTriangle,
  faInfoCircle,
  faTasks,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import artistDashboardService from '../../services/artistDashboardService';
import ArtistTaskModal from './ArtistTaskModal';
import ArtistChatModal from './ArtistChatModal';
import chatService from '../../services/chatService';

const ArtistTasksTable = ({ limit = null, showHeader = false }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { user } = useAuth();

  const fetchArtistTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available');
        setTasks([]);
        return;
      }

      // Fetch tasks for this artist
      const tasksData = await artistDashboardService.getArtistTasks(limit);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching artist tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchArtistTasks();
  }, [user, fetchArtistTasks]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await artistDashboardService.updateTaskStatus(taskId, newStatus);
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
      
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleOpenChat = async (task) => {
    try {
      // Get the chat room for this order
      const chatRoom = await chatService.getChatRoomByOrder(task.order_id);
      
      if (chatRoom) {
        setSelectedChatRoom(chatRoom);
        setShowChatModal(true);
      } else {
        alert('No chat room found for this order');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="artist-tasks-table">
        {showHeader && (
          <div className="table-header">
            <h3>Recent Tasks</h3>
          </div>
        )}
        <div className="loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div className="artist-tasks-table">
      {showHeader && (
        <div className="table-header">
          <h3>Recent Tasks</h3>
          <button className="view-all-btn">View All</button>
        </div>
      )}
      
      <div className="tasks-container">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <FontAwesomeIcon icon={faTasks} />
            <p>No tasks assigned yet</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-item ${task.status}`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="task-header">
                  <div className="task-title">{task.task_title}</div>
                  <div className={`task-priority ${task.priority}`}>
                    <FontAwesomeIcon icon={getPriorityIcon(task.priority)} />
                    {task.priority}
                  </div>
                </div>
                
                <div className="task-details">
                  <div className="task-description">{task.task_description}</div>
                  <div className="task-meta">
                    <span className="task-type">{task.order_type.replace('_', ' ')}</span>
                    <span className="task-deadline">
                      Due: {formatDate(task.deadline)}
                    </span>
                  </div>
                </div>
                
                <div className="task-footer">
                  <div className={`task-status ${task.status}`}>
                    <FontAwesomeIcon icon={getStatusIcon(task.status)} />
                    {task.status.replace('_', ' ')}
                  </div>
                  <div className="task-actions">
                    <button 
                      className="action-btn chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(task);
                      }}
                      title="Open Chat"
                    >
                      <FontAwesomeIcon icon={faComments} />
                    </button>
                    <button 
                      className="action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Task Modal */}
      <ArtistTaskModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onStatusUpdate={handleStatusUpdate}
        onOpenChat={handleOpenChat}
      />

      {/* Chat Modal */}
      <ArtistChatModal
        room={selectedChatRoom}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
};

export default ArtistTasksTable;
