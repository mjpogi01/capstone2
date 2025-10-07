import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';

const Sidebar = ({ activePage, setActivePage }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/admin' },
    { id: 'analytics', label: 'Analytics', icon: '📊', path: '/admin/analytics' },
    { id: 'orders', label: 'Orders', icon: '📋', path: '/admin/orders' },
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/inventory' },
    { id: 'accounts', label: 'Accounts', icon: '👥', path: '/admin/accounts' },
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
              {item.id === 'home' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              )}
              {item.id === 'analytics' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11z"/>
                </svg>
              )}
              {item.id === 'orders' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              )}
              {item.id === 'inventory' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2l-2-2H8L6 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
                </svg>
              )}
              {item.id === 'accounts' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H17c-.8 0-1.54.37-2.01.99L14 9.5c-.47-.62-1.21-.99-2.01-.99h-1.54c-.8 0-1.54.37-2.01.99L7 9.5c-.47-.62-1.21-.99-2.01-.99H3.46c-.8 0-1.54.37-2.01.99L-1.5 15.5 1 18h2.5v4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2z"/>
                </svg>
              )}
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
