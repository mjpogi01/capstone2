import React from 'react';
import './ArtistSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faTasks, 
  faUser, 
  faChartBar,
  faComments,
  faSignOutAlt,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const ArtistSidebar = ({ 
  activePage, 
  setActivePage, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}) => {
  const { logout } = useAuth();

  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: faHome,
      path: '/artist'
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: faTasks,
      path: '/artist/tasks'
    },
    {
      id: 'workload',
      label: 'Workload',
      icon: faChartBar,
      path: '/artist/workload'
    },
    {
      id: 'chats',
      label: 'Customer Chats',
      icon: faComments,
      path: '/artist/chats'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: faUser,
      path: '/artist/profile'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`artist-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🎨</div>
            {!isCollapsed && (
              <div className="logo-text">
                <h3>Artist Portal</h3>
                <p>Design Management</p>
              </div>
            )}
          </div>
          
          {/* Collapse Button */}
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`artist-nav-link ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsMobileOpen(false);
                  }}
                  data-tooltip={item.label}
                >
                  <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default ArtistSidebar;
