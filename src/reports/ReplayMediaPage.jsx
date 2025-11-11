import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  IconButton,
  Paper,
  Box,
  Toolbar,
  Typography,
  Slider,
  Dialog,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapGeofence from '../map/MapGeofence';
import MapCamera from '../map/MapCamera';
import MapScale from '../map/MapScale';
import StatusCard from '../common/components/StatusCard';
import { formatTime } from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import useReportStyles from './common/useReportStyles';

const useStyles = makeStyles((theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mapContainer: {
    flexGrow: 1,
    display: 'flex',
    position: 'relative',
  },
  sidebar: {
    display: 'flex',
    gap: 6,
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    right: theme.spacing(2),
    top: theme.spacing(2),
    width: 380,
    maxHeight: 'calc(100vh - 32px)',
  },
  sidebarContent: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
  },
  locationInfo: {
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
  mediaBar: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: '60%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    display: 'flex',
    height: 80,
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.7),
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    maxWidth: '90vw',
    overflowX: 'auto',
    boxShadow: theme.shadows[8],
  },
  thumb: {
    cursor: 'pointer',
    borderRadius: 4,
    overflow: 'hidden',
    border: '2px solid transparent',
    transition: 'border 0.2s',
    flexShrink: 0,
    '&:hover': {
      border: `2px solid ${theme.palette.primary.main}`,
    },
  },
  thumbSelected: {
    border: `2px solid ${theme.palette.primary.main}`,
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    marginLeft: 20,
    paddingLeft: 20,
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    marginBottom: 20,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 10,
      top: 25,
      width: 2,
      height: '100%',
      backgroundColor: '#bbb',
      zIndex: 0,
    },
    '&:last-child::before': {
      display: 'none',
    },
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
}));

