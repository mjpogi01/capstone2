import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import '../admin/AdminDashboard.css';
import './admin-shared.css';
import { FaSearch, FaPlay, FaFilter, FaChartLine, FaStore, FaClipboardList, FaTshirt } from 'react-icons/fa';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: [],
    salesByBranch: [],
    orderStatus: {},
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

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

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
  };

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key]));
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
          <button className="filter-btn">
            <FaFilter className="btn-icon" />
          </button>
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
            <div className="bar-chart">
              {analyticsData.salesByBranch.map((branch, index) => {
                const maxSales = getMaxValue(analyticsData.salesByBranch, 'sales');
                const percentage = (branch.sales / maxSales) * 100;
                
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-label">{branch.branch}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: branch.color
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{formatNumber(branch.sales)}</div>
                  </div>
                );
              })}
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
      </div>
    </div>
      </div>
    </div>
  );
};

export default Analytics;
