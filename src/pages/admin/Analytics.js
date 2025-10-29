import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import '../admin/AdminDashboard.css';
import './admin-shared.css';
import { FaSearch, FaPlay, FaFilter, FaChartLine, FaStore, FaClipboardList, FaTshirt, FaMapMarkerAlt } from 'react-icons/fa';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: [],
    salesByBranch: [],
    orderStatus: {},
    topProducts: []
  });
  const [rawData, setRawData] = useState(null);
  const [geoDistribution, setGeoDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    timeRange: 'all',
    branch: 'all',
    orderStatus: 'all',
    yearStart: '',
    yearEnd: ''
  });
  const filterRef = useRef(null);

  useEffect(() => {
    fetchAnalyticsData();
    fetchGeographicDistribution();
  }, []);

  useEffect(() => {
    if (rawData) {
      applyFilters();
    }
  }, [filters, rawData]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from API
      try {
        const response = await fetch('http://localhost:4000/api/analytics/dashboard');
        const result = await response.json();
        
        console.log('Analytics API Response:', result);
        
        if (result.success && result.data) {
          const hasData = result.data.summary.totalOrders > 0;
          
          // Store raw data for filtering
          setRawData({
            totalSales: result.data.salesOverTime || [],
            salesByBranch: result.data.salesByBranch || [],
            orderStatus: result.data.orderStatus || {},
            topProducts: result.data.topProducts || [],
            summary: result.data.summary,
            hasData
          });
          
          // Initial display (no filters applied)
          setAnalyticsData({
            totalSales: result.data.salesOverTime || [],
            salesByBranch: result.data.salesByBranch || [],
            orderStatus: result.data.orderStatus || {},
            topProducts: hasData && result.data.topProducts.length > 0 
              ? result.data.topProducts.map(product => ({
                  product: product.product,
                  percentage: Math.round((product.quantity / Math.max(...result.data.topProducts.map(p => p.quantity))) * 100)
                }))
              : [],
            summary: result.data.summary,
            hasData
          });
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Don't use mock data, show empty state instead
        setAnalyticsData({
          totalSales: [],
          salesByBranch: [],
          orderStatus: {
            completed: { count: 0, percentage: 0 },
            processing: { count: 0, percentage: 0 },
            pending: { count: 0, percentage: 0 },
            cancelled: { count: 0, percentage: 0 },
            total: 0
          },
          topProducts: [],
          summary: {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0
          },
          hasData: false
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeographicDistribution = async () => {
    try {
      setGeoLoading(true);
      const response = await fetch('http://localhost:4000/api/analytics/geographic-distribution');
      const result = await response.json();
      
      if (result.success && result.data) {
        setGeoDistribution(result.data);
      } else {
        setGeoDistribution([]);
      }
    } catch (error) {
      console.error('Error fetching geographic distribution:', error);
      setGeoDistribution([]);
    } finally {
      setGeoLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
  };

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key]));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: 'all',
      branch: 'all',
      orderStatus: 'all',
      yearStart: '',
      yearEnd: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.timeRange !== 'all' || 
           filters.branch !== 'all' || 
           filters.orderStatus !== 'all' ||
           filters.yearStart !== '' ||
           filters.yearEnd !== '';
  };

  const applyFilters = () => {
    if (!rawData) return;

    console.log('Applying filters:', filters);
    let filtered = { ...rawData };

    // Apply Time Range Filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (filters.timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate && filtered.totalSales) {
        filtered.totalSales = filtered.totalSales.filter(item => {
          const itemDate = new Date(item.date || item.month);
          return itemDate >= startDate;
        });
      }
    }

    // Apply Custom Year Range Filter
    if (filters.yearStart || filters.yearEnd) {
      const startYear = filters.yearStart ? parseInt(filters.yearStart) : 2000;
      const endYear = filters.yearEnd ? parseInt(filters.yearEnd) : 2100;

      if (filtered.totalSales) {
        filtered.totalSales = filtered.totalSales.filter(item => {
          const itemDate = new Date(item.date || item.month);
          const year = itemDate.getFullYear();
          return year >= startYear && year <= endYear;
        });
      }
    }

    // Apply Branch Filter
    if (filters.branch !== 'all' && filtered.salesByBranch) {
      filtered.salesByBranch = filtered.salesByBranch.filter(
        item => item.branch.toLowerCase().replace(/\s+/g, '_') === filters.branch
      );
    }

    // Apply Order Status Filter
    if (filters.orderStatus !== 'all' && filtered.orderStatus) {
      const selectedStatus = filters.orderStatus;
      const statusData = rawData.orderStatus[selectedStatus];
      
      if (statusData) {
        filtered.orderStatus = {
          [selectedStatus]: statusData,
          total: statusData.count
        };
      }
    }

    // Recalculate top products percentages
    if (filtered.topProducts && filtered.topProducts.length > 0) {
      const maxQuantity = Math.max(...filtered.topProducts.map(p => p.quantity || 0));
      filtered.topProducts = filtered.topProducts.map(product => ({
        product: product.product,
        quantity: product.quantity,
        percentage: maxQuantity > 0 ? Math.round((product.quantity / maxQuantity) * 100) : 0
      }));
    }

    // Recalculate summary based on filtered data
    if (filtered.orderStatus) {
      const total = Object.values(filtered.orderStatus)
        .reduce((sum, status) => sum + (typeof status === 'object' ? status.count : 0), 0);
      
      filtered.summary = {
        ...filtered.summary,
        totalOrders: total
      };
    }

    console.log('Filtered data:', filtered);
    setAnalyticsData(filtered);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activePage={'analytics'} 
        setActivePage={() => {}} 
      />
      <div className="admin-main-content">
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>Analytics</h1>
          {hasActiveFilters() && (
            <div className="active-filters-info">
              <span className="filter-count">{
                [
                  filters.timeRange !== 'all',
                  filters.branch !== 'all',
                  filters.orderStatus !== 'all',
                  filters.yearStart !== '' || filters.yearEnd !== ''
                ].filter(Boolean).length
              } filter{[
                filters.timeRange !== 'all',
                filters.branch !== 'all',
                filters.orderStatus !== 'all',
                filters.yearStart !== '' || filters.yearEnd !== ''
              ].filter(Boolean).length !== 1 ? 's' : ''} active</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button className="analyze-btn">
            <FaPlay className="btn-icon" />
            Analyze
          </button>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-wrapper" ref={filterRef}>
            <button 
              className={`filter-btn ${showFilters ? 'active' : ''} ${hasActiveFilters() ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="btn-icon" />
            </button>
            {showFilters && (
              <div className="analytics-filter-dropdown">
                <div className="filter-group">
                  <label>Time Range</label>
                  <select 
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Branch</label>
                  <select 
                    value={filters.branch}
                    onChange={(e) => handleFilterChange('branch', e.target.value)}
                  >
                    <option value="all">All Branches</option>
                    <option value="main">Main Branch</option>
                    <option value="sm_city">SM City</option>
                    <option value="ayala">Ayala Mall</option>
                    <option value="robinson">Robinson's</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Order Status</label>
                  <select 
                    value={filters.orderStatus}
                    onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Custom Year Range</label>
                  <div className="year-range-inputs">
                    <input
                      type="number"
                      placeholder="Start Year"
                      value={filters.yearStart}
                      onChange={(e) => handleFilterChange('yearStart', e.target.value)}
                      min="2000"
                      max="2100"
                      className="year-input"
                    />
                    <span className="year-separator">to</span>
                    <input
                      type="number"
                      placeholder="End Year"
                      value={filters.yearEnd}
                      onChange={(e) => handleFilterChange('yearEnd', e.target.value)}
                      min="2000"
                      max="2100"
                      className="year-input"
                    />
                  </div>
                </div>
                {hasActiveFilters() && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <FaClipboardList />
          </div>
          <div className="summary-content">
            <h3>Total Orders</h3>
            <p className="summary-value">{analyticsData.orderStatus?.total || analyticsData.summary?.totalOrders || 0}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon completed">
            <FaStore />
          </div>
          <div className="summary-content">
            <h3>Completed</h3>
            <p className="summary-value">{analyticsData.orderStatus?.completed?.count || 0}</p>
            <p className="summary-percentage">({analyticsData.orderStatus?.completed?.percentage || 0}%)</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon processing">
            <FaFilter />
          </div>
          <div className="summary-content">
            <h3>Processing</h3>
            <p className="summary-value">{analyticsData.orderStatus?.processing?.count || 0}</p>
            <p className="summary-percentage">({analyticsData.orderStatus?.processing?.percentage || 0}%)</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon pending">
            <FaChartLine />
          </div>
          <div className="summary-content">
            <h3>Pending</h3>
            <p className="summary-value">{analyticsData.orderStatus?.pending?.count || 0}</p>
            <p className="summary-percentage">({analyticsData.orderStatus?.pending?.percentage || 0}%)</p>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Total Sales Over Time */}
        <div className="analytics-card">
          <div className="card-header">
            <FaChartLine className="card-icon" />
            <h3>Total Sales Over Time</h3>
          </div>
          <div className="chart-container">
            {analyticsData.totalSales && analyticsData.totalSales.length > 0 && analyticsData.totalSales.some(item => item.sales > 0) ? (
            <div className="line-chart">
              <svg viewBox="0 0 400 200" className="chart-svg">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <line
                    key={i}
                    x1="40"
                    y1={40 + i * 20}
                    x2="360"
                    y2={40 + i * 20}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <text
                    key={i}
                    x="35"
                    y={45 + i * 20}
                    className="axis-label"
                    textAnchor="end"
                  >
                    {formatNumber(i * 10)}
                  </text>
                ))}
                
                {/* X-axis labels */}
                {analyticsData.totalSales.map((item, index) => (
                  <text
                    key={index}
                    x={40 + (index * 320) / (analyticsData.totalSales.length - 1)}
                    y="195"
                    className="axis-label"
                    textAnchor="middle"
                  >
                    {item.month}
                  </text>
                ))}
                
                {/* Line chart */}
                <path
                  d={`M ${analyticsData.totalSales.map((item, index) => {
                    const x = 40 + (index * 320) / (analyticsData.totalSales.length - 1);
                    const y = 160 - (item.sales / 60000) * 120;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                />
                
                {/* Area fill */}
                <path
                  d={`M 40 160 L ${analyticsData.totalSales.map((item, index) => {
                    const x = 40 + (index * 320) / (analyticsData.totalSales.length - 1);
                    const y = 160 - (item.sales / 60000) * 120;
                    return `${x} ${y}`;
                  }).join(' L ')} L 360 160 Z`}
                  fill="url(#gradient)"
                />
                
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales By Branch */}
        <div className="analytics-card">
          <div className="card-header">
            <FaStore className="card-icon" />
            <h3>Sales By Branch</h3>
          </div>
          <div className="chart-container">
            {analyticsData.salesByBranch && analyticsData.salesByBranch.length > 0 ? (
            <div className="vertical-bar-chart">
              <svg viewBox="0 0 500 280" className="bar-chart-svg">
                {/* Y-axis grid lines */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line
                    key={`grid-${i}`}
                    x1="45"
                    y1={30 + i * 38}
                    x2="490"
                    y2={30 + i * 38}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                
                {/* Y-axis */}
                <line
                  x1="45"
                  y1="30"
                  x2="45"
                  y2="240"
                  stroke="#475569"
                  strokeWidth="2"
                />
                
                {/* X-axis */}
                <line
                  x1="45"
                  y1="240"
                  x2="490"
                  y2="240"
                  stroke="#475569"
                  strokeWidth="2"
                />
                
                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const maxSales = getMaxValue(analyticsData.salesByBranch, 'sales');
                  const value = Math.round((maxSales / 5) * (5 - i));
                  return (
                    <text
                      key={`y-label-${i}`}
                      x="40"
                      y={35 + i * 38}
                      className="axis-label"
                      textAnchor="end"
                    >
                      {formatNumber(value)}
                    </text>
                  );
                })}
                
                {/* Bars */}
                {analyticsData.salesByBranch.map((branch, index) => {
                  const maxSales = getMaxValue(analyticsData.salesByBranch, 'sales');
                  const barHeight = (branch.sales / maxSales) * 210;
                  const numBranches = analyticsData.salesByBranch.length;
                  const chartWidth = 445;
                  const barWidth = Math.max(30, (chartWidth / numBranches) - 8);
                  const spacing = chartWidth / numBranches;
                  const x = 50 + index * spacing + (spacing - barWidth) / 2;
                  const y = 240 - barHeight;
                  const isHighest = branch.sales === maxSales;
                  
                  return (
                    <g key={`bar-${index}`} className="bar-group">
                      {/* Bar shadow */}
                      <rect
                        x={x + 1.5}
                        y={y + 1.5}
                        width={barWidth}
                        height={barHeight}
                        fill="rgba(0, 0, 0, 0.08)"
                        rx="3"
                      />
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={branch.color} stopOpacity="1"/>
                          <stop offset="100%" stopColor={branch.color} stopOpacity="0.7"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Main bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={`url(#gradient-${index})`}
                        rx="3"
                        className={`bar-rect ${isHighest ? 'highest-bar' : ''}`}
                      >
                        <animate
                          attributeName="height"
                          from="0"
                          to={barHeight}
                          dur="0.8s"
                          fill="freeze"
                        />
                        <animate
                          attributeName="y"
                          from="240"
                          to={y}
                          dur="0.8s"
                          fill="freeze"
                        />
                      </rect>
                      
                      {/* Value label on top of bar */}
                      {barHeight > 30 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          className="bar-value-label"
                          textAnchor="middle"
                          fill={isHighest ? '#1e40af' : '#475569'}
                          fontWeight={isHighest ? '700' : '600'}
                          fontSize={numBranches > 6 ? '9' : '10'}
                        >
                          ₱{formatNumber(branch.sales)}
                        </text>
                      )}
                      
                      {/* Branch icon - only show if bar is tall enough */}
                      {barHeight > 40 && barWidth > 35 && (
                        <foreignObject
                          x={x + barWidth / 2 - 8}
                          y={y + barHeight / 2 - 8}
                          width="16"
                          height="16"
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            color: '#ffffff',
                            fontSize: '8px'
                          }}>
                            <FaStore />
                          </div>
                        </foreignObject>
                      )}
                      
                      {/* X-axis label - abbreviated for many branches */}
                      <text
                        x={x + barWidth / 2}
                        y="256"
                        className="axis-label branch-label"
                        textAnchor="middle"
                        fontSize={numBranches > 6 ? '8' : '9'}
                      >
                        {numBranches > 7 
                          ? branch.branch.substring(0, 6) + (branch.branch.length > 6 ? '.' : '')
                          : branch.branch.length > 12 
                            ? branch.branch.substring(0, 12) + '...' 
                            : branch.branch
                        }
                      </text>
                    </g>
                  );
                })}
                
                {/* Axis titles */}
                <text
                  x="20"
                  y="135"
                  className="axis-title"
                  textAnchor="middle"
                  transform="rotate(-90 20 135)"
                >
                  Sales (₱)
                </text>
                
                <text
                  x="270"
                  y="273"
                  className="axis-title"
                  textAnchor="middle"
                >
                  Branch
                </text>
              </svg>
            </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No branch data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending vs Completed Orders */}
        <div className="analytics-card">
          <div className="card-header">
            <FaClipboardList className="card-icon" />
            <h3>Pending vs. Completed Orders</h3>
          </div>
          <div className="chart-container">
            {analyticsData.orderStatus && analyticsData.orderStatus.total > 0 ? (
            <div className="donut-chart">
              <svg viewBox="0 0 200 200" className="chart-svg">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 80 * ((analyticsData.orderStatus?.completed?.percentage || 0) / 100)} ${2 * Math.PI * 80}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 80 * ((analyticsData.orderStatus?.pending?.percentage || 0) / 100)} ${2 * Math.PI * 80}`}
                  strokeDashoffset={`-${2 * Math.PI * 80 * ((analyticsData.orderStatus?.completed?.percentage || 0) / 100)}`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="100" textAnchor="middle" className="donut-center-text">
                  {analyticsData.orderStatus?.completed?.percentage || 0}%
                </text>
                <text x="100" y="115" textAnchor="middle" className="donut-center-label">
                  Completed
                </text>
              </svg>
              
              <div className="donut-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#1e3a8a' }}></div>
                  <span>Completed</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#0d9488' }}></div>
                  <span>Pending</span>
                </div>
              </div>
            </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="analytics-card">
          <div className="card-header">
            <FaTshirt className="card-icon" />
            <h3>Top Selling Products</h3>
          </div>
          <div className="chart-container">
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 ? (
            <div className="bar-chart">
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-label">{product.product}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${product.percentage}%`,
                        backgroundColor: '#8b5cf6'
                      }}
                    ></div>
                  </div>
                  <div className="bar-value">
                    {product.product === 'Tarpulins' ? '30' : `${product.percentage}%`}
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No product data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="analytics-card geo-distribution-card">
          <div className="card-header">
            <FaMapMarkerAlt className="card-icon" />
            <h3>Geographic Distribution</h3>
          </div>
          <div className="chart-container">
            {geoLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>Loading geographic data...</p>
              </div>
            ) : geoDistribution && geoDistribution.length > 0 ? (
              <div className="geo-distribution-list">
                {geoDistribution.slice(0, 10).map((location, index) => (
                  <div key={index} className="geo-item">
                    <div className="geo-item-header">
                      <div className="geo-location-info">
                        <div className="geo-location-marker" style={{ 
                          background: `linear-gradient(135deg, ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#14b8a6'][index % 9]} 0%, ${['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#db2777', '#0d9488'][index % 9]} 100%)` 
                        }}>
                          <FaMapMarkerAlt />
                        </div>
                        <div className="geo-location-details">
                          <h4 className="geo-location-name">{location.location}</h4>
                          <div className="geo-location-stats">
                            <span className="geo-stat-item">{location.orders} orders</span>
                            <span className="geo-stat-separator">•</span>
                            <span className="geo-stat-item">{location.customers} customers</span>
                          </div>
                        </div>
                      </div>
                      <div className="geo-item-value">
                        <span className="geo-revenue">₱{location.revenue.toLocaleString()}</span>
                        <span className="geo-avg-order">Avg: ₱{location.avgOrderValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="geo-progress-bar">
                      <div 
                        className="geo-progress-fill" 
                        style={{ 
                          width: `${location.percentage}%`,
                          background: `linear-gradient(90deg, ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#14b8a6'][index % 9]} 0%, ${['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#db2777', '#0d9488'][index % 9]} 100%)`
                        }}
                      >
                        <span className="geo-percentage">{location.percentage}%</span>
                      </div>
                    </div>
                    {location.topProducts && location.topProducts.length > 0 && (
                      <div className="geo-top-products">
                        <span className="geo-products-label">Top Items:</span>
                        {location.topProducts.map((product, idx) => (
                          <span key={idx} className="geo-product-badge">{product}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No geographic data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default Analytics;
