import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faChartLine, faClipboardList, faBoxesStacked, faUsers } from '@fortawesome/free-solid-svg-icons';

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
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Link to="/">
            <img 
              src={logo} 
              alt="YOHANNS Sportswear House" 
              className="logo-image"
            />
          </Link>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className="nav-icon">
              <FontAwesomeIcon icon={item.icon} />
            </div>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <div className="logout-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
