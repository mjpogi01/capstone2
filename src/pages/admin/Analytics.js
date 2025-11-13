import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import Sidebar from '../../components/admin/Sidebar';
import NexusChatModal from '../../components/admin/NexusChatModal';
import '../admin/AdminDashboard.css';
import './admin-shared.css';
import { API_URL } from '../../config/api';
import { authFetch, authJsonFetch } from '../../services/apiClient';
import { FaSearch, FaPlay, FaFilter, FaStore, FaClipboardList, FaTshirt, FaMap, FaChartLine, FaChartArea, FaUsers, FaUserPlus, FaShoppingCart, FaMoneyBillWave, FaRobot } from 'react-icons/fa';
import './Analytics.css';
import '../../components/Loading.css';

const BranchMap = lazy(() => import('../../components/admin/BranchMap'));

echarts.use([
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  LineChart,
  BarChart,
  PieChart,
  SVGRenderer
]);

const CHART_LABELS = {
  totalSales: 'Total Sales Over Time',
  salesTrends: 'Daily Sales & Orders',
  salesByBranch: 'Sales by Branch',
  orderStatus: 'Order Pipeline Health',
  topProducts: 'Top Product Groups',
  topCustomers: 'Top Customers',
  customerLocations: 'Customer Locations',
  salesForecast: 'Sales Forecast'
};

const SALES_FORECAST_RANGE_LABELS = {
  nextMonth: 'Next Month',
  restOfYear: 'Rest of Year',
  nextYear: 'Next 12 Months'
};

const QUESTION_KEYWORDS = [
  { id: 'salesTrends', keywords: ['daily sales', 'sales & orders', 'orders chart', 'daily revenue'] },
  { id: 'totalSales', keywords: ['total sales', 'sales over time', 'monthly revenue', 'revenue trend'] },
  { id: 'salesByBranch', keywords: ['branch', 'pickup location', 'store performance'] },
  { id: 'orderStatus', keywords: ['order status', 'pipeline', 'processing', 'pending'] },
  { id: 'topProducts', keywords: ['product', 'category', 'top selling product'] },
  { id: 'topCustomers', keywords: ['customer', 'buyer', 'best customer'] },
  { id: 'customerLocations', keywords: ['customer location', 'map', 'geo', 'heatmap'] },
  { id: 'salesForecast', keywords: ['forecast', 'projection', 'predict'] }
];

const resolveChartIdFromText = (text = '') => {
  const lower = text.toLowerCase();
  const match = QUESTION_KEYWORDS.find(({ keywords }) =>
    keywords.some((phrase) => lower.includes(phrase))
  );
  return match ? match.id : null;
};

