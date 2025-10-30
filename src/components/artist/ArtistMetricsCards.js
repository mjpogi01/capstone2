import React, { useState, useEffect, useCallback } from 'react';
import './ArtistMetricsCards.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, 
  faClock, 
  faCheckCircle, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import artistDashboardService from '../../services/artistDashboardService';

const ArtistMetricsCards = () => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchArtistMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available');
        setMetrics({
          totalTasks: 0,
          pendingTasks: 0,
          completedTasks: 0,
          completionRate: 0
        });
        return;
      }

      const metricsData = await artistDashboardService.getArtistMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching artist metrics:', error);
      // Set default values on error
      setMetrics({
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArtistMetrics();
  }, [user, fetchArtistMetrics]);

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
