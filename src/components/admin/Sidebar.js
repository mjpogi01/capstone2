import React, { useState } from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../images/yohanns_logo-removebg-preview 3.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faChartLine, 
  faClipboardList, 
  faBoxesStacked, 
  faUsers, 
  faSignOutAlt, 
  faChevronLeft, 
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ activePage, setActivePage, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get user role to determine correct paths
  const userRole = user?.user_metadata?.role || 'customer';
  const basePath = userRole === 'owner' ? '/owner' : '/admin';
  
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: faHouse, path: basePath },
    { id: 'analytics', label: 'Analytics', icon: faChartLine, path: `${basePath}/analytics` },
    { id: 'orders', label: 'Orders', icon: faClipboardList, path: `${basePath}/orders` },
    { id: 'inventory', label: 'Inventory', icon: faBoxesStacked, path: '/inventory' },
    { id: 'accounts', label: 'Accounts', icon: faUsers, path: `${basePath}/accounts` },
  ];

  // Sync collapse state with body class for CSS targeting
  React.useEffect(() => {
    const updateClasses = () => {
      const body = document.body;
      const adminDashboard = document.querySelector('.admin-dashboard');
      const ownerDashboard = document.querySelector('.owner-dashboard');
      const analyticsPage = document.querySelector('.analytics-page');
      const inventoryPage = document.querySelector('.inventory-page');
      
      if (isCollapsed) {
        body.classList.add('sidebar-collapsed');
        if (adminDashboard) adminDashboard.classList.add('sidebar-collapsed');
        if (ownerDashboard) ownerDashboard.classList.add('sidebar-collapsed');
        if (analyticsPage) analyticsPage.classList.add('sidebar-collapsed');
        if (inventoryPage) inventoryPage.classList.add('sidebar-collapsed');
      } else {
        body.classList.remove('sidebar-collapsed');
        if (adminDashboard) adminDashboard.classList.remove('sidebar-collapsed');
        if (ownerDashboard) ownerDashboard.classList.remove('sidebar-collapsed');
        if (analyticsPage) analyticsPage.classList.remove('sidebar-collapsed');
        if (inventoryPage) inventoryPage.classList.remove('sidebar-collapsed');
      }
    };

    // Immediate update
    updateClasses();
    
    // Also update after a small delay to catch dynamically loaded components
    const timeoutId = setTimeout(updateClasses, 100);
    
    return () => {
      clearTimeout(timeoutId);
      const body = document.body;
      const adminDashboard = document.querySelector('.admin-dashboard');
      const ownerDashboard = document.querySelector('.owner-dashboard');
      const analyticsPage = document.querySelector('.analytics-page');
      const inventoryPage = document.querySelector('.inventory-page');
      
      body.classList.remove('sidebar-collapsed');
      if (adminDashboard) adminDashboard.classList.remove('sidebar-collapsed');
      if (ownerDashboard) ownerDashboard.classList.remove('sidebar-collapsed');
      if (analyticsPage) analyticsPage.classList.remove('sidebar-collapsed');
      if (inventoryPage) inventoryPage.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenuItemClick = (itemId) => {
    setActivePage(itemId);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCloseMobileMenu = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={handleCloseMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src={logo} alt="YOHANNS" className="sidebar-logo-img" />
          </Link>
          
          {/* Collapse Button */}
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <Link
                  to={item.path}
                  className={`admin-nav-link ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(item.id)}
                  data-tooltip={item.label}
                >
                  <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="admin-logout-button"
            onClick={handleLogout}
            data-tooltip="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="admin-logout-icon" />
            {!isCollapsed && <span className="admin-logout-text">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
