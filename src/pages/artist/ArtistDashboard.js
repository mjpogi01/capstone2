import React, { useState } from 'react';
import './ArtistDashboard.css';
import '../admin/admin-shared.css';
import ArtistSidebar from '../../components/artist/ArtistSidebar';
import ArtistMetricsCards from '../../components/artist/ArtistMetricsCards';
import ArtistTasksTable from '../../components/artist/ArtistTasksTable';
import ArtistWorkloadChart from '../../components/artist/ArtistWorkloadChart';
import ArtistProfile from '../../components/artist/ArtistProfile';
import ArtistChatList from '../../components/artist/ArtistChatList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const ArtistDashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const getPageTitle = () => {
    switch (activePage) {
      case 'home':
        return 'Artist Dashboard';
      case 'tasks':
        return 'My Tasks';
      case 'profile':
        return 'My Profile';
      case 'workload':
        return 'Workload Overview';
      case 'chats':
        return 'Customer Chats';
      default:
        return 'Artist Dashboard';
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <div className="dashboard-content">
            <ArtistMetricsCards />
            <div className="dashboard-grid">
              <div className="dashboard-left">
                <ArtistWorkloadChart />
              </div>
              <div className="dashboard-right">
                <ArtistTasksTable limit={5} showHeader={true} />
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return <ArtistTasksTable />;
      case 'profile':
        return <ArtistProfile />;
      case 'workload':
        return <ArtistWorkloadChart fullWidth={true} />;
      case 'chats':
        return <ArtistChatList />;
      default:
        return (
          <div className="dashboard-content">
            <ArtistMetricsCards />
            <div className="dashboard-grid">
              <div className="dashboard-left">
                <ArtistWorkloadChart />
              </div>
              <div className="dashboard-right">
                <ArtistTasksTable limit={5} showHeader={true} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`artist-dashboard ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      {/* Sidebar */}
      <ArtistSidebar 
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h1>{getPageTitle()}</h1>
          <div className="user-info">
            <span className="welcome-text">Welcome, {user?.user_metadata?.full_name || 'Artist'}!</span>
          </div>
        </div>

        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
