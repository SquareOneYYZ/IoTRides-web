import React from 'react';
import SelectField from './SelectField';

const styles = {
  statCard: {
    backgroundColor: '#1B1B1B',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid #4c4b4bff',
    minHeight: '160px',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statTitle: {
    fontWeight: 700,
    color: '#94a3b8de',
    fontSize: '18px',
  },
  dropdownWrapper: {
    minWidth: '160px',
  },
  bigText: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '8px',
  },
  smallGreyText: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '12px',
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000079',
    padding: '8px',
    gap: '10px',
    borderRadius: '4px',
  },
  statusLabel: {
    fontSize: '16px',
    color: '#94a3b8c1',
  },
  statusValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
  },
  dayNightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '12px',
  },
  dayNightItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000079',
    padding: '8px',
    gap: '10px',
    borderRadius: '4px',
  },
  dayNightLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#94a3b8',
  },
  dayNightValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#ffffff',
  },
};

const StatCard = ({
  type, data, groups, devices, selectedGroup, selectedDevice, onGroupChange, onDeviceChange, loading,
}) => {
  const formatKm = (meters) => {
    if (!meters && meters !== 0) return '0';
    return (meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatWeekText = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (type === 'vehicleStatus') {
    return (
      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <div style={styles.statTitle}>Vehicle Status</div>
        </div>

        {loading ? (
          <div style={{ color: '#fff', marginTop: '16px' }}>Loading...</div>
        ) : (
          <div style={styles.statusGrid}>
            <div style={styles.statusItem}>
              <div style={{ ...styles.statusValue, color: '#4ade80df' }}>{data?.totalOnline || 0}</div>
              <div style={styles.statusLabel}>Online</div>
            </div>
            <div style={styles.statusItem}>
              <div style={{ ...styles.statusValue, color: '#f87171' }}>{data?.totalOffline || 0}</div>
              <div style={styles.statusLabel}>Offline</div>
            </div>
            <div style={styles.statusItem}>
              <div style={{ ...styles.statusValue, color: '#60a5fa' }}>{data?.totalDriving || 0}</div>
              <div style={styles.statusLabel}>Driving</div>
            </div>
            <div style={styles.statusItem}>
              <div style={styles.statusValue}>{data?.totalParked || 0}</div>
              <div style={styles.statusLabel}>Parked</div>
            </div>
            <div style={styles.statusItem}>
              <div style={styles.statusValue}>{data?.totalInactive || 0}</div>
              <div style={styles.statusLabel}>Inactive</div>
            </div>
            <div style={styles.statusItem}>
              <div style={styles.statusValue}>{data?.totalNoData || 0}</div>
              <div style={styles.statusLabel}>No Data</div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (type === 'weeklyKm') {
    return (
      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <div style={styles.statTitle}>Weekly Stats</div>
          <div style={styles.dropdownWrapper}>
            <SelectField
              label="Group"
              data={groups?.sort((a, b) => a.name.localeCompare(b.name))}
              value={selectedGroup}
              onChange={onGroupChange}
              fullWidth
            />
          </div>
        </div>

        {loading && <div style={{ color: '#fff', marginTop: '16px' }}>Loading...</div>}

        {!loading && data && selectedGroup && (
          <div style={{ marginTop: '16px' }}>
            <div style={styles.bigText}>
              {formatKm(data.weeklyDistanceTraveled)}
              {' '}
              km
            </div>
            <div style={styles.smallGreyText}>
              Week of
              {' '}
              {formatWeekText(new Date())}
            </div>
            <div style={styles.smallGreyText}>
              {data.deviceCount}
              {' '}
              Devices
            </div>
          </div>
        )}

        {!loading && !selectedGroup && (
          <div style={{ color: '#94a3b8', marginTop: '16px' }}>
            Please select a group
          </div>
        )}
      </div>
    );
  }
  if (type === 'dayNightKm') {
    return (
      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <div style={styles.statTitle}>Day/Night Distance</div>
          <div style={styles.dropdownWrapper}>
            <SelectField
              label="Group"
              data={groups?.sort((a, b) => a.name.localeCompare(b.name))}
              value={selectedGroup}
              onChange={onGroupChange}
              fullWidth
            />
          </div>
        </div>

        {loading && <div style={{ color: '#fff', marginTop: '16px' }}>Loading...</div>}

        {!loading && data && selectedGroup && (
        <div style={{ marginTop: '16px' }}>
          <div style={styles.dayNightGrid}>
            <div style={styles.dayNightItem}>
              <div style={{ ...styles.dayNightValue, color: '#fbbf24' }}>
                {formatKm(data.daytimeKm * 1000)}
                {' '}
                km
              </div>
              <div style={styles.dayNightLabel}>Day time</div>
            </div>
            <div style={styles.dayNightItem}>
              <div style={{ ...styles.dayNightValue, color: '#818cf8' }}>
                {formatKm(data.nighttimeKm * 1000)}
                {' '}
                km
              </div>
              <div style={styles.statusLabel}>Night-time</div>
            </div>
          </div>
          <div style={{ ...styles.smallGreyText, marginTop: '12px' }}>
            Last 7 days
          </div>
        </div>
        )}

        {!loading && !selectedGroup && (
        <div style={{ color: '#94a3b8', marginTop: '16px' }}>
          Please select a group
        </div>
        )}
      </div>
    );
  }

  return null;
};

export default StatCard;