const useViewportWidth = (defaultWidth = 1440) => {
  const getWidth = () => {
    if (typeof window === 'undefined') {
      return defaultWidth;
    }
    return window.innerWidth;
  };

  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let frame = null;

    const handleResize = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        setWidth(window.innerWidth);
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return width;
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: [],
    totalSalesMonthly: [],
    totalSalesYearly: [],
    totalSalesGranularity: 'monthly',
    salesByBranch: [],
    orderStatus: {},
    topProducts: [],
    summary: {},
    hasData: false
  });
  const [rawData, setRawData] = useState(null);
  const [salesForecast, setSalesForecast] = useState({ historical: [], forecast: [], combined: [] });
  const [salesTrends, setSalesTrends] = useState([]);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesForecastRange, setSalesForecastRange] = useState('restOfYear');
  const [customerLocationsData, setCustomerLocationsData] = useState({
    points: [],
    cityStats: [],
    summary: null
  });
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [salesTrendsLoading, setSalesTrendsLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    timeRange: 'all',
    branch: 'all',
    orderStatus: 'all',
    yearStart: '',
    yearEnd: ''
  });
  const [totalSalesLoading, setTotalSalesLoading] = useState(true);
  const filterRef = useRef(null);
  const [isNexusOpen, setIsNexusOpen] = useState(false);
  const [nexusMessages, setNexusMessages] = useState([]);
  const [nexusLoading, setNexusLoading] = useState(false);
  const [nexusError, setNexusError] = useState(null);
  const [nexusContext, setNexusContext] = useState({
    chartId: null,
    filters: null,
    lastSql: null,
    model: null
  });
  const hasCustomerLocationData = useMemo(() => {
    const pointsCount = Array.isArray(customerLocationsData?.points) ? customerLocationsData.points.length : 0;
    const cityCount = Array.isArray(customerLocationsData?.cityStats) ? customerLocationsData.cityStats.length : 0;
    return pointsCount > 0 || cityCount > 0;
  }, [customerLocationsData]);

  const viewportWidth = useViewportWidth();
  const chartHeights = useMemo(() => {
    const pickHeight = ({ xl, lg, md, sm, xs }) => {
      const width = viewportWidth || 0;
      if (width >= 1600) return xl;
      if (width >= 1280) return lg;
      if (width >= 1024) return md;
      if (width >= 768) return sm;
      return xs;
    };

    return {
      compact: `${pickHeight({ xl: 320, lg: 300, md: 270, sm: 240, xs: 210 })}px`,
      base: `${pickHeight({ xl: 340, lg: 320, md: 300, sm: 260, xs: 220 })}px`,
      tall: `${pickHeight({ xl: 420, lg: 380, md: 340, sm: 300, xs: 260 })}px`,
      wide: `${pickHeight({ xl: 380, lg: 360, md: 320, sm: 280, xs: 240 })}px`,
      map: `${pickHeight({ xl: 500, lg: 460, md: 420, sm: 360, xs: 300 })}px`
    };
  }, [viewportWidth]);


  useEffect(() => {
    fetchAnalyticsData();

    const runDeferredFetches = () => {
      fetchSalesTrends();
      fetchCustomerAnalytics();
    };

    let idleId = null;
    let timeoutId = null;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(runDeferredFetches, { timeout: 500 });
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(runDeferredFetches, 120);
    } else {
      runDeferredFetches();
    }

    return () => {
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    };
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
        const response = await authFetch(`${API_URL}/api/analytics/dashboard`);
        const result = await response.json();
        
        console.log('Analytics API Response:', result);
        
        if (result.success && result.data) {
          const salesOverTime = result.data.salesOverTime || {};
          const salesOverTimeMonthly = Array.isArray(salesOverTime.monthly) ? salesOverTime.monthly : [];
          const salesOverTimeYearly = Array.isArray(salesOverTime.yearly) ? salesOverTime.yearly : [];
          const initialMonthlySeries = salesOverTimeMonthly.length > 12
            ? salesOverTimeMonthly.slice(-12)
            : salesOverTimeMonthly;
          const hasInitialMonthly = initialMonthlySeries.length > 0;
          const fallbackYearlySeries = salesOverTimeYearly.length > 0 ? salesOverTimeYearly : [];
          const initialSeries = hasInitialMonthly ? initialMonthlySeries : fallbackYearlySeries;
          const initialGranularity = hasInitialMonthly ? 'monthly' : (fallbackYearlySeries.length > 0 ? 'yearly' : 'monthly');
          const topProductsRaw = Array.isArray(result.data.topProducts) ? result.data.topProducts : [];
          const maxTopProductQuantity = topProductsRaw.length > 0
            ? Math.max(...topProductsRaw.map(p => p.quantity || 0))
            : 0;
          const hasData = initialSeries.length > 0 && initialSeries.some(item => Number(item.sales || item.total || 0) > 0);
          
          // Store raw data for filtering
          setRawData({
            totalSalesMonthly: salesOverTimeMonthly,
            totalSalesYearly: salesOverTimeYearly,
            salesByBranch: result.data.salesByBranch || [],
            orderStatus: result.data.orderStatus || {},
            topProducts: topProductsRaw,
            summary: result.data.summary,
            hasData
          });
          
          // Initial display (no filters applied)
          setAnalyticsData({
            totalSales: initialSeries,
            totalSalesGranularity: initialGranularity,
            totalSalesMonthly: salesOverTimeMonthly,
            totalSalesYearly: salesOverTimeYearly,
            salesByBranch: result.data.salesByBranch || [],
            orderStatus: result.data.orderStatus || {},
            topProducts: hasData && topProductsRaw.length > 0 
              ? topProductsRaw.map(product => ({
                  product: product.product,
                  quantity: product.quantity || 0,
                  orders: product.orders || 0,
                  revenue: product.revenue || 0,
                  percentage: maxTopProductQuantity > 0
                    ? Math.round(((product.quantity || 0) / maxTopProductQuantity) * 100)
                    : 0
                }))
              : [],
            summary: result.data.summary,
            hasData
          });
          setLoading(false);
          setTotalSalesLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Don't use mock data, show empty state instead
        setAnalyticsData({
          totalSales: [],
          totalSalesGranularity: 'monthly',
          totalSalesMonthly: [],
          totalSalesYearly: [],
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
        setRawData(null);
        setLoading(false);
        setTotalSalesLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setTotalSalesLoading(false);
    }
  };

  const handleSendNexusMessage = (messageText) => {
    if (!nexusContext.chartId && !nexusContext.isGeneralConversation) {
      return;
    }

    const trimmed = (messageText || '').trim();
    if (!trimmed) {
      return;
    }

    const resolvedChartId = resolveChartIdFromText(trimmed) || nexusContext.chartId;
    const useGeneralConversation = nexusContext.isGeneralConversation && !resolvedChartId;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed
    };

    const nextConversation = [...nexusMessages, userMessage];
    setNexusMessages(nextConversation);

    setNexusContext((prev) => ({
      ...prev,
      chartId: resolvedChartId || null,
      isGeneralConversation: useGeneralConversation
    }));

    const chartRange = nexusContext.range || salesForecastRange;
    const chartData = nexusContext.chartData || (resolvedChartId === 'salesForecast' ? salesForecast : null);

    fetchNexusResponse(
      resolvedChartId || null,
      nextConversation,
      nexusContext.filters,
      useGeneralConversation,
      {
        range: chartRange,
        data: chartData
      }
    );
  };

  const handleCloseNexus = () => {
    setIsNexusOpen(false);
    setNexusLoading(false);
  };

  const fetchSalesTrends = async () => {
    try {
      setSalesTrendsLoading(true);
      const response = await authFetch(`${API_URL}/api/analytics/sales-trends?period=30`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setSalesTrends(result.data);
      } else {
        setSalesTrends([]);
      }
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      setSalesTrends([]);
    } finally {
      setSalesTrendsLoading(false);
    }
  };

  const fetchCustomerAnalytics = async () => {
    try {
      setCustomerLoading(true);
      const response = await authFetch(`${API_URL}/api/analytics/customer-analytics`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCustomerSummary(result.data.summary || null);
        const topCustomersRaw = Array.isArray(result.data.topCustomers) ? result.data.topCustomers : [];
        const formattedTopCustomers = topCustomersRaw.map((customer, index) => ({
          ...customer,
          displayName: getCustomerDisplayName(customer, index)
        }));
        setTopCustomers(formattedTopCustomers);
      } else {
        setCustomerSummary(null);
        setTopCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      setCustomerSummary(null);
      setTopCustomers([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchSalesForecast = useCallback(async (rangeOverride) => {
    const activeRange = rangeOverride || salesForecastRange;
    try {
      setForecastLoading(true);
      const response = await authFetch(`${API_URL}/api/analytics/sales-forecast?range=${encodeURIComponent(activeRange)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setSalesForecast(result.data);
      } else {
        setSalesForecast({ historical: [], forecast: [], combined: [], summary: null, range: activeRange });
      }
    } catch (error) {
      console.error('Error fetching sales forecast:', error);
      setSalesForecast({ historical: [], forecast: [], combined: [], summary: null, range: activeRange });
    } finally {
      setForecastLoading(false);
    }
  }, [salesForecastRange]);

  useEffect(() => {
    fetchSalesForecast(salesForecastRange);
  }, [salesForecastRange, fetchSalesForecast]);

  const formatNumber = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
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

  const fetchNexusResponse = async (
    chart,
    conversation,
    appliedFilters,
    isGeneralConversation = false,
    chartContext = {}
  ) => {
    try {
      setNexusLoading(true);
      setNexusError(null);

      const payload = {
        chartId: chart,
        filters: appliedFilters,
        messages: conversation,
        general: isGeneralConversation,
        range: chartContext.range || null,
        chartData: chartContext.data || null
      };

      const response = await authJsonFetch(`${API_URL}/api/ai/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          question: conversation[conversation.length - 1]?.content || ''
        })
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        metadata: {
          sql: response.sql,
          rowCount: response.rowCount,
          rows: response.rows,
          model: response.model
        }
      };

      setNexusMessages((prev) => {
        const cleaned = [...prev];
        while (
          cleaned.length > 0 &&
          cleaned[cleaned.length - 1].role === 'assistant' &&
          cleaned[cleaned.length - 1].metadata?.error
        ) {
          cleaned.pop();
        }
        return [...cleaned, assistantMessage];
      });
      setNexusContext((prev) => ({
        ...prev,
        chartId: chart,
        lastSql: response.sql,
        model: response.model,
        lastRows: response.rows,
        isGeneralConversation
      }));
    } catch (error) {
      console.error('Nexus analysis error:', error);
      setNexusError(error.message || 'Failed to fetch Nexus analysis.');
      setNexusMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Nexus could not complete the analysis.\n\n${error.message || 'Unexpected error occurred.'}`,
          metadata: { error: true }
        }
      ]);
    } finally {
      setNexusLoading(false);
    }
  };

  const handleAnalyzeClick = (chartId, context = {}) => {
    if (!chartId) {
      return;
    }

    const appliedFilters = context.filters || filters;
    const rangeContext = context.range || salesForecastRange;
    const defaultPrompt =
      chartId === 'salesForecast'
        ? `Please analyze the ${CHART_LABELS[chartId] || chartId} chart for the ${SALES_FORECAST_RANGE_LABELS[rangeContext] || rangeContext}. Summarize projected revenue, orders, confidence, and how it compares to the baseline.`
        : `Please analyze the ${CHART_LABELS[chartId] || chartId} chart and highlight the most important insights.`;
    const initialPrompt = typeof context.question === 'string' && context.question.trim().length > 0
      ? context.question.trim()
      : defaultPrompt;

    const initialUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: initialPrompt
    };

    const initialConversation = [initialUserMessage];

    setNexusMessages(initialConversation);
    setNexusContext({
      chartId,
      filters: appliedFilters,
      lastSql: null,
      model: null,
      lastRows: null,
      range: rangeContext,
      chartData: context.data || null
    });
    setIsNexusOpen(true);

    fetchNexusResponse(chartId, initialConversation, appliedFilters, false, {
      range: rangeContext,
      data: context.data || (chartId === 'salesForecast' ? salesForecast : null)
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

    setTotalSalesLoading(true);
    console.log('Applying filters:', filters);

    const monthlySource = Array.isArray(rawData.totalSalesMonthly) ? [...rawData.totalSalesMonthly] : [];
    const yearlySource = Array.isArray(rawData.totalSalesYearly) ? [...rawData.totalSalesYearly] : [];
    const baseGranularity = filters.timeRange === 'year' ? 'yearly' : 'monthly';
    let effectiveGranularity = baseGranularity;
    let selectedSales = effectiveGranularity === 'yearly' ? yearlySource : monthlySource;

    if (effectiveGranularity === 'monthly' && selectedSales.length === 0 && yearlySource.length > 0) {
      effectiveGranularity = 'yearly';
      selectedSales = [...yearlySource];
    } else if (effectiveGranularity === 'yearly' && selectedSales.length === 0 && monthlySource.length > 0) {
      effectiveGranularity = 'monthly';
      selectedSales = [...monthlySource];
    }

    selectedSales = selectedSales
      .filter(item => typeof item === 'object' && item !== null)
      .map(item => ({
        ...item,
        date: item.date || (item.year ? new Date(item.year, (item.month ? item.month - 1 : 0), 1).toISOString() : null),
        label: item.label || item.month || (item.year ? String(item.year) : '')
      }));

    selectedSales.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(a.year || 0, (a.month || 1) - 1, 1);
      const dateB = b.date ? new Date(b.date) : new Date(b.year || 0, (b.month || 1) - 1, 1);
      return dateA - dateB;
    });

    const now = new Date();
    if (baseGranularity === 'monthly') {
      switch (filters.timeRange) {
        case 'today': {
          const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          selectedSales = selectedSales.filter(item => item.date && new Date(item.date) >= startDate);
          break;
        }
        case 'week': {
          const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          selectedSales = selectedSales.filter(item => item.date && new Date(item.date) >= startDate);
          break;
        }
        case 'month': {
          selectedSales = selectedSales.slice(-12);
          break;
        }
        case 'quarter': {
          const quarter = Math.floor(now.getMonth() / 3);
          const startDate = new Date(now.getFullYear(), quarter * 3, 1);
          selectedSales = selectedSales.filter(item => item.date && new Date(item.date) >= startDate);
          break;
        }
        case 'all':
        default:
          // Keep full series
          break;
      }
    }

    if (filters.yearStart || filters.yearEnd) {
      const startYear = filters.yearStart ? parseInt(filters.yearStart, 10) : 2000;
      const endYear = filters.yearEnd ? parseInt(filters.yearEnd, 10) : 2100;
      selectedSales = selectedSales.filter(item => {
        const itemYear = item.year ?? (item.date ? new Date(item.date).getFullYear() : undefined);
        if (itemYear === undefined) {
          return true;
        }
        return itemYear >= startYear && itemYear <= endYear;
      });
    }

    const branchFilter = filters.branch !== 'all'
      ? filters.branch.toLowerCase().replace(/\s+/g, '_')
      : null;

    let salesByBranch = rawData.salesByBranch ? [...rawData.salesByBranch] : [];
    if (branchFilter) {
      salesByBranch = salesByBranch.filter(
        item => item.branch && item.branch.toLowerCase().replace(/\s+/g, '_') === branchFilter
      );
    }

    let orderStatus = rawData.orderStatus
      ? Object.keys(rawData.orderStatus).reduce((acc, key) => {
          const value = rawData.orderStatus[key];
          acc[key] = typeof value === 'object' && value !== null ? { ...value } : value;
          return acc;
        }, {})
      : {};

    if (filters.orderStatus !== 'all' && orderStatus) {
      const selectedStatus = filters.orderStatus;
      const statusData = orderStatus[selectedStatus];
      if (statusData) {
        orderStatus = {
          [selectedStatus]: { ...statusData },
          total: statusData.count
        };
      }
    }

    let topProducts = rawData.topProducts ? rawData.topProducts.map(product => ({ ...product })) : [];
    if (topProducts.length > 0) {
      const maxQuantity = Math.max(...topProducts.map(p => p.quantity || 0));
      topProducts = topProducts.map(product => ({
        ...product,
        percentage: maxQuantity > 0 ? Math.round(((product.quantity || 0) / maxQuantity) * 100) : 0
      }));
    }

    let summary = rawData.summary ? { ...rawData.summary } : {};
    if (orderStatus && typeof orderStatus === 'object') {
      const total = Object.values(orderStatus)
        .reduce((sum, status) => sum + (typeof status === 'object' ? status.count || 0 : 0), 0);
      summary = {
        ...summary,
        totalOrders: total
      };
    }

    if (selectedSales.length === 0) {
      if (effectiveGranularity === 'monthly' && yearlySource.length > 0) {
        effectiveGranularity = 'yearly';
        selectedSales = [...yearlySource];
      } else if (effectiveGranularity === 'yearly' && monthlySource.length > 0) {
        effectiveGranularity = 'monthly';
        selectedSales = [...monthlySource];
      }
    }

    const filteredData = {
      totalSales: selectedSales,
      totalSalesGranularity: effectiveGranularity,
      totalSalesMonthly: rawData.totalSalesMonthly,
      totalSalesYearly: rawData.totalSalesYearly,
      salesByBranch,
      orderStatus,
      topProducts,
      summary,
      hasData: rawData.hasData
    };

    console.log('Filtered data:', filteredData);
    setAnalyticsData(filteredData);
    setTotalSalesLoading(false);
  };

  const totalSalesChart = useMemo(() => {
    const dataset = Array.isArray(analyticsData?.totalSales) ? analyticsData.totalSales : [];
    const categories = dataset.map(item => item.label || item.month || item.year || item.date || '');
    const values = dataset.map(item => Number(item.sales || item.total || 0));
    const hasData = dataset.length > 0 && values.some(value => value > 0);

    const rotateLabels = categories.length > 12 && analyticsData.totalSalesGranularity !== 'yearly' ? 35 : 0;
    const seriesName = analyticsData.totalSalesGranularity === 'yearly' ? 'Yearly Sales' : 'Monthly Sales';

    const option = {
      animation: hasData,
      animationDuration: hasData ? 600 : 0,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const point = params[0];
          return `${point.axisValue}<br/>${seriesName}: ₱${formatNumber(point.data || 0)}`;
        }
      },
      grid: { left: '4%', right: '3%', bottom: rotateLabels ? '14%' : '8%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLabel: { color: '#6b7280', rotate: rotateLabels },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          formatter: (value) => `₱${formatNumber(value)}`
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      series: [
        {
          name: seriesName,
          type: 'line',
          smooth: true,
          data: values,
          showSymbol: false,
          lineStyle: { width: 3, color: '#8b5cf6' },
          areaStyle: { color: 'rgba(139, 92, 246, 0.15)' },
          animation: hasData,
          animationDuration: hasData ? 600 : 0,
          emphasis: { focus: 'series' }
        }
      ]
    };

    return { option, hasData };
  }, [analyticsData.totalSales, analyticsData.totalSalesGranularity]);

  const salesByBranchChart = useMemo(() => {
    const branchData = Array.isArray(analyticsData?.salesByBranch) ? analyticsData.salesByBranch : [];
    const values = branchData.map(item => Number(item.sales || 0));
    const hasData = branchData.length > 0 && values.some(value => value > 0);
    const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#f97316', '#84cc16'];

    const option = {
      animation: hasData,
      animationDuration: hasData ? 600 : 0,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const bar = params[0];
          return `${bar.axisValueLabel}<br/>Sales: ₱${formatNumber(bar.data?.value ?? bar.data ?? 0)}`;
        }
      },
      grid: { left: '6%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: branchData.map(item => item.branch),
        axisLabel: {
          color: '#6b7280',
          interval: 0,
          rotate: branchData.length > 6 ? 30 : 0
        },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          formatter: (value) => `₱${formatNumber(value)}`
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      series: [
        {
          name: 'Branch Sales',
          type: 'bar',
          barMaxWidth: 42,
          data: branchData.map((item, index) => ({
            value: Number(item.sales || 0),
            itemStyle: {
              color: item.color || colors[index % colors.length],
              borderRadius: [6, 6, 0, 0]
            }
          })),
          animation: hasData,
          animationDuration: hasData ? 600 : 0,
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(31, 41, 55, 0.25)' } },
          label: {
            show: branchData.length <= 6 && branchData.length > 0,
            position: 'top',
            formatter: ({ value }) => `₱${formatNumber(value)}`,
            color: '#475569',
            fontWeight: 600
          }
        }
      ]
    };

    return { option, hasData };
  }, [analyticsData.salesByBranch]);

  const orderStatusChart = useMemo(() => {
    const status = analyticsData?.orderStatus;
    const entries = status
      ? ['completed', 'processing', 'pending', 'cancelled']
          .map((key) => {
            const entry = status[key];
            if (!entry || entry.count === undefined) {
              return null;
            }
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const total = status.total || Object.values(status)
              .filter(val => typeof val === 'object' && val.count !== undefined)
              .reduce((sum, val) => sum + (val.count || 0), 0);
            const percentage = entry.percentage !== undefined
              ? entry.percentage
              : total > 0 ? Math.round(((entry.count || 0) / total) * 100) : 0;
            return {
              name: label,
              value: entry.count || 0,
              percentage
            };
          })
          .filter(Boolean)
      : [];

    const hasData = entries.length > 0 && entries.some(entry => entry.value > 0);

    const option = {
      animation: hasData,
      animationDuration: hasData ? 400 : 0,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: ({ name, value, data }) => {
          const percentage = data?.percentage ?? 0;
          return `${name}<br/>${value} orders (${percentage}%)`;
        }
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: { color: '#4b5563' }
      },
      series: [
        {
          name: 'Order Status',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['38%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: entries.map((entry) => ({
            ...entry,
            value: entry.value,
            name: entry.name
          })),
          animation: hasData,
          animationDuration: hasData ? 400 : 0
        }
      ]
    };

    return { option, hasData };
  }, [analyticsData.orderStatus]);

  const salesTrendsChart = useMemo(() => {
    const trends = Array.isArray(salesTrends) ? salesTrends : [];
    const categories = trends.map(item => {
      const rawDate = item.date || item.day || item.period;
      if (!rawDate) {
        return '';
      }
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        return rawDate;
      }
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const salesValues = trends.map(item => Number(item.sales || 0));
    const ordersValues = trends.map(item => Number(item.orders || 0));
    const hasData =
      trends.length > 0 &&
      (salesValues.some(value => value > 0) || ordersValues.some(value => value > 0));

    const option = {
      animation: hasData,
      animationDuration: hasData ? 600 : 0,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const lines = params.map(point => {
            if (point.seriesName === 'Sales') {
              return `${point.marker}${point.seriesName}: ₱${formatNumber(point.data ?? 0)}`;
            }
            return `${point.marker}${point.seriesName}: ${formatNumber(point.data ?? 0)}`;
          });
          return [`${params[0].axisValue}`, ...lines].join('<br/>');
        }
      },
      legend: {
        data: ['Sales', 'Orders'],
        top: 0,
        textStyle: { color: '#4b5563' }
      },
      grid: { left: '4%', right: '5%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLabel: { color: '#6b7280' },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Sales',
          axisLabel: {
            color: '#6b7280',
            formatter: (value) => `₱${formatNumber(value)}`
          },
          splitLine: { lineStyle: { color: '#e5e7eb' } }
        },
        {
          type: 'value',
          name: 'Orders',
          axisLabel: { color: '#6b7280', formatter: (value) => formatNumber(value) },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Sales',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#6366f1' },
          areaStyle: { color: 'rgba(99, 102, 241, 0.15)' },
          data: salesValues,
          animation: hasData,
          animationDuration: hasData ? 600 : 0
        },
        {
          name: 'Orders',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#f97316', type: 'dashed' },
          data: ordersValues,
          animation: hasData,
          animationDuration: hasData ? 600 : 0
        }
      ]
    };

    return { option, hasData };
  }, [salesTrends]);

  const topProductsChart = useMemo(() => {
    const products = Array.isArray(analyticsData?.topProducts) ? analyticsData.topProducts : [];
    const values = products.map(item => Number(item.quantity || 0));
    const hasData = products.length > 0 && values.some(value => value > 0);
    const maxValue = Math.max(0, ...values);
    const paddedMax = maxValue <= 0 ? 10 : Math.ceil(maxValue * 1.1);
    const gradientStops = [
      { offset: 0, color: '#c084fc' },
      { offset: 0.45, color: '#a855f7' },
      { offset: 1, color: '#6366f1' }
    ];

    const option = {
      animation: hasData,
      animationDuration: hasData ? 650 : 0,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const bar = params[0];
          const product = products[bar.dataIndex];
          if (!product) return '';
          const quantity = product.quantity ?? 0;
          const orders = product.orders ?? 0;
          const share = product.percentage ?? 0;
          const revenue = product.revenue ?? 0;
          const lines = [
            `${bar.axisValueLabel}`,
            `Quantity: ${formatNumber(quantity)}`,
            `Share: ${share}%`
          ];
          if (orders) {
            lines.push(`Orders: ${formatNumber(orders)}`);
          }
          if (revenue) {
            lines.push(`Revenue: ₱${formatNumber(revenue)}`);
          }
          return lines.join('<br/>');
        }
      },
      grid: { left: '6%', right: '6%', bottom: '6%', top: '6%', containLabel: true },
      xAxis: {
        type: 'value',
        min: 0,
        max: paddedMax,
        axisLabel: {
          color: '#6b7280',
          formatter: (value) => formatNumber(value)
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      yAxis: {
        type: 'category',
        data: products.map(item => item.product),
        inverse: true,
        axisLabel: {
          color: '#4338ca',
          fontWeight: 600,
          fontSize: 13
        },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          type: 'bar',
          barWidth: 28,
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(99, 102, 241, 0.08)',
            borderRadius: [0, 12, 12, 0]
          },
          data: values.map((value, index) => ({
            value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, gradientStops),
              shadowBlur: 6,
              shadowOffsetX: 2,
              shadowColor: 'rgba(99, 102, 241, 0.35)'
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#a855f7' },
                  { offset: 1, color: '#4c1d95' }
                ])
              }
            }
          })),
          itemStyle: { borderRadius: [0, 12, 12, 0] },
          animation: hasData,
          animationDuration: hasData ? 650 : 0,
          label: {
            show: products.length > 0,
            position: 'right',
            formatter: ({ value, dataIndex }) => {
              const share = products[dataIndex]?.percentage ?? 0;
              return `${formatNumber(value)} • ${share}%`;
            },
            color: '#312e81',
            fontWeight: 600,
            fontSize: 12
          }
        }
      ]
    };

    return { option, hasData };
  }, [analyticsData.topProducts]);

  const topCustomersChart = useMemo(() => {
    const customers = Array.isArray(topCustomers) ? topCustomers.slice(0, 8) : [];
    const values = customers.map(item => Number(item.totalSpent || item.totalSpentValue || item.total || 0));
    const hasData = customers.length > 0 && values.some(value => value > 0);

    const option = {
      animation: hasData,
      animationDuration: hasData ? 600 : 0,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const bar = params[0];
          const customer = customers[bar.dataIndex];
          if (!customer) return '';
          const name = getCustomerDisplayName(customer, bar.dataIndex);
          const spent = customer.totalSpent || customer.totalSpentValue || customer.total || 0;
          const orderCount = customer.orderCount || customer.order_count || customer.orderCountValue || customer.orders || 0;
          return `${name}<br/>Spent: ₱${formatNumber(spent)}<br/>Orders: ${formatNumber(orderCount)}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '4%', top: '6%', containLabel: true },
      xAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          color: '#6b7280',
          formatter: (value) => `₱${formatNumber(value)}`
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      yAxis: {
        type: 'category',
        data: customers.map((customer, index) => getCustomerDisplayName(customer, index)),
        inverse: true,
        axisLabel: { color: '#4b5563' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          data: values,
          itemStyle: { color: '#10b981', borderRadius: [0, 8, 8, 0] },
          animation: hasData,
          animationDuration: hasData ? 600 : 0,
          label: {
            show: customers.length > 0,
            position: 'right',
            formatter: ({ value }) => `₱${formatNumber(value)}`,
            color: '#4b5563',
            fontWeight: 600
          }
        }
      ]
    };

    return { option, hasData };
  }, [topCustomers]);

  const salesForecastChart = useMemo(() => {
    const combined = Array.isArray(salesForecast?.combined) ? salesForecast.combined : [];
    const categories = combined.map(item => item.month || item.label || '');
    const historicalData = combined.map(item => item.type === 'historical' ? Number(item.revenue || 0) : null);
    const forecastData = combined.map(item => item.type === 'forecast' ? Number(item.revenue || 0) : null);
    const confidenceMap = new Map(
      (salesForecast?.forecast || []).map(item => [String(item.month || item.label || ''), item.confidence])
    );
    const hasData = combined.length > 0 && (
      historicalData.some(value => value !== null && value !== undefined && value !== 0) ||
      forecastData.some(value => value !== null && value !== undefined && value !== 0)
    );

    const option = {
      animation: hasData,
      animationDuration: hasData ? 600 : 0,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111827',
        borderColor: '#1f2937',
        textStyle: { color: '#f9fafb' },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return '';
          const lines = params
            .filter(point => point.value !== null && point.value !== undefined)
            .map(point => {
              let line = `${point.marker}${point.seriesName}: ₱${formatNumber(point.value || 0)}`;
              if (point.seriesName === 'Forecast') {
                const confidence = confidenceMap.get(String(point.axisValueLabel));
                if (confidence !== undefined) {
                  line += `<br/>Confidence: ${confidence}%`;
                }
              }
              return line;
            });
          return [params[0]?.axisValueLabel || '', ...lines].join('<br/>');
        }
      },
      legend: {
        data: ['Historical', 'Forecast'],
        top: 0,
        textStyle: { color: '#4b5563' }
      },
      grid: { left: '4%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#6b7280', interval: 0, rotate: categories.length > 8 ? 30 : 0 },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          formatter: (value) => `₱${formatNumber(value)}`
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      series: [
        {
          name: 'Historical',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: historicalData,
          lineStyle: { width: 3, color: '#3b82f6' },
          areaStyle: { color: 'rgba(59, 130, 246, 0.12)' },
          animation: hasData,
          animationDuration: hasData ? 600 : 0,
          emphasis: { focus: 'series' }
        },
        {
          name: 'Forecast',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 7,
          data: forecastData,
          lineStyle: { width: 3, color: '#10b981', type: 'dashed' },
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
          animation: hasData,
          animationDuration: hasData ? 600 : 0,
          emphasis: { focus: 'series' }
        }
      ]
    };
    return { option, hasData };
  }, [salesForecast]);

  const { option: salesTrendsOption, hasData: hasSalesTrendsData } = salesTrendsChart;
  const { option: totalSalesOption, hasData: hasTotalSalesData } = totalSalesChart;
  const { option: salesByBranchOption, hasData: hasSalesByBranchData } = salesByBranchChart;
  const { option: orderStatusOption, hasData: hasOrderStatusData } = orderStatusChart;
  const { option: topProductsOption, hasData: hasTopProductsData } = topProductsChart;
  const { option: topCustomersOption, hasData: hasTopCustomersData } = topCustomersChart;
  const { option: salesForecastOption, hasData: hasSalesForecastData } = salesForecastChart;
  const forecastSummary = salesForecast?.summary || null;

  const handleOpenFloatingChat = () => {
    setNexusMessages([]);
    setNexusContext({
      chartId: null,
      filters,
      lastSql: null,
      model: null,
      lastRows: null,
      isGeneralConversation: true
    });
    setIsNexusOpen(true);
    setNexusError(null);
  };

  function getCustomerDisplayName(customer = {}, index = 0) {
    const candidates = [
      customer.displayName,
      customer.customerName,
      customer.name,
      customer.fullName,
      customer.userName,
      customer.customer_email,
      customer.customerEmail,
      customer.email,
      customer.userEmail,
      customer.user_id,
      customer.userId,
      customer.id
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return `Customer ${index + 1}`;
  }

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activePage={'analytics'} 
        setActivePage={() => {}} 
      />
      <div className="admin-main-content">
        {loading ? (
          <div className="analytics-loading">
            <div className="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
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
          <button
            className="analyze-btn"
            type="button"
            onClick={() =>
              handleAnalyzeClick('totalSales', {
                filters,
                question: 'Give me a quick overview of overall sales performance.'
              })
            }
          >
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
            <p className="summary-value">{formatNumber(analyticsData.orderStatus?.total || analyticsData.summary?.totalOrders || 0)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon completed">
            <FaStore />
          </div>
          <div className="summary-content">
            <h3>Completed</h3>
            <p className="summary-value">{formatNumber(analyticsData.orderStatus?.completed?.count || 0)}</p>
            <p className="summary-percentage">({analyticsData.orderStatus?.completed?.percentage || 0}%)</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon processing">
            <FaFilter />
          </div>
          <div className="summary-content">
            <h3>Processing</h3>
            <p className="summary-value">{formatNumber(analyticsData.orderStatus?.processing?.count || 0)}</p>
            <p className="summary-percentage">({analyticsData.orderStatus?.processing?.percentage || 0}%)</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon pending">
            <FaChartLine />
          </div>
          <div className="summary-content">
            <h3>Pending</h3>
            <p className="summary-value">{formatNumber(analyticsData.orderStatus?.pending?.count || 0)}</p>
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
            <div className="card-controls">
              <button 
                className={`time-range-btn ${filters.timeRange === 'month' ? 'active' : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, timeRange: 'month' }));
                }}
              >
                Monthly
              </button>
              <button 
                className={`time-range-btn ${filters.timeRange === 'year' ? 'active' : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, timeRange: 'year' }));
                }}
              >
                Yearly
              </button>
              <button 
                className={`time-range-btn ${filters.timeRange === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, timeRange: 'all' }));
                }}
              >
                All Time
              </button>
          </div>
            <button
              className="analytics-header-analyze-btn"
              type="button"
              onClick={() => handleAnalyzeClick('totalSales', { data: analyticsData.totalSales, filters })}
          >
              Analyze
            </button>
          </div>
          <div className="chart-container">
            {totalSalesLoading ? (
              <div className="analytics-loading-inline">
                <div className="loading-spinner"></div>
                <p>Loading sales data...</p>
              </div>
            ) : (
              <>
                <ReactEChartsCore
                  echarts={echarts}
                  option={totalSalesOption}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'svg' }}
                  style={{ height: chartHeights.base, width: '100%' }}
                />
                {!hasTotalSalesData && (
                  <div className="chart-empty-state">
                    <p>No sales data available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Daily Sales & Orders */}
        <div className="analytics-card">
          <div className="card-header">
            <FaChartArea className="card-icon" />
            <h3>Daily Sales & Orders (Trailing 30 Days)</h3>
                  <button
              className="analytics-header-analyze-btn"
                    type="button"
              onClick={() => handleAnalyzeClick('salesTrends', { data: salesTrends })}
                  >
                    Analyze
                  </button>
          </div>
          <div className="chart-container">
            {salesTrendsLoading ? (
              <div className="analytics-loading-inline">
                <div className="loading-spinner"></div>
                <p>Loading daily trends...</p>
              </div>
            ) : (
              <>
                <ReactEChartsCore
                  echarts={echarts}
                  option={salesTrendsOption}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'svg' }}
                  style={{ height: chartHeights.base, width: '100%' }}
                />
                {!hasSalesTrendsData && (
                  <div className="chart-empty-state">
                    <p>No daily trend data available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sales By Branch */}
        <div className="analytics-card">
          <div className="card-header">
            <FaStore className="card-icon" />
            <h3>Sales By Branch</h3>
                <button
              className="analytics-header-analyze-btn"
                  type="button"
                  onClick={() => handleAnalyzeClick('salesByBranch', { data: analyticsData.salesByBranch, filters })}
                >
                  Analyze
                </button>
          </div>
          <div className="chart-container">
            <>
              <ReactEChartsCore
                echarts={echarts}
                option={salesByBranchOption}
                notMerge
                lazyUpdate
                opts={{ renderer: 'svg' }}
                style={{ height: chartHeights.base, width: '100%' }}
              />
              {!hasSalesByBranchData && (
                <div className="chart-empty-state">
                  <p>No branch data available</p>
                </div>
              )}
            </>
          </div>
        </div>

        {/* Pending vs Completed Orders */}
        <div className="analytics-card">
          <div className="card-header">
            <FaClipboardList className="card-icon" />
            <h3>Pending vs. Completed Orders</h3>
                <button
              className="analytics-header-analyze-btn"
                  type="button"
                  onClick={() => handleAnalyzeClick('orderStatus', { data: analyticsData.orderStatus, filters })}
                >
                  Analyze
                </button>
          </div>
          <div className="chart-container">
            <>
              <ReactEChartsCore
                echarts={echarts}
                option={orderStatusOption}
                notMerge
                lazyUpdate
                opts={{ renderer: 'svg' }}
                style={{ height: chartHeights.compact, width: '100%' }}
              />
              {!hasOrderStatusData && (
                <div className="chart-empty-state">
                  <p>No order data available</p>
                </div>
              )}
            </>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="analytics-card">
          <div className="card-header">
            <FaTshirt className="card-icon" />
            <h3>Top Selling Products</h3>
                <button
              className="analytics-header-analyze-btn"
                  type="button"
                  onClick={() => handleAnalyzeClick('topProducts', { data: analyticsData.topProducts, filters })}
                >
                  Analyze
                </button>
          </div>
          <div className="chart-container">
            <>
              <ReactEChartsCore
                echarts={echarts}
                option={topProductsOption}
                notMerge
                lazyUpdate
                opts={{ renderer: 'svg' }}
                style={{ height: chartHeights.tall, width: '100%' }}
              />
              {!hasTopProductsData && (
                <div className="chart-empty-state">
                  <p>No product data available</p>
                </div>
              )}
            </>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="analytics-card">
          <div className="card-header">
            <FaUsers className="card-icon" />
            <h3>Customer Insights</h3>
            <button
              className="analytics-header-analyze-btn"
              type="button"
              onClick={() => handleAnalyzeClick('topCustomers', { data: topCustomers })}
            >
              Analyze
            </button>
          </div>
          {customerLoading ? (
            <div className="analytics-loading-inline">
              <div className="loading-spinner"></div>
              <p>Loading customer analytics...</p>
              </div>
          ) : (
            <>
              <div className="analytics-summary customer-insights-summary">
                <div className="summary-card">
                  <div className="summary-icon">
                    <FaUsers />
                        </div>
                  <div className="summary-content">
                    <h3>Total Customers</h3>
                    <p className="summary-value">{formatNumber(customerSummary?.totalCustomers || 0)}</p>
                          </div>
                        </div>
                <div className="summary-card">
                  <div className="summary-icon completed">
                    <FaUserPlus />
                      </div>
                  <div className="summary-content">
                    <h3>New Customers (30d)</h3>
                    <p className="summary-value">{formatNumber(customerSummary?.newCustomers || 0)}</p>
                      </div>
                    </div>
                <div className="summary-card">
                  <div className="summary-icon processing">
                    <FaShoppingCart />
                      </div>
                  <div className="summary-content">
                    <h3>Avg Orders / Customer</h3>
                    <p className="summary-value">
                      {Number(customerSummary?.avgOrdersPerCustomer || 0).toFixed(2)}
                    </p>
                    </div>
                      </div>
                <div className="summary-card">
                  <div className="summary-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="summary-content">
                    <h3>Avg Spend / Customer</h3>
                    <p className="summary-value">
                      ₱{Number(customerSummary?.avgSpentPerCustomer || 0).toFixed(2)}
                    </p>
              </div>
              </div>
          </div>
              <div className="chart-container">
                <ReactEChartsCore
                  echarts={echarts}
                  option={topCustomersOption}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'svg' }}
                  style={{ height: chartHeights.base, width: '100%' }}
                />
                {!hasTopCustomersData && (
                  <div className="chart-empty-state">
                    <p>No customer spend data available</p>
                  </div>
                )}
              </div>
              </>
            )}
          </div>

        {/* Customer Locations */}
        <div className="analytics-card geo-distribution-card">
          <div className="card-header">
            <FaMap className="card-icon" />
            <h3>Customer Locations</h3>
            <button
              className="analytics-header-analyze-btn"
              type="button"
              onClick={() => handleAnalyzeClick('customerLocations', { data: customerLocationsData, filters })}
              disabled={!hasCustomerLocationData}
            >
              Analyze
            </button>
          </div>
          <Suspense
            fallback={
              <div className="analytics-loading-inline">
                <div className="loading-spinner"></div>
                <p>Loading map...</p>
              </div>
            }
          >
            <div className="analytics-map-container" style={{ minHeight: chartHeights.map }}>
              <BranchMap onDataLoaded={setCustomerLocationsData} />
            </div>
          </Suspense>
        </div>

        {/* Sales Forecast */}
        <div className="analytics-card geo-distribution-card">
          <div className="card-header">
            <FaChartArea className="card-icon" />
            <h3>Sales Forecast — {SALES_FORECAST_RANGE_LABELS[salesForecastRange]}</h3>
            <div className="card-controls">
              <button
                type="button"
                className={`time-range-btn ${salesForecastRange === 'nextMonth' ? 'active' : ''}`}
                onClick={() => setSalesForecastRange('nextMonth')}
              >
                Next Month
              </button>
              <button
                type="button"
                className={`time-range-btn ${salesForecastRange === 'restOfYear' ? 'active' : ''}`}
                onClick={() => setSalesForecastRange('restOfYear')}
              >
                Rest of Year
              </button>
              <button
                type="button"
                className={`time-range-btn ${salesForecastRange === 'nextYear' ? 'active' : ''}`}
                onClick={() => setSalesForecastRange('nextYear')}
              >
                Next 12 Months
              </button>
            </div>
              <button
              className="analytics-header-analyze-btn"
                type="button"
              onClick={() => handleAnalyzeClick('salesForecast', { data: salesForecast, filters, range: salesForecastRange })}
              >
                Analyze
              </button>
          </div>
          {forecastSummary && hasSalesForecastData && (
            <div className="analytics-summary forecast-summary">
              <div className="summary-card">
                <div className="summary-icon completed">
                  <FaMoneyBillWave />
              </div>
                <div className="summary-content">
                  <h3>Projected Revenue</h3>
                  <p className="summary-value">₱{formatNumber(Math.round(forecastSummary.projectedRevenue || 0))}</p>
                  <p className="summary-percentage">
                    {typeof forecastSummary.expectedGrowthRate === 'number'
                      ? `${forecastSummary.expectedGrowthRate >= 0 ? '+' : ''}${forecastSummary.expectedGrowthRate.toFixed(1)}% vs baseline`
                      : 'Baseline unavailable'}
                  </p>
              </div>
          </div>
              <div className="summary-card">
                <div className="summary-icon processing">
                  <FaShoppingCart />
        </div>
                <div className="summary-content">
                  <h3>Projected Orders</h3>
                  <p className="summary-value">{formatNumber(Math.round(forecastSummary.projectedOrders || 0))}</p>
                  <p className="summary-percentage">
                    Avg monthly ₱{formatNumber(Math.round(forecastSummary.averageMonthlyRevenue || 0))}
                  </p>
          </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">
                  <FaChartLine />
                        </div>
                <div className="summary-content">
                  <h3>Confidence</h3>
                  <p className="summary-value">
                    {forecastSummary.confidence != null ? `${forecastSummary.confidence}%` : '—'}
                  </p>
                  <p className="summary-percentage">
                    Plan spans {forecastSummary.months || 0} {forecastSummary.months === 1 ? 'month' : 'months'}
                  </p>
                          </div>
                        </div>
              </div>
            )}
          <div className="chart-container">
            <ReactEChartsCore
              echarts={echarts}
              option={salesForecastOption}
              notMerge
              lazyUpdate
              opts={{ renderer: 'svg' }}
              style={{ height: chartHeights.wide, width: '100%' }}
            />
            {forecastLoading ? (
              <div className="chart-empty-state">
                <p>Generating forecast...</p>
              </div>
            ) : !hasSalesForecastData ? (
              <div className="chart-empty-state">
                <p>No forecast data available</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
        )}
      </div>
      <NexusChatModal
        open={isNexusOpen}
        onClose={handleCloseNexus}
        messages={nexusMessages}
        loading={nexusLoading}
        error={nexusError}
        onSend={handleSendNexusMessage}
        activeChart={nexusContext.chartId}
        chartTitle={CHART_LABELS[nexusContext.chartId] || nexusContext.chartId}
        lastSql={nexusContext.lastSql}
        model={nexusContext.model}
        isGeneralConversation={nexusContext.isGeneralConversation}
      />
      <button
        type="button"
        className="nexus-floating-button"
        onClick={handleOpenFloatingChat}
        aria-label="Open Nexus AI chat"
      >
        <FaRobot />
        <span>Chat with Nexus</span>
      </button>
    </div>
  );
};

export default Analytics;

