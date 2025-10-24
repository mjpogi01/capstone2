import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faChartLine, faClipboardList, faBoxesStacked, faUsers, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ activePage, setActivePage }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Get user role to determine correct paths
  const userRole = user?.user_metadata?.role || 'customer';
  const basePath = userRole === 'owner' ? '/owner' : '/admin';
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: faHouse, path: basePath },
    { id: 'analytics', label: 'Analytics', icon: faChartLine, path: `${basePath}/analytics` },
    { id: 'orders', label: 'Orders', icon: faClipboardList, path: `${basePath}/orders` },
    { id: 'inventory', label: 'Inventory', icon: faBoxesStacked, path: '/inventory' },
    { id: 'accounts', label: 'Accounts', icon: faUsers, path: `${basePath}/accounts` },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <img
            src={logo}
            alt="YOHANNS Sportswear House"
            className="sidebar-logo-image"
          />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className="sidebar-nav-icon">
              <FontAwesomeIcon icon={item.icon} />
            </div>
            <span className="sidebar-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
        >
          <div className="sidebar-logout-icon">
            <FontAwesomeIcon icon={faSignOutAlt} />
          </div>
          <span className="sidebar-logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
