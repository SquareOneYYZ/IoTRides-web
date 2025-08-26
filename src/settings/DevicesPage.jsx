import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Button,
  TableFooter,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  TextField,
  Box,
  Grid,
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  Chip,
  TableSortLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import usePersistedState from '../common/util/usePersistedState';

// Helper function to check if expiration is soon (within 30 days)
const isExpiringSoon = (expirationTime) => {
  if (!expirationTime) return false;
  const expirationDate = new Date(expirationTime);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
};

// Enhanced filter function for global search
const filterByGlobalSearch = (keyword) => (item) => {
  if (!keyword) return true;
  const searchFields = [
    item.name,
    item.phone,
    item.uniqueId,
    item.vin,
    item.model,
    item.contact,
  ];
  return searchFields.some((field) =>
    (field || '').toLowerCase().includes(keyword.toLowerCase()));
};

const DevicesPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);

  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);

  // Search and Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    group: '',
    model: '',
    expired: '',
    name: '',
    identifier: '',
    phone: '',
    vin: '',
    contact: '',
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePersistedState('devicesPageSize', 25);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll });
      const response = await fetch(`/api/devices?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp, showAll]);

  const uniqueModels = useMemo(() => {
    const models = [
      ...new Set(items.map((item) => item.model).filter(Boolean)),
    ];
    return models.sort();
  }, [items]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      group: '',
      model: '',
      expired: '',
      name: '',
      identifier: '',
      phone: '',
      vin: '',
      contact: '',
    });
    setGlobalSearch('');
    setPage(1);
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== '') || globalSearch !== '';

  const processedItems = useMemo(() => {
    let filtered = items;
    if (globalSearch) {
      filtered = filtered.filter(filterByGlobalSearch(globalSearch));
      console.log('After global search:', filtered.length); // Debug log
    }
    filtered = filtered.filter((item) => {
      if (filters.group && String(item.groupId) !== String(filters.group)) {
        return false;
      }
      if (filters.model && item.model !== filters.model) {
        return false;
      }
      if (filters.expired) {
        const now = new Date();
        const expirationDate = item.expirationTime
          ? new Date(item.expirationTime)
          : null;
        if (
          filters.expired === 'expired' &&
          (!expirationDate || expirationDate > now)
        ) {
          return false;
        }
        if (
          filters.expired === 'soon' &&
          !isExpiringSoon(item.expirationTime)
        ) {
          return false;
        }
        if (
          filters.expired === 'active' &&
          (!expirationDate || expirationDate <= now)
        ) {
          return false;
        }
      }

      // Text-based filters
      const textFilters = [
        { field: item.name || '', filter: filters.name },
        { field: item.uniqueId || '', filter: filters.identifier },
        { field: item.phone || '', filter: filters.phone },
        { field: item.vin || '', filter: filters.vin },
        { field: item.contact || '', filter: filters.contact },
      ];

      const isValid = textFilters.every(
        ({ field, filter }) =>
          !filter || field.toLowerCase().includes(filter.toLowerCase())
      );

      if (!isValid) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (sortConfig.key === 'expirationTime') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return filtered;
  }, [items, globalSearch, filters, sortConfig, groups]);
  const totalPages = Math.ceil(processedItems.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = processedItems.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleExport = () => {
    window.location.assign('/api/reports/devices/xlsx');
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  const getSortLabel = (column) => (
    <TableSortLabel
      active={sortConfig.key === column}
      direction={sortConfig.key === column ? sortConfig.direction : 'asc'}
      onClick={() => handleSort(column)}
    >
      {column === 'name' && t('sharedName')}
      {column === 'uniqueId' && t('deviceIdentifier')}
      {column === 'groupId' && t('groupParent')}
      {column === 'phone' && t('sharedPhone')}
      {column === 'model' && t('deviceModel')}
      {column === 'contact' && t('deviceContact')}
      {column === 'expirationTime' && t('userExpirationTime')}
      {column === 'vin' && 'VIN'}
    </TableSortLabel>
  );
  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'deviceTitle']}
    >
      <Box sx={{ minHeight: '100vh', overflowY: 'auto' }}>
        <Box
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            mb: 2,
            borderRadius: 1,
            width: '100%',
          }}
        >
          {/* Global Search */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Global Search"
                placeholder="Search across all fields..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setPage(1);
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FilterListIcon color="action" />
                <Typography variant="body2" color="textSecondary">
                  {processedItems.length}
                  {' '}
                  of
                  {items.length}
                  {' '}
                  devices
                </Typography>
                {hasActiveFilters && (
                  <Tooltip title="Clear all filters">
                    <IconButton size="small" onClick={clearAllFilters}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Column Filters */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Group</InputLabel>
                <Select
                  value={filters.group}
                  onChange={(e) => handleFilterChange('group', e.target.value)}
                  label="Group"
                >
                  <MenuItem value="">All Groups</MenuItem>
                  {Object.entries(groups || {}).map(([id, group]) => (
                    <MenuItem key={id} value={id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  label="Model"
                >
                  <MenuItem value="">All Models</MenuItem>
                  {uniqueModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid> */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Model"
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.expired}
                  onChange={(e) =>
                    handleFilterChange('expired', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="soon">Expiring Soon</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Identifier"
                value={filters.identifier}
                onChange={(e) =>
                  handleFilterChange('identifier', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="VIN"
                value={filters.vin}
                onChange={(e) => handleFilterChange('vin', e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                Active filters:
              </Typography>
              {globalSearch && (
                <Chip
                  size="small"
                  label={`Search: "${globalSearch}"`}
                  onDelete={() => setGlobalSearch('')}
                />
              )}
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                let displayValue = value;
                if (key === 'group') {
                  displayValue = groups[value]?.name || value;
                }
                return (
                  <Chip
                    key={key}
                    size="small"
                    label={`${key}: ${displayValue}`}
                    onDelete={() => handleFilterChange(key, '')}
                  />
                );
              })}
            </Box>
          )}
        </Box>

        {/* Main Table */}
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table className={classes.table} style={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>{getSortLabel('name')}</TableCell>
                <TableCell>{getSortLabel('uniqueId')}</TableCell>
                <TableCell>{getSortLabel('groupId')}</TableCell>
                <TableCell>{getSortLabel('phone')}</TableCell>
                <TableCell>{getSortLabel('model')}</TableCell>
                <TableCell>{getSortLabel('contact')}</TableCell>
                <TableCell>{getSortLabel('expirationTime')}</TableCell>
                <TableCell>{getSortLabel('vin')}</TableCell>
                {manager && <TableCell>{t('settingsUsers')}</TableCell>}
                <TableCell className={classes.columnAction} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.uniqueId}</TableCell>
                    <TableCell>
                      {item.groupId
                        ? groups[item.groupId]?.name || `Group ${item.groupId}`
                        : null}
                    </TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.contact}</TableCell>
                    <TableCell>
                      {item.expirationTime ? (
                        <Box>
                          {formatTime(item.expirationTime, 'date')}
                          {isExpiringSoon(item.expirationTime) && (
                            <Chip
                              size="small"
                              label="Soon"
                              color="warning"
                              sx={{ ml: 1, fontSize: '0.7rem' }}
                            />
                          )}
                          {new Date(item.expirationTime) <= new Date() && (
                            <Chip
                              size="small"
                              label="Expired"
                              color="error"
                              sx={{ ml: 1, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{item.vin || '-'}</TableCell>
                    {manager && (
                      <TableCell>
                        <DeviceUsersValue deviceId={item.id} />
                      </TableCell>
                    )}
                    <TableCell className={classes.columnAction} padding="none">
                      <CollectionActions
                        itemId={item.id}
                        editPath="/settings/device"
                        endpoint="devices"
                        setTimestamp={setTimestamp}
                        customActions={[actionConnections]}
                        readonly={deviceReadonly}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={manager ? 10 : 9} endAction />
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>
                  <Button onClick={handleExport} variant="text">
                    {t('reportExport')}
                  </Button>
                </TableCell>
                <TableCell colSpan={manager ? 9 : 8} align="right">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={showAll}
                        onChange={(e) => setShowAll(e.target.checked)}
                        size="small"
                      />
                    )}
                    label={t('notificationAlways')}
                    labelPlacement="start"
                    disabled={!manager}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 8 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            showFirstButton
            showLastButton
            size="medium"
          />
        </Box>

        <CollectionFab editPath="/settings/device" />
      </Box>
    </PageLayout>
  );
};

export default DevicesPage;
