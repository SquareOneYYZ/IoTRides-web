import React, { useState, useEffect, useCallback } from 'react';
import {
  Description,
  Menu,
  MoreVert,
  Settings,
  Refresh,
  Speed,
  LocationOn,
  Warning,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Skeleton,
  Tooltip,
  TableSortLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardSidebar } from '../common/components/DashboardSidebar';
import StatCard from '../common/components/StatCard';

// ── helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPES = ['all', 'speedCamera', 'geofence', 'maintenance', 'alarm', 'ignition'];
const DEVICE_GROUPS = ['all', 'Group A', 'Group B', 'Group C'];

/** Map event type → MUI chip color */
const eventTypeColor = (type) => {
  switch (type) {
    case 'speedCamera': return 'warning';
    case 'geofence': return 'info';
    case 'maintenance': return 'secondary';
    case 'alarm': return 'error';
    case 'ignition': return 'success';
    default: return 'default';
  }
};

/** Map event type → icon */
const EventIcon = ({ type, size = 16 }) => {
  const sx = { fontSize: size };
  switch (type) {
    case 'speedCamera': return <Speed sx={sx} />;
    case 'geofence': return <LocationOn sx={sx} />;
    default: return <Warning sx={sx} />;
  }
};

/** Format ISO date to readable string */
const formatEventTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// ── EventTableRow ─────────────────────────────────────────────────────────────

const EventTableRow = ({ event, theme }) => (
  <TableRow
    sx={{
      '&:hover': { backgroundColor: theme.palette.action.hover },
      transition: 'background 0.15s',
    }}
  >
    {/* Device */}
    <TableCell>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {event.deviceName}
        </Typography>
      </Box>
    </TableCell>

    {/* Event Type */}
    <TableCell>
      <Chip
        icon={<EventIcon type={event.type} />}
        label={event.type}
        color={eventTypeColor(event.type)}
        size="small"
        sx={{ textTransform: 'capitalize', fontWeight: 500 }}
      />
    </TableCell>

    {/* Highway */}
    <TableCell>
      <Typography variant="body2">
        {event.attributes?.highway ?? '—'}
      </Typography>
    </TableCell>

    {/* Speed Limit */}
    <TableCell align="right">
      <Typography variant="body2">
        {event.attributes?.speedLimit != null
          ? `${event.attributes.speedLimit} km/h`
          : '—'}
      </Typography>
    </TableCell>

    {/* Device Speed */}
    <TableCell align="right">
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color:
            event.attributes?.deviceSpeed > (event.attributes?.speedLimit || Infinity)
              ? theme.palette.error.main
              : theme.palette.text.primary,
        }}
      >
        {event.attributes?.deviceSpeed != null
          ? `${event.attributes.deviceSpeed.toFixed(1)} km/h`
          : '—'}
      </Typography>
    </TableCell>

    {/* Time */}
    <TableCell>
      <Tooltip title={event.eventTime} placement="top">
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, whiteSpace: 'nowrap' }}>
          {formatEventTime(event.eventTime)}
        </Typography>
      </Tooltip>
    </TableCell>

    {/* Actions */}
    <TableCell>
      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
        <MoreVert sx={{ fontSize: 16 }} />
      </IconButton>
    </TableCell>
  </TableRow>
);

// ── Loading skeleton rows ─────────────────────────────────────────────────────

const SkeletonRows = ({ count = 5 }) => Array.from({ length: count }).map((_, i) => (
  <TableRow key={i}>
    {Array.from({ length: 8 }).map((__, j) => (
      <TableCell key={j}>
        <Skeleton variant="text" width={j === 0 ? 60 : j === 1 ? 100 : 80} />
      </TableCell>
    ))}
  </TableRow>
));

