import React, { useState, useEffect, useMemo } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { FaChartLine } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './EarningsChart.css';
import '../../pages/admin/Analytics.css';
import { API_URL } from '../../config/api';
import { authFetch } from '../../services/apiClient';

echarts.use([
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  LineChart,
  SVGRenderer
]);

const EarningsChart = ({ selectedBranchId = null, isValuesVisible = true, onToggleValues }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const [allMonthlyData, setAllMonthlyData] = useState([]);

  // Fetch monthly sales data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        let url = `${API_URL}/api/analytics/dashboard`;
        
        // Include branch_id if provided (only for owners selecting a specific branch)
        // For admins, the backend automatically filters by their branch_id from user metadata
        // Don't pass branch_id for admins - it causes SQL errors because orders table uses pickup_branch_id
        if (selectedBranchId) {
          url += `?branch_id=${encodeURIComponent(selectedBranchId)}`;
        }
        
        const response = await authFetch(url);
        const result = await response.json();
        
        if (result.success && result.data?.salesOverTime?.monthly) {
          // Store all monthly data
          const allData = result.data.salesOverTime.monthly;
          setAllMonthlyData(allData);
          
          // Filter data for selected year
          const yearData = allData.filter(item => item.year === selectedYear);
          
          // Sort by month
          yearData.sort((a, b) => a.month - b.month);
          
          setMonthlyData(yearData);
        } else {
          setAllMonthlyData([]);
          setMonthlyData([]);
        }
      } catch (error) {
        console.error('Error fetching monthly sales data:', error);
        setAllMonthlyData([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedYear, selectedBranchId]);

  // Get available years from all data
  const availableYears = useMemo(() => {
    if (!allMonthlyData.length) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    }
    
    const years = new Set();
    allMonthlyData.forEach(item => {
      if (item.year) years.add(item.year);
    });
    
    const yearsArray = Array.from(years).sort((a, b) => b - a);
    if (yearsArray.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    }
    return yearsArray;
  }, [allMonthlyData]);

  // Prepare chart data
  const chartOption = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create data for all 12 months
    const fullYearData = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const monthData = monthlyData.find(item => item.month === monthIndex);
      return monthData ? monthData.sales : 0;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params) => {
          if (!isValuesVisible) {
            return '';
          }
          const param = params[0];
          const monthIndex = param.dataIndex;
          const monthName = months[monthIndex];
          const value = param.value;
          return `${monthName}<br/>${formatCurrency(value)}`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 12
        },
        padding: [8, 12]
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
        axisLine: {
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: isValuesVisible ? (value) => {
            if (value >= 1000) {
              return `₱${(value / 1000).toFixed(0)}k`;
            }
            return `₱${value}`;
          } : () => '•••'
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Sales',
          type: 'line',
          smooth: true,
          data: fullYearData,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.05)'
                }
              ]
            }
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#ffffff'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            itemStyle: {
              color: '#1d4ed8',
              borderColor: '#ffffff',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.5)'
            },
            symbolSize: 8
          }
        }
      ]
    };
  }, [monthlyData, isValuesVisible]);

  const chartHeights = {
    base: '300px'
  };

  return (
    <div className="analytics-card geo-distribution-card">
      <div className="card-header">
        <FaChartLine className="card-icon" />
        <h3>Sales</h3>
        <div className="card-controls">
          {onToggleValues && (
            <button
              className="dashboard1-chart-toggle-btn"
              onClick={onToggleValues}
              title={isValuesVisible ? 'Hide values' : 'Show values'}
              aria-label={isValuesVisible ? 'Hide values' : 'Show values'}
            >
              <FontAwesomeIcon 
                icon={isValuesVisible ? faEyeSlash : faEye} 
                className="dashboard1-chart-toggle-icon"
              />
            </button>
          )}
          <select 
            className="time-range-btn year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="chart-container">
        {loading ? (
          <div className="analytics-loading-inline">
            <div className="loading-spinner"></div>
            <p>Loading sales data...</p>
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="chart-empty-state">
            <p>No sales data available</p>
          </div>
        ) : (
          <>
            <ReactEChartsCore
              echarts={echarts}
              option={chartOption}
              notMerge
              lazyUpdate
              opts={{ renderer: 'svg' }}
              style={{ height: chartHeights.base, width: '100%' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EarningsChart;
