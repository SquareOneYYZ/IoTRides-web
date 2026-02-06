import React from 'react';
import {
  Box, Typography, CircularProgress, MenuItem, Select, FormControl,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const StatCard = ({
  type, data, groups, devices, selectedGroup, selectedDevice, onGroupChange, onDeviceChange, loading,
}) => {
  const theme = useTheme();

  const formatKm = (meters) => {
    if (!meters && meters !== 0) return '0';
    return (meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatWeekText = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const cardStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 2,
    p: 2,
    border: `1px solid ${theme.palette.divider}`,
    minHeight: 160,
  };

  if (type === 'vehicleStatus') {
    return (
      <Box sx={cardStyle}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
          Vehicle Status
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              mt: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4ade80' }}>
                {data?.totalOnline || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                Online
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f87171' }}>
                {data?.totalOffline || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                Offline
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#60a5fa' }}>
                {data?.totalDriving || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                Driving
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {data?.totalParked || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                Parked
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {data?.totalInactive || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                Inactive
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {data?.totalNoData || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                No Data
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  if (type === 'weeklyKm') {
    return (
      <Box sx={cardStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Weekly Stats
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedGroup}
              onChange={onGroupChange}
              displayEmpty
              sx={{
                fontSize: 14,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <MenuItem value="" disabled>
                <em>Select Group</em>
              </MenuItem>
              {groups?.sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && data && selectedGroup && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
              {formatKm(data.weeklyDistanceTraveled)}
              {' '}
              km
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
              Week of
              {' '}
              {formatWeekText(new Date())}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {data.deviceCount}
              {' '}
              Devices
            </Typography>
          </Box>
        )}

        {!loading && !selectedGroup && (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 2 }}>
            Please select a group
          </Typography>
        )}
      </Box>
    );
  }

  if (type === 'dayNightKm') {
    return (
      <Box sx={cardStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Day/Night Distance
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedGroup}
              onChange={onGroupChange}
              displayEmpty
              sx={{
                fontSize: 14,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <MenuItem value="" disabled>
                <em>Select Group</em>
              </MenuItem>
              {groups?.sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && data && selectedGroup && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  p: 1,
                  borderRadius: 1,
                  gap: 0.5,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#fbbf24' }}>
                  {formatKm(data.daytimeKm * 1000)}
                  {' '}
                  km
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                  Day time
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  p: 1,
                  borderRadius: 1,
                  gap: 0.5,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#818cf8' }}>
                  {formatKm(data.nighttimeKm * 1000)}
                  {' '}
                  km
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: 14 }}>
                  Night-time
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.5 }}>
              Last 7 days
            </Typography>
          </Box>
        )}

        {!loading && !selectedGroup && (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 2 }}>
            Please select a group
          </Typography>
        )}
      </Box>
    );
  }

  return null;
};

export default StatCard;
