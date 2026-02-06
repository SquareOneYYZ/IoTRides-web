import React, { useState, useEffect } from 'react';
import {
  Description,
  Menu,
  MoreVert,
  Settings,
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
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  Tab,
  Tabs,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
import StatCard from '../common/components/StatCard';

const TableRowComponent = ({ item, status, target, limit, reviewer, sectionType, theme }) => (
  <TableRow
    sx={{
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    }}
  >
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Checkbox size="small" />
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <Menu sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography variant="body2">{item}</Typography>
      </Box>
    </TableCell>
    <TableCell>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        {sectionType}
      </Typography>
    </TableCell>
    <TableCell />
    <TableCell>
      <Typography variant="body2">{target}</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{limit}</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{reviewer}</Typography>
    </TableCell>
    <TableCell>
      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
        <MoreVert sx={{ fontSize: 16 }} />
      </IconButton>
    </TableCell>
  </TableRow>
);

export const DashboardPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const [loading, setLoading] = useState(true);
  const ranges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];
  const [groups, setGroups] = useState([]);
  const [weeklyKmData, setWeeklyKmData] = useState(null);
  const [dayNightKmData, setDayNightKmData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [weeklyKmLoading, setWeeklyKmLoading] = useState(false);
  const [dayNightKmLoading, setDayNightKmLoading] = useState(false);
  const [selectedGroupForDayNight, setSelectedGroupForDayNight] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTableGroup, setSelectedTableGroup] = useState('all');

  const tabsData = {
    outline: {
      name: 'Outline',
      count: null,
      data: [
        { item: 'Cover page', sectionType: 'Compliance', status: 'In Process', target: '18', limit: '5', reviewer: 'Eddie Lake', group: 'Group A' },
        { item: 'Table of contents', sectionType: 'Documentation', status: 'Done', target: '29', limit: '24', reviewer: 'Eddie Lake', group: 'Group A' },
        { item: 'Executive summary', sectionType: 'Management', status: 'Done', target: '10', limit: '13', reviewer: 'Eddie Lake', group: 'Group B' },
        { item: 'Project overview', sectionType: 'Technical', status: 'Not Started', target: '15', limit: '20', reviewer: 'Sarah Chen', group: 'Group B' },
        { item: 'Risk assessment', sectionType: 'Compliance', status: 'In Process', target: '12', limit: '18', reviewer: 'Mike Johnson', group: 'Group C' },
      ],
    },
    pastPerformance: {
      name: 'Past Performance',
      count: 3,
      data: [
        { item: 'Project Alpha completion', sectionType: 'Historical', status: 'Done', target: '25', limit: '30', reviewer: 'Sarah Chen', group: 'Group A' },
        { item: 'Client testimonials', sectionType: 'Reference', status: 'Done', target: '8', limit: '10', reviewer: 'Mike Johnson', group: 'Group A' },
        { item: 'Performance metrics', sectionType: 'Analytics', status: 'In Process', target: '15', limit: '20', reviewer: 'Eddie Lake', group: 'Group B' },
        { item: 'Case studies', sectionType: 'Documentation', status: 'Not Started', target: '12', limit: '15', reviewer: 'Sarah Chen', group: 'Group C' },
      ],
    },
    keyVehicles: {
      name: 'Key Vehicles',
      count: 2,
      data: [
        { item: 'GSA Schedule 70', sectionType: 'Contract', status: 'Done', target: '20', limit: '25', reviewer: 'Mike Johnson', group: 'Group A' },
        { item: 'IDIQ Contract', sectionType: 'Contract', status: 'In Process', target: '18', limit: '22', reviewer: 'Eddie Lake', group: 'Group A' },
        { item: 'State contracts', sectionType: 'Legal', status: 'Not Started', target: '10', limit: '15', reviewer: 'Sarah Chen', group: 'Group B' },
      ],
    },
    focusDocuments: {
      name: 'Focus Documents',
      count: null,
      data: [
        { item: 'Technical specifications', sectionType: 'Technical', status: 'Done', target: '30', limit: '35', reviewer: 'Sarah Chen', group: 'Group A' },
        { item: 'Cost proposal', sectionType: 'Financial', status: 'In Process', target: '22', limit: '28', reviewer: 'Mike Johnson', group: 'Group B' },
        { item: 'Management plan', sectionType: 'Management', status: 'In Process', target: '16', limit: '20', reviewer: 'Eddie Lake', group: 'Group B' },
        { item: 'Quality assurance plan', sectionType: 'Quality', status: 'Not Started', target: '14', limit: '18', reviewer: 'Sarah Chen', group: 'Group C' },
        { item: 'Security documentation', sectionType: 'Compliance', status: 'Done', target: '25', limit: '30', reviewer: 'Mike Johnson', group: 'Group C' },
      ],
    },
  };

  const tableGroups = ['all', 'Group A', 'Group B', 'Group C'];
  const tabKeys = Object.keys(tabsData);

  const getFilteredData = () => {
    const currentData = tabsData[tabKeys[activeTab]].data;
    if (selectedTableGroup === 'all') {
      return currentData;
    }
    return currentData.filter((item) => item.group === selectedTableGroup);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/vehiclestatus');
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle status');
        }
        const data = await response.json();
        setVehicleStatus(data);
      } catch (error) {
        console.error('Error fetching vehicle status:', error);
      } finally {
        setLoading(false);
      }

      try {
        const groupsResponse = await fetch('/api/groups');
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups(groupsData);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setWeeklyKmData(null);
      return;
    }

    const fetchWeeklyKm = async () => {
      setWeeklyKmLoading(true);
      try {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 7);

        const url = `/api/dashboard/weeklykm?groupId=${selectedGroup}&from=${from.toISOString()}&to=${to.toISOString()}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const firstItem = data?.[0];
          setWeeklyKmData(firstItem);
        }
      } catch (error) {
        console.error('Error fetching weekly KM:', error);
      } finally {
        setWeeklyKmLoading(false);
      }
    };

    fetchWeeklyKm();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroupForDayNight) {
      setDayNightKmData(null);
      return;
    }

    const fetchDayNightKm = async () => {
      setDayNightKmLoading(true);
      try {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 7);

        const url = `/api/dashboard/daynightkm?&from=${from.toISOString()}&to=${to.toISOString()}&groupId=${selectedGroupForDayNight}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setDayNightKmData(data);
        }
      } catch (error) {
        console.error('Error fetching day/night KM:', error);
      } finally {
        setDayNightKmLoading(false);
      }
    };

    fetchDayNightKm();
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
      }}
    >
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      <Box
        sx={{
          flex: 1,
          ml: { xs: 0, md: '250px' },
          p: 1.5,
        }}
      >
        {/* Header */}
        <Paper
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Description sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dashboard
            </Typography>
          </Box>
        </Paper>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            type="vehicleStatus"
            data={vehicleStatus}
            loading={loading}
          />
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Vehicle Activity
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Total for the last 3 months
              </Typography>
            </Box>
            <ButtonGroup variant="outlined" size="small">
              {ranges.map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'contained' : 'outlined'}
                  sx={{ minWidth: 100 }}
                >
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
              <XAxis
                dataKey="date"
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                  color: theme.palette.text.primary,
                }}
              />
              <Area
                type="monotone"
                dataKey="vehicles"
                stroke={theme.palette.secondary.main}
                fillOpacity={1}
                fill="url(#colorVehicles)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>

        {/* Table Section */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ minHeight: 40 }}
            >
              {tabKeys.map((key) => (
                <Tab
                  key={key}
                  label={(
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {tabsData[key].name}
                      {tabsData[key].count && (
                        <Box
                          sx={{
                            fontSize: 12,
                            backgroundColor: theme.palette.action.selected,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          {tabsData[key].count}
                        </Box>
                      )}
                    </Box>
                  )}
                  sx={{ minHeight: 40, textTransform: 'none' }}
                />
              ))}
            </Tabs>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Settings />}>
                Customize
              </Button>
              <Button variant="contained">+ Add Section</Button>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Filter by Group:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedTableGroup}
                onChange={(e) => setSelectedTableGroup(e.target.value)}
              >
                {tableGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group === 'all' ? 'All Groups' : group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ ml: 'auto', color: theme.palette.text.secondary }}>
              Showing
              {' '}
              {getFilteredData().length}
              {' '}
              of
              {' '}
              {tabsData[tabKeys[activeTab]].data.length}
              {' '}
              items
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Header</TableCell>
                  <TableCell>Section Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Limit</TableCell>
                  <TableCell>Reviewer</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredData().map((row, index) => (
                  <TableRowComponent
                    // key={index}
                    item={row.item}
                    sectionType={row.sectionType}
                    status={row.status}
                    target={row.target}
                    limit={row.limit}
                    reviewer={row.reviewer}
                    theme={theme}
                  />
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
