import React, { useState } from 'react';
import './OwnerDashboard.css';
import Sidebar from '../../components/admin/Sidebar';
import MetricsCards from '../../components/admin/MetricsCards';
import EarningsChart from '../../components/admin/EarningsChart';
import StocksTable from '../../components/admin/StocksTable';
import RecentOrders from '../../components/admin/RecentOrders';
import PopularProducts from '../../components/admin/PopularProducts';

const OwnerDashboard = () => {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="owner-dashboard">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="owner-main-content">
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
      </div>
    </div>
  );
};

export default OwnerDashboard;
