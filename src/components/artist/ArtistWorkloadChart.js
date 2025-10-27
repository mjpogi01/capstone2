import React, { useState, useEffect } from 'react';
import './ArtistWorkloadChart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faTasks, 
  faClock, 
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';

const ArtistWorkloadChart = ({ fullWidth = false }) => {
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchWorkloadData();
  }, [selectedPeriod]);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual data from your API
      const mockData = [
        { date: '2024-01-08', pending: 3, in_progress: 2, completed: 5 },
        { date: '2024-01-09', pending: 4, in_progress: 3, completed: 6 },
        { date: '2024-01-10', pending: 2, in_progress: 4, completed: 7 },
        { date: '2024-01-11', pending: 5, in_progress: 2, completed: 8 },
        { date: '2024-01-12', pending: 3, in_progress: 5, completed: 6 },
        { date: '2024-01-13', pending: 2, in_progress: 3, completed: 9 },
        { date: '2024-01-14', pending: 4, in_progress: 4, completed: 7 }
      ];
      
      setWorkloadData(mockData);
    } catch (error) {
      console.error('Error fetching workload data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    return Math.max(...workloadData.flatMap(d => [d.pending, d.in_progress, d.completed]));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getTotalTasks = () => {
    const latest = workloadData[workloadData.length - 1];
    return latest ? latest.pending + latest.in_progress + latest.completed : 0;
  };

  const getCompletionRate = () => {
    const latest = workloadData[workloadData.length - 1];
    if (!latest) return 0;
    const total = latest.pending + latest.in_progress + latest.completed;
    return total > 0 ? Math.round((latest.completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
        <div className="chart-header">
          <h3>Workload Overview</h3>
        </div>
        <div className="loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
      <div className="chart-header">
        <h3>Workload Overview</h3>
        <div className="chart-controls">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      <div className="chart-content">
        <div className="chart-stats">
          <div className="stat-item">
            <div className="stat-icon pending">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{workloadData[workloadData.length - 1]?.pending || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon in-progress">
              <FontAwesomeIcon icon={faTasks} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{workloadData[workloadData.length - 1]?.in_progress || 0}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon completed">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{workloadData[workloadData.length - 1]?.completed || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        <div className="chart-visualization">
          <div className="chart-bars">
            {workloadData.map((data, index) => {
              const maxValue = getMaxValue();
              const pendingHeight = (data.pending / maxValue) * 100;
              const inProgressHeight = (data.in_progress / maxValue) * 100;
              const completedHeight = (data.completed / maxValue) * 100;
              
              return (
                <div key={index} className="bar-group">
                  <div className="bar-container">
                    <div 
                      className="bar pending-bar"
                      style={{ height: `${pendingHeight}%` }}
                      title={`Pending: ${data.pending}`}
                    ></div>
                    <div 
                      className="bar in-progress-bar"
                      style={{ height: `${inProgressHeight}%` }}
                      title={`In Progress: ${data.in_progress}`}
                    ></div>
                    <div 
                      className="bar completed-bar"
                      style={{ height: `${completedHeight}%` }}
                      title={`Completed: ${data.completed}`}
                    ></div>
                  </div>
                  <div className="bar-label">{formatDate(data.date)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Total Tasks:</span>
            <span className="summary-value">{getTotalTasks()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completion Rate:</span>
            <span className="summary-value">{getCompletionRate()}%</span>
          </div>
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span>Pending</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default ArtistWorkloadChart;
