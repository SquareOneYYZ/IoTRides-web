import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Description,
  Menu,
  MoreVert,
  Settings,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardSidebar } from '../common/components/DashboardSidebar';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#212121',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Geist", Roboto, sans-serif',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: 'none',
  },
  overlayVisible: {
    display: 'block',
  },
  mainContent: {
    marginLeft: '250px',
    transition: 'margin-left 0.3s ease-in-out',
  },
  header: {
    borderBottom: '1px solid #1f2937',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0A',
    borderRadius: '20px 20px 0px 0px',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '8px',
  },
  content: {
    padding: '16px',
    backgroundColor: '#0A0A0A',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #4c4b4bff',
  },
  statTitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
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
  chartSection: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #4c4b4bff',
    marginBottom: '32px',
  },
  chartHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  timeRangeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    borderRadius: '8px',
    border: '1px solid #616161',
    width: 'fit-content',
  },
  timeRangeBtn: {
    padding: '8px 12px',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    transition: 'background-color 0.2s, color 0.2s',
    minWidth: '90px',
  },
  tableSection: {
    backgroundColor: '#1B1B1B',
    borderRadius: '12px',
    border: '1px solid #4c4b4bff',
    overflowX: 'auto',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #3F3E3E',
  },
  tabButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '5px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
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

const StatCard = ({ title, value, change, trend, subtitle, description }) => (
  <div style={styles.statCard}>
    <div style={styles.statTitle}>{title}</div>
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', marginBottom: '12px' }}>
      <span style={styles.statValue}>{value}</span>
      <span
        style={{
          ...styles.statChange,
          color: trend === 'up' ? '#4ade80' : '#f87171',
        }}
      >
        {trend === 'up' ? <TrendingUp style={{ fontSize: 16 }} /> : <TrendingDown style={{ fontSize: 16 }} />}
        {change}
      </span>
    </div>
    <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {trend === 'up' ? <TrendingUp style={{ fontSize: 16 }} /> : <TrendingDown style={{ fontSize: 16 }} />}
      {subtitle}
    </div>
    <div style={{ fontSize: '14px', color: '#64748b' }}>{description}</div>
  </div>
);

const TableRow = ({ item, status, target, limit, reviewer }) => (
  <tr style={{ transition: 'background-color 0.2s' }}>
    <td style={styles.td}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input type="checkbox" style={{ width: 16, height: 16, cursor: 'pointer' }} />
        <button type="button" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Menu style={{ fontSize: 16 }} />
        </button>
        <span style={{ color: '#e2e8f0' }}>{item}</span>
      </div>
    </td>
    <td style={{ ...styles.td, color: '#94a3b8' }}>{item}</td>
    <td style={styles.td}>
      <span
        style={{
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
        <div
          style={{
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
      <button type="button" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <MoreVert style={{ fontSize: 16 }} />
      </button>
    </td>
  </tr>
);

export const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ranges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];

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
      <style>
        {`
          @media (max-width: 767px) {
            .main-content-mobile {
              margin-left: 0 !important;
            }
          }
          @media (min-width: 768px) and (max-width: 1024px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 640px) {
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
            .chart-header {
              align-items: flex-start !important;
            }
            .table-header {
              align-items: flex-start !important;
            }
          }
        `}
      </style>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          style={{ ...styles.overlay, ...styles.overlayVisible }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Content */}
      <div style={styles.mainContent} className="main-content-mobile">
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="hamburger-btn"
              style={styles.hamburger}
            >
              <Menu style={{ fontSize: 24 }} />
            </button>
            <Description style={{ fontSize: 20 }} />
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Dashboard</h1>
          </div>
        </div>

        <div style={styles.content}>
          {/* Stats Grid */}
          <div style={styles.statsGrid} className="stats-grid">
            <StatCard
              title="Total Active Vehicles"
              value="1,250"
              change="+12.5%"
              trend="up"
              subtitle="Trending up this month"
              description="Vehicles tracked in last 6 months"
            />
            <StatCard
              title="Active Trips"
              value="1,234"
              change="-20%"
              trend="down"
              subtitle="Down 20% this period"
              description="Trip monitoring needs attention"
            />
            <StatCard
              title="Total Distance (km)"
              value="45,678"
              change="+12.5%"
              trend="up"
              subtitle="Strong performance"
              description="Distance exceeds targets"
            />
            <StatCard
              title="Fleet Efficiency"
              value="94.5%"
              change="+4.5%"
              trend="up"
              subtitle="Steady performance increase"
              description="Meets efficiency projections"
            />
          </div>

          {/* Chart Section */}
          <div style={styles.chartSection}>
            <div style={styles.chartHeader} className="chart-header">
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
            <div style={styles.tableHeader} className="table-header">
              <div style={styles.tabButtons}>
                <button type="button" style={{ ...styles.tabBtn, backgroundColor: '#404040', color: '#ffffff' }}>
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
                  Customize
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
                  <th aria-label="actions" style={styles.th} />
                </tr>
              </thead>
              <tbody>
                <TableRow item="Cover page" status="In Process" target="18" limit="5" reviewer="Eddie Lake" />
                <TableRow item="Table of contents" status="Done" target="29" limit="24" reviewer="Eddie Lake" />
                <TableRow item="Executive summary" status="Done" target="10" limit="13" reviewer="Eddie Lake" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
