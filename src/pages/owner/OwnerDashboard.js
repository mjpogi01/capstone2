import React, { useState } from 'react';
import './OwnerDashboard.css';
import '../admin/admin-shared.css';
import Sidebar from '../../components/admin/Sidebar';
import MetricsCards from '../../components/admin/MetricsCards';
import EarningsChart from '../../components/admin/EarningsChart';
import StocksTable from '../../components/admin/StocksTable';
import RecentOrders from '../../components/admin/RecentOrders';
import PopularProducts from '../../components/admin/PopularProducts';
import Orders from '../../components/admin/Orders';
import Analytics from '../admin/Analytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';

const OwnerDashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getPageTitle = () => {
    switch (activePage) {
      case 'home':
        return 'Owner Dashboard';
      case 'orders':
        return 'Orders';
      case 'analytics':
        return 'Analytics';
      default:
        return 'Owner Dashboard';
    }
  };

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
    <div className={`owner-dashboard ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Mobile Header with Burger Menu */}
      <header className="owner-mobile-header">
        <button 
          className="mobile-burger-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className="mobile-header-logo">
          <img src={logo} alt="YOHANNS" />
        </div>
        <div className="mobile-header-title">{getPageTitle()}</div>
      </header>

      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="owner-main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default OwnerDashboard;
