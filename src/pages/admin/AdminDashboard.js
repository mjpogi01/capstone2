import React, { useState } from 'react';
import './AdminDashboard.css';
import './admin-shared.css';
import Sidebar from '../../components/admin/Sidebar';
import MetricsCards from '../../components/admin/MetricsCards';
import EarningsChart from '../../components/admin/EarningsChart';
import StocksTable from '../../components/admin/StocksTable';
import RecentOrders from '../../components/admin/RecentOrders';
import PopularProducts from '../../components/admin/PopularProducts';
import Orders from '../../components/admin/Orders';
import Analytics from './Analytics';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <div className="dashboard-content">
            <MetricsCards />
            <div className="dashboard-grid">
              <div className="dashboard-left">
                <EarningsChart />
              </div>
              <div className="dashboard-right">
                <StocksTable />
                <PopularProducts />
              </div>
            </div>
            <RecentOrders />
          </div>
        );
      case 'orders':
        return <Orders />;
      case 'analytics':
        return <Analytics />;
      default:
        return (
          <div className="dashboard-content">
            <MetricsCards />
            <div className="dashboard-grid">
              <div className="dashboard-left">
                <EarningsChart />
              </div>
              <div className="dashboard-right">
                <StocksTable />
                <PopularProducts />
              </div>
            </div>
            <RecentOrders />
          </div>
        );
    }
  };

  return (
    <div className={`admin-dashboard ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
      />
      <div className="admin-main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