const ReplayMediaPage = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const classes = useStyles();
  const reportClasses = useReportStyles();
  const timerRef = useRef();
  const abortControllerRef = useRef(null);

  const devices = useSelector((state) => state.devices.items);
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [from, setFrom] = useState();
  const [to, setTo] = useState();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smoothPosition, setSmoothPosition] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [openMedia, setOpenMedia] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [mediaTimeline, setMediaTimeline] = useState([]);
  const [showCard, setShowCard] = useState(false);

  const deviceName = useMemo(
    () => selectedDeviceId && devices[selectedDeviceId]?.name,
    [selectedDeviceId, devices],
  );

  const fetchLocationName = useCallback(async (latitude, longitude, signal) => {
    try {
      const response = await fetch(
        `/api/server/geocode?latitude=${latitude}&longitude=${longitude}`,
        { signal },
      );
      if (response.ok) {
        const data = await response.json();
        return data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Geocoding request aborted');
      } else {
        console.error('Geocoding error:', error);
      }
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }, []);

  const onPointClick = useCallback(
    (_, clickedIndex) => {
      setIndex(clickedIndex);
      setAnimationProgress(0);
    },
    [],
  );

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [],
  );

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);

    const query = new URLSearchParams({ deviceId, from, to });
    const queryString = query.toString();

    try {
      const [positionsRes, eventsRes] = await Promise.all([
        fetch(`/api/positions?${queryString}`, { signal }),
        fetch(`/api/reports/events?${queryString}`, {
          headers: { Accept: 'application/json' },
          signal,
        }),
      ]);

      if (!positionsRes.ok) {
        throw new Error(await positionsRes.text());
      }
      if (!eventsRes.ok) {
        throw new Error(await eventsRes.text());
      }

      const [positions, allEvents] = await Promise.all([
        positionsRes.json(),
        eventsRes.json(),
      ]);

      if (positions.length === 0) {
        throw new Error(t('sharedNoData'));
      }

      setPositions(positions);

      const [startLoc, endLoc] = await Promise.all([
        fetchLocationName(positions[0].latitude, positions[0].longitude, signal),
        fetchLocationName(
          positions[positions.length - 1].latitude,
          positions[positions.length - 1].longitude,
          signal,
        ),
      ]);

      setStartLocation(startLoc);
      setEndLocation(endLoc);

      const mediaEvents = allEvents.filter((e) => e.type === 'media');
      const timeline = mediaEvents.map((event, idx) => ({
        id: event.id || idx,
        thumb: event.attributes?.thumbnailUrl || event.attributes?.mediaUrl,
        full: event.attributes?.mediaUrl,
        time: new Date(event.eventTime || event.serverTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        eventTime: event.eventTime || event.serverTime,
        rawEvent: event,
      }));

      setMediaTimeline(timeline);

      console.log('✅ Data loaded:', {
        positions: positions.length,
        mediaEvents: timeline.length,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Error in handleSubmit:', err);
      setPositions([]);
      setMediaTimeline([]);
      setStartLocation('');
      setEndLocation('');
    } finally {
      setLoading(false);
    }
  });

  // Optimized animation with cleanup
  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setAnimationProgress((progress) => {
          const newProgress = progress + 0.02 * speed;
          if (newProgress >= 1) {
            setIndex((prevIndex) => {
              const nextIndex = prevIndex + 1;
              if (nextIndex >= positions.length - 1) {
                setPlaying(false);
                return positions.length - 1;
              }
              return nextIndex;
            });
            return 0;
          }
          return newProgress;
        });
      }, 16);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playing, positions.length, speed]);

  useEffect(() => {
    if (positions.length === 0) {
      setSmoothPosition(null);
      return;
    }

    if (index >= positions.length) {
      setSmoothPosition(positions[positions.length - 1]);
      return;
    }

    const currentPos = positions[index];

    if (index < positions.length - 1 && animationProgress > 0) {
      const nextPos = positions[index + 1];
      const t = animationProgress;

      const interpolatedPosition = {
        ...currentPos,
        latitude: currentPos.latitude + (nextPos.latitude - currentPos.latitude) * t,
        longitude: currentPos.longitude + (nextPos.longitude - currentPos.longitude) * t,
        speed: currentPos.speed + (nextPos.speed - currentPos.speed) * t,
        course: currentPos.course + (nextPos.course - currentPos.course) * t,
      };
      setSmoothPosition(interpolatedPosition);
    } else {
      setSmoothPosition(currentPos);
    }
  }, [positions, index, animationProgress]);

  useEffect(() => () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleDownload = useCallback(() => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  }, [selectedDeviceId, from, to]);

  const handleClose = useCallback(() => {
    setPositions([]);
    setMediaTimeline([]);
    setStartLocation('');
    setEndLocation('');
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);
    setShowCard(false);
    setOpenMedia(null);
  }, []);

  const handleStepBackward = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setAnimationProgress(0);
  }, []);

  const handleStepForward = useCallback(() => {
    setIndex((i) => Math.min(i + 1, positions.length - 1));
    setAnimationProgress(0);
  }, [positions.length]);

  const handleSliderChange = useCallback((_, value) => {
    setIndex(value);
    setAnimationProgress(0);
    setPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleMediaClick = useCallback((item) => {
    setOpenMedia(item);
  }, []);

  const handleCloseMedia = useCallback(() => {
    setOpenMedia(null);
  }, []);

  const handleCloseCard = useCallback(() => {
    setShowCard(false);
  }, []);

  const currentPosition = useMemo(
    () => positions[index],
    [positions, index],
  );

  const firstPosition = useMemo(
    () => positions[0],
    [positions],
  );

  const lastPosition = useMemo(
    () => positions[positions.length - 1],
    [positions],
  );

  if (positions.length === 0) {
    return (
      <PageLayout
        menu={<ReportsMenu />}
        breadcrumbs={['reportTitle', 'reportReplay']}
      >
        <div className={reportClasses.container}>
          <div className={reportClasses.containerMain}>
            <div className={reportClasses.header}>
              <ReportFilter
                handleSubmit={handleSubmit}
                fullScreen
                showOnly
                loading={loading}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={['reportTitle', 'reportReplay']}
    >
      <div className={classes.container}>
        <div className={classes.mapContainer}>
          <MapView>
            <MapGeofence />
            <MapRoutePath positions={positions} />
            <MapRoutePoints positions={positions} onClick={onPointClick} />
            {smoothPosition && (
              <MapPositions
                positions={[smoothPosition]}
                onClick={onMarkerClick}
                titleField="fixTime"
              />
            )}
          </MapView>
          <MapCamera positions={positions} />
          <MapScale />
        </div>

        <div className={classes.sidebar}>
          <Paper elevation={4}>
            <Toolbar>
              <Typography variant="subtitle1" fontWeight="bold" style={{ flexGrow: 1 }}>
                {t('reportReplay')}
                {' '}
                -
                {' '}
                {deviceName || t('sharedDevice')}
              </Typography>
              <IconButton onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </Paper>

          <Paper className={classes.sidebarContent}>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentPosition
                ? formatTime(currentPosition.fixTime, 'seconds')
                : '--'}
            </Typography>

            <Box className={classes.timelineContainer}>
              <Box className={classes.timelineItem}>
                <Box className={classes.marker}>B</Box>
                <Box>
                  <Typography fontWeight="bold">
                    End:
                    {' '}
                    {endLocation || (lastPosition ? `${lastPosition.latitude.toFixed(4)}, ${lastPosition.longitude.toFixed(4)}` : '--')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {lastPosition && formatTime(lastPosition.fixTime, 'seconds')}
                  </Typography>
                </Box>
              </Box>

              <Box className={classes.timelineItem}>
                <Box className={classes.marker}>A</Box>
                <Box>
                  <Typography fontWeight="bold">
                    Start:
                    {' '}
                    {startLocation || (firstPosition ? `${firstPosition.latitude.toFixed(4)}, ${firstPosition.longitude.toFixed(4)}` : '--')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {firstPosition && formatTime(firstPosition.fixTime, 'seconds')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Slider
              max={positions.length - 1}
              step={null}
              marks={positions.map((_, i) => ({ value: i }))}
              value={index}
              onChange={handleSliderChange}
            />

            <div className={classes.controls}>
              <IconButton
                onClick={handleStepBackward}
                disabled={playing || index <= 0}
                size="small"
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={togglePlayPause}
                disabled={index >= positions.length - 1 && !playing}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={handleStepForward}
                disabled={playing || index >= positions.length - 1}
                size="small"
              >
                <FastForwardIcon />
              </IconButton>

              <Typography variant="caption">
                {index + 1}
                {' '}
                /
                {' '}
                {positions.length}
              </Typography>
            </div>
          </Paper>
        </div>

        {mediaTimeline.length > 0 && (
          <Paper elevation={8} className={classes.mediaBar}>
            {mediaTimeline.map((item) => (
              <Box
                key={item.id}
                onClick={() => handleMediaClick(item)}
                className={`${classes.thumb} ${openMedia?.id === item.id ? classes.thumbSelected : ''}`}
              >
                <img src={item.thumb} alt="thumb" width={120} height={80} style={{ display: 'block' }} />
                <Typography align="center" variant="caption" sx={{ fontSize: '0.65rem', p: 0.5 }}>
                  {item.time}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        <Dialog open={!!openMedia} onClose={handleCloseMedia} maxWidth="md">
          {openMedia && (
            <img src={openMedia.full} alt="preview" style={{ width: '100%', height: 'auto' }} />
          )}
        </Dialog>

        {showCard && currentPosition && (
          <StatusCard
            deviceId={selectedDeviceId}
            position={currentPosition}
            onClose={handleCloseCard}
            disableActions
          />
        )}
      </div>
    </PageLayout>
  );
};

export default ReplayMediaPage;
