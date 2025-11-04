import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  IconButton, CircularProgress, Typography, Box,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import useReportStyles from './common/useReportStyles';
import { useCatch } from '../reactHelper';
import scheduleReport from './common/scheduleReport';
import { eventsActions } from '../store/events';

const MediaBlock = ({ media, onLaunch }) => {
  const ref = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const renderMediaContent = () => {
    if (media.mediaType === 'image' && media.url) {
      return (
        <img
          src={media.url}
          alt={media.fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
    }

    if (media.mediaType === 'video') {
      return <PlayCircleOutlineIcon sx={{ fontSize: 60, color: '#555' }} />;
    }

    return <ImageIcon sx={{ fontSize: 60, color: '#555' }} />;
  };

  return (
    <Box
      ref={ref}
      sx={{
        backgroundColor: '#1e1e1e',
        borderRadius: 2,
        position: 'relative',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      {renderMediaContent()}

      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 1,
          fontSize: '12px',
        }}
      >
        {new Date(media.eventTime).toLocaleString()}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          sx={{
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
          onClick={toggleFullscreen}
        >
          <FullscreenIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          sx={{
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
          onClick={() => onLaunch(media)}
        >
          <LaunchIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

const EmptyState = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
      padding: 3,
    }}
  >
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

const LoadingState = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress />
    <Typography variant="body1" color="text.secondary">
      Loading media events...
    </Typography>
  </Box>
);

const MediaEventPage = () => {
  const classes = useReportStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mediaBlocks, setMediaBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUniqueId = async (deviceId) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      if (!response.ok) {
        throw Error('Failed to fetch device details');
      }
      const device = await response.json();
      return device.uniqueId || deviceId;
    } catch (error) {
      console.error(`Error fetching uniqueId for device ${deviceId}:`, error);
      return deviceId;
    }
  };
  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });

    if (type === 'export') {
      window.location.assign(`/api/reports/events/xlsx?${query.toString()}`);
      return;
    }

    if (type === 'mail') {
      const response = await fetch(`/api/reports/events/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/events?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw Error(await response.text());
      }

      const events = await response.json();
      const mediaEvents = events.filter((event) => event.type === 'media');
      const uniqueIdMap = new Map();
      const uniqueDeviceIds = [...new Set(mediaEvents.map((event) => event.deviceId))];
      await Promise.all(
        uniqueDeviceIds.map(async (devId) => {
          const uniqueId = await fetchUniqueId(devId);
          uniqueIdMap.set(devId, uniqueId);
        }),
      );
      const transformedMedia = mediaEvents.map((event) => {
        const uniqueId = uniqueIdMap.get(event.deviceId);
        const mediaUrl = event.attributes?.file
          ? `/api/media/${uniqueId}/${event.attributes.file}`
          : '';

        // console.log('Media URL generated:', mediaUrl);

        return {
          id: event.id,
          deviceId: event.deviceId,
          uniqueId,
          eventTime: event.eventTime,
          positionId: event.positionId,
          mediaType: event.attributes?.media || 'unknown',
          fileName: event.attributes?.file || '',
          url: mediaUrl,
        };
      });

      setMediaBlocks(transformedMedia);
    } finally {
      setLoading(false);
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    const reportConfig = { ...report, type: 'events' };
    const error = await scheduleReport(deviceIds, groupIds, reportConfig);

    if (error) {
      throw Error(error);
    }

    navigate('/reports/scheduled');
  });

  const handleLaunch = (media) => {
    dispatch(eventsActions.setSelectedEvent(media));
    navigate('/reports/media/details');
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <Box className={classes.container}>
        <Box className={classes.containerMain}>
          <Box className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            />
          </Box>

          {loading && <LoadingState />}

          {!loading && mediaBlocks.length === 0 && (
            <EmptyState message='No media events found. Please select filters and click "Show" to search.' />
          )}

          {!loading && mediaBlocks.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                  xl: 'repeat(5, 1fr)',
                },
                gap: 2,
                mt: 2,
                mb: 2,
                padding: 2,
              }}
            >
              {mediaBlocks.map((media) => (
                <MediaBlock key={media.id} media={media} onLaunch={handleLaunch} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default MediaEventPage;
