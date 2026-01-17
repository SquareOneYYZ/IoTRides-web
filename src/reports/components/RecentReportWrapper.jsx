import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import {
  Paper,
  Typography,
  IconButton,
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
import {
  fetchReportHistory,
  fetchFavoriteReports,
  deleteReportHistory,
  deleteFavoriteReport,
  parseReportConfig,
} from './ReportUtils';

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

const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getPeriodDisplay = (report) => {
  const period = report.period || 'Custom';
  if (period.toLowerCase() === 'custom' && report.fromDate && report.toDate) {
    return `${formatDateShort(report.fromDate)} to ${formatDateShort(report.toDate)}`;
  }
  return period;
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

const getGroupNames = (groupIdsString, groups) => {
  try {
    const ids = JSON.parse(groupIdsString);
    if (Array.isArray(ids) && ids.length > 0) {
      const names = ids.map((id) => groups[id]?.name || `Group ${id}`);
      return names.length > 2
        ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
        : names.join(', ');
    }
  } catch {
    return 'N/A';
  }
  return 'N/A';
};

const capitalizeFirstLetter = (val) => String(val).charAt(0).toUpperCase() + String(val).slice(1);

const ReportCard = ({
  report,
  isFavorite,
  reportType,
  devices,
  groups,
  classes,
  onReRun,
  onDelete,
}) => (
  <Paper className={classes.reportCard} elevation={1}>
    <Box className={classes.reportHeader}>
      <Box className={classes.reportInfo}>
        <Box className={classes.reportTitle}>
          {isFavorite && <StarIcon sx={{ color: 'warning.main' }} />}
          <Typography variant="h6">
            {capitalizeFirstLetter(isFavorite ? report.name : `${reportType} Report`)}
          </Typography>
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
            {getPeriodDisplay(report)}
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
              {getGroupNames(report.groupIds, groups)}
            </Box>
          )}
        </Box>
      </Box>

      <Box className={classes.actions}>
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            onReRun(report);
          }}
          title="Re-run report"
        >
          <PlayIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(report.id);
          }}
          title="Delete"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  </Paper>
);

const RecentReportsWrapper = ({ reportType, onReRunReport }) => {
  const classes = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const groups = useSelector((state) => state.groups.items);
  const userId = useSelector((state) => state.session.user?.id || 1);

  const [recentReports, setRecentReports] = useState([]);
  const [favoriteReports, setFavoriteReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [history, favorites] = await Promise.all([
        fetchReportHistory(userId, reportType),
        fetchFavoriteReports(userId, reportType),
      ]);
      setRecentReports(history);
      setFavoriteReports(favorites);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, reportType]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDeleteRecent = useCallback(async (reportId) => {
    const success = await deleteReportHistory(reportId);
    if (success) {
      setRecentReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  }, []);

  const handleDeleteFavorite = useCallback(async (favoriteId) => {
    const success = await deleteFavoriteReport(favoriteId);
    if (success) {
      setFavoriteReports((prev) => prev.filter((r) => r.id !== favoriteId));
    }
  }, []);

  const handleReRun = useCallback((report) => {
    const config = parseReportConfig(report);

    if (!config) {
      console.error('Failed to parse report config');
      return;
    }

    if (!onReRunReport) {
      console.error('onReRunReport callback not provided');
      return;
    }

    onReRunReport(config);
  }, [onReRunReport]);

  return (
    <Box className={classes.wrapper}>
      <Box className={classes.recentReportsContainer}>
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
                groups={groups}
                classes={classes}
                onReRun={handleReRun}
                onDelete={handleDeleteFavorite}
              />
            ))}
          </Box>
        )}

        <Box className={classes.section}>
          <Box className={classes.sectionHeader}>
            <Box className={classes.sectionTitle}>
              <ClockIcon color="primary" />
              <Typography variant="h5">Recent Reports</Typography>
            </Box>
          </Box>

          {loading && (
            <Box className={classes.emptyState}>
              <Typography>Loading reports...</Typography>
            </Box>
          )}

          {!loading && recentReports.length === 0 && (
            <Box className={classes.emptyState}>
              <Typography variant="body1" color="textSecondary">
                No recent
                {' '}
                {reportType}
                {' '}
                reports found.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Use the filter above to generate your first report!
              </Typography>
            </Box>
          )}

          {!loading && recentReports.length > 0 && (
            recentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isFavorite={false}
                reportType={reportType}
                devices={devices}
                groups={groups}
                classes={classes}
                onReRun={handleReRun}
                onDelete={handleDeleteRecent}
              />
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RecentReportsWrapper;
