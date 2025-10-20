import React, { useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import '../admin/AdminDashboard.css';
import Orders from '../../components/admin/Orders';

const OrdersPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`admin-dashboard ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar
        activePage={'orders'}
        setActivePage={() => {}}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
      />
      <div className="admin-main-content">
        <Orders />
      </div>
    </div>
  );
};

export default OrdersPage;
