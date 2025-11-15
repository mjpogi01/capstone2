import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './ArtistWorkloadChart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../contexts/AuthContext';
import artistDashboardService from '../../services/artistDashboardService';

const ArtistWorkloadChart = ({ fullWidth = false }) => {
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { user } = useAuth();
  const chartRef = useRef(null);

  const fetchWorkloadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.warn('No user ID available');
        setWorkloadData([]);
        return;
      }

      const data = await artistDashboardService.getArtistWorkload(selectedPeriod);
      setWorkloadData(data);
    } catch (error) {
      console.error('Error fetching workload data:', error);
      setWorkloadData([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    fetchWorkloadData();
  }, [selectedPeriod, fetchWorkloadData]);

  // Handle resize for responsive chart (both window and container resize)
  useEffect(() => {
    if (loading) return; // Don't set up resize handler while loading

    const handleResize = () => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        if (echartsInstance) {
          echartsInstance.resize();
        }
      }
    };

    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Handle container resize using ResizeObserver
    // Wait a bit for the chart to mount
    const timeoutId = setTimeout(() => {
      if (chartRef.current) {
        const chartElement = chartRef.current.ele;
        if (chartElement && window.ResizeObserver) {
          const resizeObserver = new ResizeObserver(() => {
            handleResize();
          });
          resizeObserver.observe(chartElement);
          
          // Store observer for cleanup
          chartRef.current._resizeObserver = resizeObserver;
        }
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      if (chartRef.current?._resizeObserver && chartRef.current.ele) {
        chartRef.current._resizeObserver.unobserve(chartRef.current.ele);
      }
    };
  }, [loading, workloadData]); // Re-run when loading completes or data changes

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  const chartOption = useMemo(() => {
    if (!workloadData || workloadData.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#999',
            fontSize: 14
          }
        }
      };
    }

    const dates = workloadData.map(d => formatDate(d.date));
    const pendingData = workloadData.map(d => d.pending || 0);
    const inProgressData = workloadData.map(d => d.in_progress || 0);
    const completedData = workloadData.map(d => d.completed || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].axisValue + '<br/>';
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Pending', 'In Progress', 'Completed'],
        bottom: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 11,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11
        }
      },
      series: [
        {
          name: 'Pending',
          type: 'bar',
          stack: 'tasks',
          data: pendingData,
          itemStyle: {
            color: '#6b7280'
          }
        },
        {
          name: 'In Progress',
          type: 'bar',
          stack: 'tasks',
          data: inProgressData,
          itemStyle: {
            color: '#2563eb'
          }
        },
        {
          name: 'Completed',
          type: 'bar',
          stack: 'tasks',
          data: completedData,
          itemStyle: {
            color: '#059669'
          }
        }
      ]
    };
  }, [workloadData]);

  if (loading) {
    return (
      <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
        <div className="chart-header">
          <h3><FontAwesomeIcon icon={faChartBar} /> Workload Overview</h3>
        </div>
        <div className="loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
      <div className="chart-header">
        <h3><FontAwesomeIcon icon={faChartBar} /> Workload Overview</h3>
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
        <div className="chart-visualization">
          <ReactECharts
            ref={chartRef}
            option={chartOption}
            style={{ width: '100%', height: '100%', minHeight: '250px' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
            lazyUpdate={true}
          />
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
    </div>
  );
};

export default ArtistWorkloadChart;
