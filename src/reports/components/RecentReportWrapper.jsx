// RecentReportsWrapper.js
// Reusable component to show recent reports

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import {
  Paper,
  Typography,
  IconButton,
  Chip,
  Box,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Star as StarIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  recentReportsContainer: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
  },
  section: {
    marginBottom: theme.spacing(4),
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  reportCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.main,
    },
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  reportMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
    color: theme.palette.text.secondary,
  },
}));

const API_BASE = '/api';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseIds = (idsString) => {
  try {
    const parsed = JSON.parse(idsString);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const getDeviceNames = (deviceIdsString, devices) => {
  try {
    const ids = JSON.parse(deviceIdsString);
    if (Array.isArray(ids) && ids.length > 0) {
      const names = ids.map((id) => devices[id]?.name || `Device ${id}`);
      return names.length > 2
        ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
        : names.join(', ');
    }
  } catch {
    return 'N/A';
  }
  return 'N/A';
};

const ReportCard = ({
  report,
  isFavorite,
  reportType,
  devices,
  classes,
  onReRun,
  onDelete,
}) => (
  <Paper
    className={classes.reportCard}
    onClick={(e) => onReRun(report, e)}
    elevation={1}
  >
    <Box className={classes.reportHeader}>
      <Box className={classes.reportInfo}>
        <Box className={classes.reportTitle}>
          {isFavorite && (
            <StarIcon sx={{ color: 'warning.main' }} />
          )}
          <Typography variant="h6">
            {isFavorite ? report.name : `${reportType} Report`}
          </Typography>
          <Chip
            label={reportType}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {report.description && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {report.description}
          </Typography>
        )}

        <Box className={classes.reportMeta}>
          <Box className={classes.metaItem}>
            <ClockIcon fontSize="small" />
            <span>
              {isFavorite
                ? `Created ${formatDate(report.createdAt)}`
                : `Generated ${formatDate(report.generatedAt)}`}
            </span>
          </Box>
          <Box className={classes.metaItem}>
            <CalendarIcon fontSize="small" />
            <strong>Period:</strong>
            {' '}
            {report.period || 'Custom'}
          </Box>
          {report.deviceIds && parseIds(report.deviceIds) > 0 && (
            <Box className={classes.metaItem}>
              <SettingsIcon fontSize="small" />
              <strong>Devices:</strong>
              {' '}
              {getDeviceNames(report.deviceIds, devices)}
            </Box>
          )}
          {report.groupIds && parseIds(report.groupIds) > 0 && (
            <Box className={classes.metaItem}>
              <SettingsIcon fontSize="small" />
              <strong>Groups:</strong>
              {' '}
              {parseIds(report.groupIds)}
            </Box>
          )}
        </Box>
      </Box>

      <Box className={classes.actions}>
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => onReRun(report, e)}
          title="Re-run report"
        >
          <PlayIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => onDelete(report.id, e)}
          title="Delete"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  </Paper>
);

const RecentReportsWrapper = ({
  reportType,
  onReRunReport,
}) => {
  const classes = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const userId = useSelector((state) => state.session.user?.id || 1);

  const [recentReports, setRecentReports] = useState([]);
  const [favoriteReports, setFavoriteReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [recentRes, favoritesRes] = await Promise.all([
        fetch(`${API_BASE}/reporthistory`),
        fetch(`${API_BASE}/favoritereports?userId=${userId}&reportType=${reportType}`),
      ]);

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        let filtered = [];
        if (Array.isArray(recentData)) {
          filtered = recentData.filter((r) => r.reportType === reportType);
        } else if (recentData.reportType === reportType) {
          filtered = [recentData];
        }
        setRecentReports(filtered);
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        const favorites = Array.isArray(favoritesData) ? favoritesData : [favoritesData];
        setFavoriteReports(favorites);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, reportType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const deleteRecentReport = useCallback(async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/reporthistory/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRecentReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  }, []);

  const deleteFavoriteReport = useCallback(async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/favoritereports/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavoriteReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete favorite:', err);
    }
  }, []);

  const handleReRunReport = useCallback((report, e) => {
    e.stopPropagation();

    const config = {
      deviceIds: JSON.parse(report.deviceIds || '[]'),
      groupIds: JSON.parse(report.groupIds || '[]'),
      from: report.fromDate,
      to: report.toDate,
      period: report.period,
      additionalParams: report.additionalParams ? JSON.parse(report.additionalParams) : {},
    };

    if (onReRunReport) {
      onReRunReport(config);
    }
  }, [onReRunReport]);

  // Check if there are any reports to show
  const hasReports = recentReports.length > 0 || favoriteReports.length > 0;

  // Don't render anything if no reports and not loading
  if (!loading && !hasReports) {
    return null;
  }

  return (
    <Box className={classes.wrapper}>
      <Box className={classes.recentReportsContainer}>
        {/* Favorite Reports */}
        {favoriteReports.length > 0 && (
          <Box className={classes.section}>
            <Box className={classes.sectionHeader}>
              <Box className={classes.sectionTitle}>
                <StarIcon sx={{ color: 'warning.main' }} />
                <Typography variant="h5">Favorite Reports</Typography>
              </Box>
            </Box>
            {favoriteReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isFavorite
                reportType={reportType}
                devices={devices}
                classes={classes}
                onReRun={handleReRunReport}
                onDelete={deleteFavoriteReport}
              />
            ))}
          </Box>
        )}

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <Box className={classes.section}>
            <Box className={classes.sectionHeader}>
              <Box className={classes.sectionTitle}>
                <ClockIcon color="primary" />
                <Typography variant="h5">Recent Reports</Typography>
              </Box>
            </Box>
            {recentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isFavorite={false}
                reportType={reportType}
                devices={devices}
                classes={classes}
                onReRun={handleReRunReport}
                onDelete={deleteRecentReport}
              />
            ))}
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box className={classes.emptyState}>
            <Typography>Loading reports...</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentReportsWrapper;
