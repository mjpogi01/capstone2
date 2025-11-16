import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './ArtistWorkloadChart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../contexts/AuthContext';
import artistDashboardService from '../../services/artistDashboardService';

const ArtistWorkloadChart = ({ fullWidth = false, showHeader = true, period = null, onPeriodChange = null, onSummaryChange = null }) => {
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [hoveredIndex, setHoveredIndex] = useState(null);
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
    // keep internal state in sync when controlled period provided
    if (period && period !== selectedPeriod) {
      setSelectedPeriod(period);
    }
  }, [period]);

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

  const dates = useMemo(() => workloadData.map(d => formatDate(d.date)), [workloadData]);
  const pendingData = useMemo(() => workloadData.map(d => d.pending || 0), [workloadData]);
  const inProgressData = useMemo(() => workloadData.map(d => d.in_progress || 0), [workloadData]);
  const completedData = useMemo(() => workloadData.map(d => d.completed || 0), [workloadData]);
  const totals = useMemo(
    () => workloadData.map(d => (d.pending || 0) + (d.in_progress || 0) + (d.completed || 0)),
    [workloadData]
  );
  const completionRates = useMemo(
    () => workloadData.map(d => {
      const total = (d.pending || 0) + (d.in_progress || 0) + (d.completed || 0);
      return total > 0 ? Math.round(((d.completed || 0) / total) * 100) : 0;
    }),
    [workloadData]
  );

  const getSummaryIndex = () => {
    if (hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < workloadData.length) {
      return hoveredIndex;
    }
    return workloadData.length > 0 ? workloadData.length - 1 : 0;
  };

  const summaryIndex = getSummaryIndex();
  const summaryTotal = totals[summaryIndex] || 0;
  const summaryRate = completionRates[summaryIndex] || 0;
  const summaryDate = dates[summaryIndex] || '';

  // Notify parent (dashboard) about current summary so it can render externally
  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange({ date: summaryDate, total: summaryTotal, rate: summaryRate });
    }
  }, [summaryDate, summaryTotal, summaryRate, onSummaryChange]);

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

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const xLabel = params[0]?.axisValue || '';
          let result = `<div style="margin-bottom:4px;"><strong>${xLabel}</strong></div>`;
          let pending = 0, inProg = 0, completed = 0;
          params.forEach(p => {
            result += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
            if (p.seriesName === 'Pending') pending = p.value || 0;
            if (p.seriesName === 'In Progress') inProg = p.value || 0;
            if (p.seriesName === 'Completed') completed = p.value || 0;
          });
          const total = pending + inProg + completed;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
          result += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:6px 0;" />`;
          result += `Total: <strong>${total}</strong><br/>Completion: <strong>${rate}%</strong>`;
          return result;
        }
      },
      legend: {
        data: ['Pending', 'In Progress', 'Completed', 'Completion Rate'],
        bottom: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '22%',
        top: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 11,
          interval: 0,
          rotate: dates.length > 7 ? 30 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            fontSize: 11
          },
          name: 'Tasks',
          nameTextStyle: { padding: [0, 0, 0, 0], color: '#6b7280' },
          splitLine: { lineStyle: { color: '#e5e7eb' } }
        },
        {
          type: 'value',
          axisLabel: {
            fontSize: 11,
            formatter: '{value}%'
          },
          name: 'Completion',
          nameTextStyle: { padding: [0, 0, 0, 0], color: '#6b7280' },
          min: 0,
          max: 100,
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Pending',
          type: 'bar',
          stack: 'tasks',
          data: pendingData,
          barWidth: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#9ca3af' },
                { offset: 1, color: '#6b7280' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: { focus: 'series' }
        },
        {
          name: 'In Progress',
          type: 'bar',
          stack: 'tasks',
          data: inProgressData,
          barWidth: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#2563eb' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: { focus: 'series' }
        },
        {
          name: 'Completed',
          type: 'bar',
          stack: 'tasks',
          data: completedData,
          barWidth: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#059669' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: { focus: 'series' }
        },
        {
          name: 'Completion Rate',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          data: completionRates,
          lineStyle: { width: 3, color: '#7c3aed' },
          itemStyle: { color: '#7c3aed' },
          areaStyle: {
            opacity: 0.08,
            color: '#7c3aed'
          }
        }
      ]
    };
  }, [workloadData]);

  if (loading) {
    return (
      <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
        {showHeader && (
          <div className="chart-header">
            <h3><FontAwesomeIcon icon={faChartBar} /> Workload Overview</h3>
            <div className="chart-controls">
              <select 
                value={period ?? selectedPeriod}
                onChange={(e) => {
                  const value = e.target.value;
                  if (onPeriodChange) onPeriodChange(value);
                  setSelectedPeriod(value);
                }}
                className="period-select"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        )}
        <div className="loading-skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div className={`workload-chart ${fullWidth ? 'full-width' : ''}`}>
      {showHeader && (
        <div className="chart-header">
          <h3><FontAwesomeIcon icon={faChartBar} /> Workload Overview</h3>
          <div className="chart-controls">
            <select 
              value={period ?? selectedPeriod}
              onChange={(e) => {
                const value = e.target.value;
                if (onPeriodChange) onPeriodChange(value);
                setSelectedPeriod(value);
              }}
              className="period-select"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      )}

      <div className="chart-content">
        <div className="chart-visualization">
          <ReactECharts
            ref={chartRef}
            option={chartOption}
            style={{ width: '100%', height: '100%', minHeight: '250px' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
            lazyUpdate={true}
            onEvents={{
              mouseover: (p) => {
                if (typeof p?.dataIndex === 'number') {
                  setHoveredIndex(p.dataIndex);
                  return;
                }
                if (typeof p?.name === 'string') {
                  const idx = dates.indexOf(p.name);
                  if (idx >= 0) setHoveredIndex(idx);
                }
              },
              globalout: () => setHoveredIndex(null),
              click: (p) => {
                if (typeof p?.dataIndex === 'number') {
                  setHoveredIndex(p.dataIndex);
                  return;
                }
                if (p?.componentType === 'xAxis' && typeof p?.value !== 'undefined') {
                  const idx = dates.indexOf(p.value);
                  if (idx >= 0) setHoveredIndex(idx);
                  return;
                }
                if (typeof p?.name === 'string') {
                  const idx = dates.indexOf(p.name);
                  if (idx >= 0) setHoveredIndex(idx);
                }
              },
              updateAxisPointer: (e) => {
                const ax = e?.axesInfo && e.axesInfo[0];
                if (ax) {
                  if (typeof ax?.value !== 'undefined') {
                    const idx = dates.indexOf(ax.value);
                    if (idx >= 0) {
                      setHoveredIndex(idx);
                      return;
                    }
                  }
                  if (typeof ax?.dataIndex === 'number') {
                    setHoveredIndex(ax.dataIndex);
                  }
                }
              }
            }}
          />
        </div>

        {!onSummaryChange && (
          <div className="chart-summary">
            <div className="summary-item">
              <span className="summary-label">Date:</span>
              <span className="summary-value">{summaryDate || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Tasks:</span>
              <span className="summary-value">{summaryTotal}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completion Rate:</span>
              <span className="summary-value">{summaryRate}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistWorkloadChart;
