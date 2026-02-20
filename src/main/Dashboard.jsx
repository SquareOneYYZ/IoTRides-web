import React, { useState, useEffect } from 'react';
import { Description, Menu } from '@mui/icons-material';
import {
  Box, Typography, IconButton, Button, ButtonGroup, Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardSidebar } from '../common/components/DashboardSidebar';
import StatCard from '../common/components/StatCard';
import { useTranslation } from '../common/components/LocalizationProvider';
import DashboardEventsTable from '../common/components/DashboardEventsTable';

const DashboardPage = () => {
  const theme = useTheme();
  const t = useTranslation();

  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [vehicleStatus, setVehicleStatus] = useState({
    totalOnline: 0,
    totalOffline: 0,
    totalUnknown: 0,
    totalDriving: 0,
    totalParked: 0,
    totalInactive: 0,
    totalNoData: 0,
  });
  const [statLoading, setStatLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [weeklyKmData, setWeeklyKmData] = useState(null);
  const [dayNightKmData, setDayNightKmData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [weeklyKmLoading, setWeeklyKmLoading] = useState(false);
  const [dayNightKmLoading, setDayNightKmLoading] = useState(false);
  const [selectedGroupForDayNight, setSelectedGroupForDayNight] = useState('');

  const ranges = [t('reportThisMonth'), t('reportThisWeek'), t('reportToday')];

  useEffect(() => {
    (async () => {
      try {
        setStatLoading(true);
        const r = await fetch('/api/dashboard/vehiclestatus');
        if (r.ok) setVehicleStatus(await r.json());
      } catch (e) { console.error(e); } finally { setStatLoading(false); }
      try {
        const r = await fetch('/api/groups');
        if (r.ok) setGroups(await r.json());
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setWeeklyKmData(null); return; }
    (async () => {
      setWeeklyKmLoading(true);
      try {
        const to = new Date(); const from = new Date();
        from.setDate(to.getDate() - 7);
        const r = await fetch(`/api/dashboard/weeklykm?groupId=${selectedGroup}&from=${from.toISOString()}&to=${to.toISOString()}`);
        if (r.ok) { const d = await r.json(); setWeeklyKmData(d?.[0]); }
      } catch (e) { console.error(e); } finally { setWeeklyKmLoading(false); }
    })();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroupForDayNight) { setDayNightKmData(null); return; }
    (async () => {
      setDayNightKmLoading(true);
      try {
        const to = new Date(); const from = new Date();
        from.setDate(to.getDate() - 7);
        const r = await fetch(`/api/dashboard/daynightkm?from=${from.toISOString()}&to=${to.toISOString()}&groupId=${selectedGroupForDayNight}`);
        if (r.ok) setDayNightKmData(await r.json());
      } catch (e) { console.error(e); } finally { setDayNightKmLoading(false); }
    })();
  }, [selectedGroupForDayNight]);

  const visitorData = [
    { date: 'Apr 7', value: 320, vehicles: 180 }, { date: 'Apr 13', value: 380, vehicles: 220 },
    { date: 'Apr 19', value: 420, vehicles: 250 }, { date: 'Apr 26', value: 350, vehicles: 200 },
    { date: 'May 2', value: 480, vehicles: 280 }, { date: 'May 8', value: 520, vehicles: 310 },
    { date: 'May 14', value: 450, vehicles: 260 }, { date: 'May 21', value: 580, vehicles: 340 },
    { date: 'May 28', value: 620, vehicles: 370 }, { date: 'Jun 3', value: 550, vehicles: 320 },
    { date: 'Jun 9', value: 680, vehicles: 410 }, { date: 'Jun 15', value: 720, vehicles: 450 },
    { date: 'Jun 22', value: 650, vehicles: 390 }, { date: 'Jun 30', value: 780, vehicles: 480 },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex' }}>
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      <Box sx={{ flex: 1, ml: { xs: 0, md: '250px' }, p: 1.5 }}>

        <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setSidebarOpen(true)} sx={{ display: { xs: 'flex', md: 'none' } }}>
              <Menu />
            </IconButton>
            <Description sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{t('reportTitle')}</Typography>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 2, mb: 3 }}>
          <StatCard type="vehicleStatus" data={vehicleStatus} loading={statLoading} />
          <StatCard
            type="weeklyKm"
            data={weeklyKmData}
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupChange={(e) => setSelectedGroup(e.target.value)}
            loading={weeklyKmLoading}
          />
          <StatCard
            type="dayNightKm"
            data={dayNightKmData}
            groups={groups}
            selectedGroup={selectedGroupForDayNight}
            onGroupChange={(e) => setSelectedGroupForDayNight(e.target.value)}
            loading={dayNightKmLoading}
          />
        </Box>

        <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{t('dashboardVehicleActivity')}</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{t('dashboardLast3Months')}</Typography>
            </Box>
            <ButtonGroup variant="outlined" size="small">
              {ranges.map((r) => (
                <Button key={r} onClick={() => setTimeRange(r)} variant={timeRange === r ? 'contained' : 'outlined'} sx={{ minWidth: 100 }}>
                  {r}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={visitorData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="date" stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
              <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
              <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, color: theme.palette.text.primary }} />
              <Area type="monotone" dataKey="vehicles" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorVehicles)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>

        <DashboardEventsTable />

      </Box>
    </Box>
  );
};

export default DashboardPage;
