import React, { useState, useEffect } from 'react';
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
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import artistService from '../../services/artistService';
import { supabase } from '../../lib/supabase';

const ArtistTasksTable = ({ limit = null, showHeader = false }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchArtistTasks();
  }, [user]);

  const fetchArtistTasks = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available');
        setTasks([]);
        return;
      }

      // Get artist profile first to get the artist_id
      const { data: artistProfile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !artistProfile) {
        console.error('Error fetching artist profile:', profileError);
        setTasks([]);
        return;
      }

      // Fetch tasks for this artist
      const tasksData = await artistService.getArtistTasks(artistProfile.id);
      const limitedTasks = limit ? tasksData.slice(0, limit) : tasksData;
      setTasks(limitedTasks);
    } catch (error) {
      console.error('Error fetching artist tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
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
      await artistService.updateTaskStatus(taskId, newStatus);
      
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
                      className="action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
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

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <div className="task-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTask.task_title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTaskModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="task-info">
                <div className="info-row">
                  <label>Description:</label>
                  <p>{selectedTask.task_description}</p>
                </div>
                <div className="info-row">
                  <label>Order Type:</label>
                  <span className={`order-type ${selectedTask.order_type}`}>
                    {selectedTask.order_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="info-row">
                  <label>Priority:</label>
                  <span className={`priority ${selectedTask.priority}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="info-row">
                  <label>Deadline:</label>
                  <span>{formatDate(selectedTask.deadline)}</span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span className={`status ${selectedTask.status}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="modal-actions">
                {selectedTask.status === 'pending' && (
                  <button 
                    className="action-btn start-btn"
                    onClick={() => handleStatusUpdate(selectedTask.id, 'in_progress')}
                  >
                    Start Task
                  </button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <button 
                    className="action-btn submit-btn"
                    onClick={() => handleStatusUpdate(selectedTask.id, 'submitted')}
                  >
                    Submit for Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistTasksTable;
