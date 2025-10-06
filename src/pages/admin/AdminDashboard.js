import React, { useState } from 'react';
import './AdminDashboard.css';
import Sidebar from '../../components/admin/Sidebar';
import MetricsCards from '../../components/admin/MetricsCards';
import EarningsChart from '../../components/admin/EarningsChart';
import StocksTable from '../../components/admin/StocksTable';
import RecentOrders from '../../components/admin/RecentOrders';
import PopularProducts from '../../components/admin/PopularProducts';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="admin-dashboard">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="admin-main-content">
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

export default AdminDashboard;
