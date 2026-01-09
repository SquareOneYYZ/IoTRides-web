import React from 'react';
import {
  Navigation,
  Place,
  Settings,
  Help,
  Search,
  BarChart,
  PieChart,
  MoreHoriz,
  Devices,
  Notifications,
  Close,
} from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';

const styles = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '250px',
    backgroundColor: '#212121',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1000,
  },
  sidebarHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  logo: {
    color: '#3b82f6',
    fontSize: '24px',
  },
  brandName: {
    fontWeight: 600,
    fontSize: '18px',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#fff',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    backgroundColor: 'transparent',
  },
  activeNavStyle: {
    backgroundColor: '#f5f5f5',
    color: '#000',
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: '12px',
    color: '#6b7280',
    padding: '0 12px',
    marginTop: '16px',
    marginBottom: '8px',
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #1f2937',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '8px',
  },
};

export const DashboardSidebar = ({ isOpen, onClose, activeNav, setActiveNav }) => {
  const sidebarStructure = {
    main: [
      { key: 'dashboard', label: 'Dashboard', href: '#', icon: BarChart },
      { key: 'mapView', label: 'Map View', href: '#', icon: Place },
    ],
    reports: [
      { key: 'eventsReport', label: 'Events Report', href: '#', icon: BarChart },
      { key: 'geofence', label: 'Geofence Activity', href: '#', icon: Place },
      { key: 'trips', label: 'Trips Report', href: '#', icon: PieChart },
      { key: 'reportsMore', label: 'More', href: '#', icon: MoreHoriz },
    ],
    settings: [
      { key: 'devices', label: 'Devices', href: '#', icon: Devices },
      { key: 'preferences', label: 'Preferences', href: '#', icon: Settings },
      { key: 'notifications', label: 'Notifications', href: '#', icon: Notifications },
      { key: 'settingsMore', label: 'More', href: '#', icon: MoreHoriz },
    ],
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeNav === item.key;

    return (
      <a
        key={item.key}
        href={item.href}
        style={{
          ...styles.navLink,
          ...(isActive ? styles.activeNavStyle : {}),
        }}
        onClick={(e) => {
          e.preventDefault();
          setActiveNav(item.key);
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = '#313131ff';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Icon style={{ fontSize: 20, color: isActive ? '#000' : '#9ca3af' }} />
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 767px) {
            .sidebar-mobile {
              transform: translateX(-100%);
            }
            .sidebar-open {
              transform: translateX(0);
            }
            .hamburger-btn {
              display: flex !important;
            }
          }
          @media (min-width: 768px) {
            .sidebar-mobile {
              transform: translateX(0) !important;
            }
          }
        `}
      </style>
      <div style={styles.sidebar} className={`sidebar-mobile ${isOpen ? 'sidebar-open' : ''}`}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation style={styles.logo} />
            <span style={styles.brandName}>IOT Rides</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hamburger-btn"
            style={{
              ...styles.hamburger,
              display: 'flex',
            }}
          >
            <Close style={{ fontSize: 24 }} />
          </button>
        </div>

        <nav style={styles.nav}>
          {sidebarStructure.main.map(renderNavItem)}

          <div style={styles.sectionTitle}>Reports</div>
          {sidebarStructure.reports.map(renderNavItem)}

          <div style={styles.sectionTitle}>Settings</div>
          {sidebarStructure.settings.map(renderNavItem)}
        </nav>

        <div style={styles.sidebarFooter}>
          <a
            href="#"
            style={styles.navLink}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings style={{ fontSize: 20 }} />
            <span>Settings</span>
          </a>
          <a
            href="#"
            style={styles.navLink}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Help style={{ fontSize: 20 }} />
            <span>Get Help</span>
          </a>
          <a
            href="#"
            style={styles.navLink}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Search style={{ fontSize: 20 }} />
            <span>Search</span>
          </a>
          <a
            href="#"
            style={styles.navLink}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <PersonIcon style={{ fontSize: 20 }} />
            <span>Logout</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