// ── Main component ────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- stat cards state (unchanged) ---
  const [vehicleStatus, setVehicleStatus] = useState({
    totalOnline: 0,
    totalOffline: 0,
    totalUnknown: 0,
    totalDriving: 0,
    totalParked: 0,
    totalInactive: 0,
    totalNoData: 0,
  });
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [weeklyKmData, setWeeklyKmData] = useState(null);
  const [dayNightKmData, setDayNightKmData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [weeklyKmLoading, setWeeklyKmLoading] = useState(false);
  const [dayNightKmLoading, setDayNightKmLoading] = useState(false);
  const [selectedGroupForDayNight, setSelectedGroupForDayNight] = useState('');

  // --- recent events state ---
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [eventLimit, setEventLimit] = useState(10);
  const [filterEventType, setFilterEventType] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first

  const ranges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];

  // --- fetch recent events ---
  const fetchRecentEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const params = new URLSearchParams({ limit: eventLimit });
      if (filterEventType !== 'all') params.set('eventType', filterEventType);
      // deviceId / groupId could be added here when group→deviceId mapping is available
      const res = await fetch(`/api/dashboard/recentEvents?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API may return array or single object; normalise to array
      const arr = Array.isArray(data) ? data : [data];
      // Sort by eventTime descending (newest first) or ascending
      arr.sort((a, b) => {
        const diff = new Date(b.eventTime) - new Date(a.eventTime);
        return sortOrder === 'desc' ? diff : -diff;
      });
      setEvents(arr);
    } catch (err) {
      console.error('Error fetching recent events:', err);
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  }, [eventLimit, filterEventType, sortOrder]);

  // re-fetch whenever filters change
  useEffect(() => { fetchRecentEvents(); }, [fetchRecentEvents]);

  // --- fetch vehicle status & groups (unchanged) ---
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/vehiclestatus');
        if (res.ok) setVehicleStatus(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }

      try {
        const res = await fetch('/api/groups');
        if (res.ok) setGroups(await res.json());
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setWeeklyKmData(null); return; }
    (async () => {
      setWeeklyKmLoading(true);
      try {
        const to = new Date(); const
          from = new Date();
        from.setDate(to.getDate() - 7);
        const res = await fetch(`/api/dashboard/weeklykm?groupId=${selectedGroup}&from=${from.toISOString()}&to=${to.toISOString()}`);
        if (res.ok) { const d = await res.json(); setWeeklyKmData(d?.[0]); }
      } catch (e) { console.error(e); } finally { setWeeklyKmLoading(false); }
    })();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroupForDayNight) { setDayNightKmData(null); return; }
    (async () => {
      setDayNightKmLoading(true);
      try {
        const to = new Date(); const
          from = new Date();
        from.setDate(to.getDate() - 7);
        const res = await fetch(`/api/dashboard/daynightkm?from=${from.toISOString()}&to=${to.toISOString()}&groupId=${selectedGroupForDayNight}`);
        if (res.ok) setDayNightKmData(await res.json());
      } catch (e) { console.error(e); } finally { setDayNightKmLoading(false); }
    })();
  }, [selectedGroupForDayNight]);

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

  // client-side group filter (when group→device mapping is available from /api/groups)
  const displayedEvents = filterGroup === 'all'
    ? events
    : events.filter((e) =>
    // placeholder: extend once groups carry deviceIds
      true);

  const toggleSortOrder = () => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex' }}>
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      <Box sx={{ flex: 1, ml: { xs: 0, md: '250px' }, p: 1.5 }}>

        {/* Header */}
        <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setSidebarOpen(true)} sx={{ display: { xs: 'flex', md: 'none' } }}>
              <Menu />
            </IconButton>
            <Description sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Dashboard</Typography>
          </Box>
        </Paper>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <StatCard type="vehicleStatus" data={vehicleStatus} loading={loading} />
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

        {/* Chart Section */}
        <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Vehicle Activity</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Total for the last 3 months</Typography>
            </Box>
            <ButtonGroup variant="outlined" size="small">
              {ranges.map((range) => (
                <Button key={range} onClick={() => setTimeRange(range)} variant={timeRange === range ? 'contained' : 'outlined'} sx={{ minWidth: 100 }}>
                  {range}
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
              <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', color: theme.palette.text.primary }} />
              <Area type="monotone" dataKey="vehicles" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorVehicles)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>

        {/* Recent Events Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>

          {/* Table header / filters */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Events</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Latest device events — newest first
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchRecentEvents} disabled={eventsLoading}>
                Refresh
              </Button>
              <Button variant="contained" size="small" startIcon={<Settings />}>
                Customize
              </Button>
            </Box>
          </Box>

          {/* Filter bar */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>

            {/* Event Type filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filterEventType}
                label="Event Type"
                onChange={(e) => setFilterEventType(e.target.value)}
              >
                {EVENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t === 'all' ? 'All Types' : t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Group filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Group</InputLabel>
              <Select
                value={filterGroup}
                label="Group"
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                {DEVICE_GROUPS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g === 'all' ? 'All Groups' : g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Limit selector */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Show</InputLabel>
              <Select
                value={eventLimit}
                label="Show"
                onChange={(e) => setEventLimit(Number(e.target.value))}
              >
                {[5, 10, 25, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                    {' '}
                    events
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Result count */}
            <Typography variant="body2" sx={{ ml: 'auto', color: theme.palette.text.secondary }}>
              {eventsLoading ? 'Loading…' : `${displayedEvents.length} event${displayedEvents.length !== 1 ? 's' : ''}`}
            </Typography>
          </Box>

          {/* Error banner */}
          {eventsError && (
            <Box sx={{ px: 2, py: 1, backgroundColor: theme.palette.error.light }}>
              <Typography variant="body2" color="error">
                Failed to load events:
                {' '}
                {eventsError}
              </Typography>
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Highway</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Speed Limit</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Device Speed</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active
                      direction={sortOrder}
                      onClick={toggleSortOrder}
                    >
                      Time
                    </TableSortLabel>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {eventsLoading
                  ? <SkeletonRows count={eventLimit > 10 ? 8 : eventLimit} />
                  : displayedEvents.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No events found for the selected filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : displayedEvents.map((event) => (
                      <EventTableRow key={event.id} event={event} theme={theme} />
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;
