import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  People,
  DirectionsCar,
  Navigation,
  Place,
  Settings,
  Description,
  Help,
  Search,
  Menu,
  MoreVert,
  BarChart,
  PieChart,
} from '@mui/icons-material';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PersonIcon from '@mui/icons-material/Person';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#212121',
    padding: 15,
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Geist", Roboto, sans-serif',
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '235px',
    backgroundColor: '#212121',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
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
  quickCreateBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#212121',
    borderRadius: '8px',
    fontSize: '14px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
    fontSize: '16px',
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
  activeIconStyle: {
    color: '#000',
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
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  mainContent: {
    marginLeft: '224px',
  },
  header: {
    borderBottom: '1px solid #1f2937',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0A',
    borderRadius: '20px 20px 0px 0px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  content: {
    padding: '32px',
    backgroundColor: '#0A0A0A',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #4c4b4bff',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  statIconWrapper: {
    padding: '8px',
    backgroundColor: '#334155',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '30px',
    fontWeight: 600,
    color: '#ffffff',
    marginRight: '8px',
  },
  statChange: {
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#ffffff',
    marginBottom: '4px',
  },
  statDescription: {
    fontSize: '14px',
    color: '#64748b',
  },
  chartSection: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #4c4b4bff',
    marginBottom: '32px',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  timeRangeButtons: {
    display: 'flex',
    borderRadius: '8px',
    border: '1px solid #616161',
  },
  timeRangeBtn: {
    padding: '8px 12px',
    border: 'none',
    overflow: 'hidden',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    transition: 'background-color 0.2s, color 0.2s',
    minWidth: '110px',
  },
  tableSection: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    border: '1px solid #4c4b4bff',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: '1px solid #3F3E3E',
  },
  tabButtons: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '5px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: 500,
    borderBottom: '1px solid #3F3E3E',
  },
  td: {
    padding: '16px',
    borderTop: '1px solid #3F3E3E',
  },
};

