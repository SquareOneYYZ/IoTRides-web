import React, { useState } from 'react';
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
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import RouteIcon from '@mui/icons-material/Route';
import FolderIcon from '@mui/icons-material/Folder';
import CreateIcon from '@mui/icons-material/Create';

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
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#fff',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: '8px',
  },
  accordionContent: {
    paddingLeft: '12px',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out',
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #424242',
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

export const DashboardSidebar = ({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
}) => {
  const [reportsOpen, setReportsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const sidebarStructure = {
    main: [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: BarChart },
      { key: 'mapView', label: 'Map View', href: '/', icon: Place },
    ],
    reports: [
      {
        key: 'eventsReport',
        label: 'Events Report',
        href: '/reports/event',
        icon: BarChart,
      },
      { key: 'geofence', label: 'Geofence Activity', href: '/reports/geofence-activity', icon: Place },
      { key: 'trips', label: 'Trips Report', href: '/reports/trip', icon: PieChart },
      { key: 'replay', label: 'Replay', href: '/reports/replay', icon: RouteIcon },
      { key: 'stops', label: 'Stops', href: '/reports/stop', icon: PauseCircleFilledIcon },
      { key: 'reportsMore', label: 'More', href: '/reports/combined', icon: MoreHoriz },
    ],
    settings: [
      { key: 'devices', label: 'Devices', href: '/settings/devices', icon: Devices },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/settings/notifications',
        icon: Notifications,
      },
      {
        key: 'Groups',
        label: 'Groups',
        href: '/settings/groups',
        icon: FolderIcon,
      }, {
        key: 'geofences',
        label: 'Geofences',
        href: '/settings/geofences',
        icon: CreateIcon,
      },
      { key: 'preferences', label: 'Preferences', href: '/settings/preferences', icon: Settings },
      { key: 'settingsMore', label: 'More', href: '/settings/preferences', icon: MoreHoriz },
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

    /* Custom Scrollbar */
    .sidebar-mobile::-webkit-scrollbar {
      width: 1px;
    }

    .sidebar-mobile::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-mobile::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 10px;
      transition: background-color 0.3s;
    }

    .sidebar-mobile:hover::-webkit-scrollbar-thumb {
      background-color: #555;
    }

    .sidebar-mobile::-webkit-scrollbar-thumb:hover {
      background-color: #777;
    }

    /* Firefox */
    .sidebar-mobile {
      scrollbar-width: thin;
      scrollbar-color: #555 transparent;
    }
      `}
      </style>

      <div
        style={styles.sidebar}
        className={`sidebar-mobile ${isOpen ? 'sidebar-open' : ''}`}
      >
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
            }}
          >
            <Close style={{ fontSize: 24 }} />
          </button>
        </div>

        <nav style={styles.nav}>
          {sidebarStructure.main.map(renderNavItem)}

          {/* Reports Accordion */}
          <div>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => setReportsOpen(!reportsOpen)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Reports</span>
              {reportsOpen ? <ExpandLess /> : <ExpandMore />}
            </button>
            <div
              style={{
                ...styles.accordionContent,
                maxHeight: reportsOpen ? '500px' : '0',
              }}
            >
              {sidebarStructure.reports.map(renderNavItem)}
            </div>
          </div>

          {/* Settings Accordion */}
          <div>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => setSettingsOpen(!settingsOpen)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#313131ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Settings</span>
              {settingsOpen ? <ExpandLess /> : <ExpandMore />}
            </button>
            <div
              style={{
                ...styles.accordionContent,
                maxHeight: settingsOpen ? '500px' : '0',
              }}
            >
              {sidebarStructure.settings.map(renderNavItem)}
            </div>
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <a
            href="/settings/preferences"
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
