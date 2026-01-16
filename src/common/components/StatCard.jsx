import React, { useEffect, useState } from 'react';
import SelectField from './SelectField';

const styles = {
  statCard: {
    backgroundColor: '#1B1B1B',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #4c4b4bff',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statTitle: {
    color: '#94a3b8',
    fontSize: '14px',
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
};

const StatCard = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const formatKm = (meters) => {
    if (!meters) return '0';
    return (meters / 1000).toLocaleString();
  };

  const formatWeekText = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error('Failed to load groups', err);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;

    const fetchWeeklyData = async () => {
      setLoading(true);
      try {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 7);

        const url = `/api/dashboard/weeklykm?groupId=${selectedGroup}&from=${from.toISOString()}&to=${to.toISOString()}`;

        const res = await fetch(url);
        const data = await res.json();
        const firstItem = data?.[0];
        setWeeklyData(firstItem);
      } catch (err) {
        console.error('Weekly API failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [selectedGroup]);

  return (
    <div style={styles.statCard}>
      <div style={styles.statHeader}>
        <div style={styles.statTitle}>Weekly Stats</div>

        <div style={styles.dropdownWrapper}>
          <SelectField
            label="Group"
            data={groups.sort((a, b) => a.name.localeCompare(b.name))}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {loading && <div style={{ color: '#fff' }}>Loading...</div>}

      {weeklyData && (
      <div style={{ marginTop: '16px' }}>
        <div style={styles.bigText}>
          {formatKm(weeklyData.weeklyDistanceTraveled)}
          {' '}
          km week of
          {' '}
          {formatWeekText(new Date())}
        </div>

        <div style={styles.smallGreyText}>
          {weeklyData.deviceCount}
          {' '}
          Devices
        </div>
      </div>
      )}

    </div>
  );
};

export default StatCard;