const StatCard = ({ title, value, change, trend, subtitle, description, icon: Icon }) => (
  <div style={styles.statCard}>
    <div style={styles.statHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={styles.statTitle}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
            <span style={styles.statValue}>{value}</span>
            <span style={{
              ...styles.statChange,
              color: trend === 'up' ? '#4ade80' : '#f87171',
            }}
            >
              {trend === 'up' ? <TrendingUp style={{ fontSize: 16 }} /> : <TrendingDown style={{ fontSize: 16 }} />}
              {change}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div style={styles.statSubtitle}>
        {trend === 'up' ? <TrendingUp style={{ fontSize: 16 }} /> : <TrendingDown style={{ fontSize: 16 }} />}
        {subtitle}
      </div>
      <div style={styles.statDescription}>{description}</div>
    </div>
  </div>
);

const TableRow = ({ item, status, target, limit, reviewer }) => (
  <tr style={{ transition: 'background-color 0.2s' }}>
    <td style={styles.td}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input type="checkbox" style={{ width: 16, height: 16, cursor: 'pointer' }} />
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
          }}
        >
          <Menu style={{ fontSize: 16 }} />
        </button>
        <span style={{ color: '#e2e8f0' }}>{item}</span>
      </div>
    </td>
    <td style={{ ...styles.td, color: '#94a3b8' }}>{item}</td>
    <td style={styles.td}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        backgroundColor: status === 'Done' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
        color: status === 'Done' ? '#4ade80' : '#fbbf24',
      }}
      >
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: status === 'Done' ? '#4ade80' : '#fbbf24',
        }}
        />
        {status}
      </span>
    </td>
    <td style={{ ...styles.td, color: '#e2e8f0' }}>{target}</td>
    <td style={{ ...styles.td, color: '#e2e8f0' }}>{limit}</td>
    <td style={{ ...styles.td, color: '#e2e8f0' }}>{reviewer}</td>
    <td style={styles.td}>
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
        }}
      >
        <MoreVert style={{ fontSize: 16 }} />
      </button>
    </td>
  </tr>
);

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [activeNav, setActiveNav] = useState('dashboard');
  const ranges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];

  const sidebarItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '#',
      icon: BarChart,
    },
    {
      key: 'devices',
      label: 'Devices',
      href: '#',
      icon: Place,
    },
    {
      key: 'mapView',
      label: 'Map View',
      href: '#',
      icon: BarChart,
    },
    {
      key: 'projects',
      label: 'Projects',
      href: '#',
      icon: PieChart,
    },
    {
      key: 'team',
      label: 'Team',
      href: '#',
      icon: People,
    },
  ];

  const visitorData = [
    { date: 'Apr 7', value: 320, vehicles: 180 },
    { date: 'Apr 13', value: 380, vehicles: 220 },
    { date: 'Apr 19', value: 420, vehicles: 250 },
    { date: 'Apr 26', value: 350, vehicles: 200 },
    { date: 'May 2', value: 480, vehicles: 280 },
    { date: 'May 8', value: 520, vehicles: 310 },
    { date: 'May 14', value: 450, vehicles: 260 },
    { date: 'May 21', value: 580, vehicles: 340 },
    { date: 'May 28', value: 620, vehicles: 370 },
    { date: 'Jun 3', value: 550, vehicles: 320 },
    { date: 'Jun 9', value: 680, vehicles: 410 },
    { date: 'Jun 15', value: 720, vehicles: 450 },
    { date: 'Jun 22', value: 650, vehicles: 390 },
    { date: 'Jun 30', value: 780, vehicles: 480 },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <Navigation style={styles.logo} />
          <span style={styles.brandName}>IOT Rides</span>
        </div>

        <nav style={styles.nav}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;

            return (
              <a
                href={item.href}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.activeNavStyle : {}),
                }}
                onClick={() => setActiveNav(item.key)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#313131ff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}

              >
                <Icon
                  style={{
                    fontSize: 20,
                    color: isActive ? '#000' : '#9ca3af',
                  }}
                />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <a href="#" style={styles.navLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313131ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Settings style={{ fontSize: 20 }} />
            <span>Settings</span>
          </a>
          <a href="#" style={styles.navLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313131ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Help style={{ fontSize: 20 }} />
            <span>Get Help</span>
          </a>
          <a href="#" style={styles.navLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313131ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Search style={{ fontSize: 20 }} />
            <span>Search</span>
          </a>
          <a href="#" style={styles.navLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313131ff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <PersonIcon style={{ fontSize: 20 }} />
            <span>Logout</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Description style={{ fontSize: 20 }} />
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Dashboard</h1>
          </div>
        </div>

        <div style={styles.content}>
          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <StatCard
              title="Total Active Vehicles"
              value="1,250"
              change="+12.5%"
              trend="up"
              subtitle="Trending up this month"
              description="Vehicles tracked in last 6 months"
              icon={Navigation}
            />
            <StatCard
              title="Active Trips"
              value="1,234"
              change="-20%"
              trend="down"
              subtitle="Down 20% this period"
              description="Trip monitoring needs attention"
              icon={Place}
            />
            <StatCard
              title="Total Distance (km)"
              value="45,678"
              change="+12.5%"
              trend="up"
              subtitle="Strong performance"
              description="Distance exceeds targets"
              icon={DirectionsCar}
            />
            <StatCard
              title="Fleet Efficiency"
              value="94.5%"
              change="+4.5%"
              trend="up"
              subtitle="Steady performance increase"
              description="Meets efficiency projections"
              icon={TrendingUp}
            />
          </div>

          {/* Chart Section */}
          <div style={styles.chartSection}>
            <div style={styles.chartHeader}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Vehicle Activity</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Total for the last 3 months</p>
              </div>
              <div style={styles.timeRangeButtons}>
                {ranges.map((range, index) => {
                  const isActive = timeRange === range;
                  const isFirst = index === 0;
                  const isLast = index === ranges.length - 1;

                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      style={{
                        ...styles.timeRangeBtn,
                        backgroundColor: isActive ? '#404040' : 'transparent',
                        color: isActive ? '#ffffff' : '#94a3b8',

                        borderTopLeftRadius: isFirst ? '8px' : 0,
                        borderBottomLeftRadius: isFirst ? '8px' : 0,
                        borderTopRightRadius: isLast ? '8px' : 0,
                        borderBottomRightRadius: isLast ? '8px' : 0,
                        borderLeft: index !== 0 ? '1px solid #404040' : 'none',
                      }}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={visitorData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid #272727',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="vehicles" stroke="#9ca3af" fillOpacity={1} fill="url(#colorVehicles)" strokeWidth={2} />
                <Area type="monotone" dataKey="value" stroke="#6b7280" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div style={styles.tabButtons}>
                <button
                  type="button"
                  style={{ ...styles.tabBtn, backgroundColor: '#404040', color: '#ffffff' }}
                >
                  Outline
                </button>
                <button type="button" style={{ ...styles.tabBtn, backgroundColor: 'transparent', color: '#94a3b8' }}>
                  Past Performance
                  {' '}
                  <span style={{ marginLeft: 4, fontSize: 12, backgroundColor: '#404040', padding: '2px 6px', borderRadius: 4 }}>3</span>
                </button>
                <button type="button" style={{ ...styles.tabBtn, backgroundColor: 'transparent', color: '#94a3b8' }}>
                  Key Vehicles
                  {' '}
                  <span style={{ marginLeft: 4, fontSize: 12, backgroundColor: '#404040', padding: '2px 6px', borderRadius: 4 }}>2</span>
                </button>
                <button type="button" style={{ ...styles.tabBtn, backgroundColor: 'transparent', color: '#94a3b8' }}>
                  Focus Documents
                </button>
              </div>
              <div style={styles.actionButtons}>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #4C4B4B',
                    backgroundColor: 'transparent',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Settings style={{ fontSize: 16 }} />
                  Customize Columns
                </button>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#404040',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>+</span>
                  {' '}
                  Add Section
                </button>
              </div>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Header</th>
                  <th style={styles.th}>Section Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Limit</th>
                  <th style={styles.th}>Reviewer</th>
                  <th aria-label="demo-text" style={styles.th} />
                </tr>
              </thead>
              <tbody>
                <TableRow
                  item="Cover page"
                  status="In Process"
                  target="18"
                  limit="5"
                  reviewer="Eddie Lake"
                />
                <TableRow
                  item="Table of contents"
                  status="Done"
                  target="29"
                  limit="24"
                  reviewer="Eddie Lake"
                />
                <TableRow
                  item="Executive summary"
                  status="Done"
                  target="10"
                  limit="13"
                  reviewer="Eddie Lake"
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
