import React, { useState, useEffect } from 'react';
import './ArtistMetricsCards.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, 
  faClock, 
  faCheckCircle, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const ArtistMetricsCards = () => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchArtistMetrics();
  }, [user]);

  const fetchArtistMetrics = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual data from your API
      const mockMetrics = {
        totalTasks: 24,
        pendingTasks: 8,
        completedTasks: 16,
        completionRate: 67
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching artist metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      icon: faTasks,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pending Tasks',
      value: metrics.pendingTasks,
      icon: faClock,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      change: '-3',
      changeType: 'negative'
    },
    {
      title: 'Completed',
      value: metrics.completedTasks,
      icon: faCheckCircle,
      color: '#10b981',
      bgColor: '#d1fae5',
      change: '+8',
      changeType: 'positive'
    },
    {
      title: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: faChartLine,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  if (loading) {
    return (
      <div className="metrics-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card loading-skeleton">
            <div className="card-content">
              <div className="card-icon loading-skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
              <div className="card-info">
                <div className="card-title loading-skeleton" style={{ width: '80px', height: '16px', marginBottom: '8px' }}></div>
                <div className="card-value loading-skeleton" style={{ width: '60px', height: '24px', marginBottom: '4px' }}></div>
                <div className="card-change loading-skeleton" style={{ width: '40px', height: '14px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="metrics-cards">
      {cards.map((card, index) => (
        <div key={index} className="metric-card">
          <div className="card-content">
            <div 
              className="card-icon"
              style={{ 
                backgroundColor: card.bgColor,
                color: card.color 
              }}
            >
              <FontAwesomeIcon icon={card.icon} />
            </div>
            
            <div className="card-info">
              <h3 className="card-title">{card.title}</h3>
              <div className="card-value">{card.value}</div>
              <div className={`card-change ${card.changeType}`}>
                {card.change}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArtistMetricsCards;
