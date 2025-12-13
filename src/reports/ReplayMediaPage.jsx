import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  IconButton,
  Paper,
  Box,
  Toolbar,
  Typography,
  Slider,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import { useSelector, useDispatch } from 'react-redux';
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
import { devicesActions } from '../store';
import MediaPreview from './components/MediaPreview';

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
    right: theme.spacing(6),
    top: theme.spacing(1),
    width: 380,
    maxHeight: 'calc(100vh - 32px)',
    [theme.breakpoints.down('md')]: {
      width: 320,
      right: theme.spacing(1),
      top: theme.spacing(1),
      maxHeight: 'calc(100vh - 16px)',
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      right: 10,
      top: 25,
      maxHeight: '40vh',
      padding: theme.spacing(5),
      gap: 4,
    },
  },
  sidebarContent: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      gap: theme.spacing(1.5),
    },
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5),
    },
  },
  mediaBar: {
    position: 'fixed',
    bottom: theme.spacing(10),
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[6],
    width: 'fit-content',
    maxWidth: '90vw',
    [theme.breakpoints.down('md')]: {
      bottom: theme.spacing(2),
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5),
    },
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(20),
      gap: theme.spacing(1),
      padding: theme.spacing(1),
    },
  },
  thumb: {
    borderRadius: 4,
    overflow: 'hidden',
    border: '2px solid transparent',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    position: 'relative',
    backgroundColor: '#1e1e1e',
    width: 120,
    height: 75,
    [theme.breakpoints.down('md')]: {
      width: 100,
      height: 65,
    },
    [theme.breakpoints.down('sm')]: {
      width: 80,
      height: 60,
      borderRadius: 3,
    },
  },
  thumbCenter: {
    cursor: 'pointer',
    border: `3px solid ${theme.palette.secondary.main}`,
    transform: 'scale(1.1)',
    boxShadow: `0 0 20px ${theme.palette.secondary.main}`,
    width: 140,
    height: 90,
    [theme.breakpoints.down('md')]: {
      width: 120,
      height: 75,
    },
    [theme.breakpoints.down('sm')]: {
      width: 90,
      height: 65,
      border: `2px solid ${theme.palette.secondary.main}`,
    },
    '&:hover': {
      transform: 'scale(1.15)',
      boxShadow: `0 0 25px ${theme.palette.secondary.main}`,
    },
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minHeight: 90,
    [theme.breakpoints.down('md')]: {
      minHeight: 75,
      gap: theme.spacing(1.2),
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: 65,
      gap: theme.spacing(1),
    },
  },
  leftSection: {
    justifyContent: 'flex-end',
    opacity: 0.6,
  },
  centerSection: {
    justifyContent: 'center',
    opacity: 1,
  },
  rightSection: {
    justifyContent: 'flex-start',
    opacity: 0.6,
  },
  toolbarTitle: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem',
    },
  },
}));

const isVideoFile = (filename) => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(ext);
};

const isImageFile = (filename) => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
};

const thumbnailCache = new Map();

const MediaThumbnail = React.memo(({ url, isVideo, isImage }) => {
  const [thumbnail, setThumbnail] = useState(() => thumbnailCache.get(url));
  const [loading, setLoading] = useState(!thumbnailCache.has(url));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url || thumbnailCache.has(url)) return;

    if (isImage) {
      thumbnailCache.set(url, url);
      setThumbnail(url);
      setLoading(false);
      return;
    }

    if (!isVideo) {
      setError(true);
      setLoading(false);
      return;
    }

    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanup = () => {
      video.src = '';
      video.load();
    };

    const timeout = setTimeout(() => {
      setError(true);
      setLoading(false);
      cleanup();
    }, 5000);

    const onLoadedData = () => {
      video.currentTime = Math.min(0.5, video.duration * 0.1);
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const aspect = video.videoWidth / video.videoHeight;
        canvas.width = 320;
        canvas.height = 320 / aspect;

        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        thumbnailCache.set(url, dataUrl);
        setThumbnail(dataUrl);
        setLoading(false);
        clearTimeout(timeout);
        cleanup();
      } catch (err) {
        setError(true);
        setLoading(false);
        clearTimeout(timeout);
        cleanup();
      }
    };

    const onError = () => {
      setError(true);
      setLoading(false);
      clearTimeout(timeout);
      cleanup();
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
  }, [url, isVideo, isImage]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <CircularProgress size={24} sx={{ color: '#888' }} />
      </Box>
    );
  }

  if (error || !thumbnail) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        {isVideo ? <PlayCircleOutlineIcon sx={{ fontSize: 40, color: '#555' }} /> : <ImageIcon sx={{ fontSize: 40, color: '#555' }} />}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}>
      <img src={thumbnail} alt="media" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
      {isVideo && (
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <PlayCircleOutlineIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>
      )}
    </Box>
  );
});

const ReplayMediaPage = () => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const classes = useStyles();
  const reportClasses = useReportStyles();
  const theme = useTheme();

  const timerRef = useRef();
  const abortControllerRef = useRef(null);

  const devices = useSelector((state) => state.devices.items);
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);
  const selectedDeviceIdFromRedux = useSelector((state) => state.devices.selectedId);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smoothPosition, setSmoothPosition] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [openMedia, setOpenMedia] = useState(null);
  const [mediaTimeline, setMediaTimeline] = useState([]);
  const [miniVariant, setMiniVariant] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(-1);

  const deviceName = useMemo(
    () => selectedDeviceId && devices[selectedDeviceId]?.name,
    [selectedDeviceId, devices],
  );

  useEffect(() => {
    const handleDrawerChange = (event) => {
      setMiniVariant(event.detail.miniVariant);
    };
    window.addEventListener('drawerStateChange', handleDrawerChange);
    return () => window.removeEventListener('drawerStateChange', handleDrawerChange);
  }, []);

  const mediaBarStyle = useMemo(() => {
    if (!desktop) return {};
    const drawerWidth = miniVariant ? 73 : 280;
    const maxWidth = miniVariant ? 1500 : 1100;
    return {
      left: '50%',
      transform: `translateX(calc(-50% + ${drawerWidth / 2}px))`,
      maxWidth,
      width: 'fit-content',
    };
  }, [desktop, miniVariant]);

  useEffect(() => {
    if (!positions.length || !mediaTimeline.length || openMedia) return;

    const currentPos = positions[index];
    if (!currentPos) return;

    const currentTime = new Date(currentPos.fixTime).getTime();
    let closestIndex = -1;
    let smallestDiff = Infinity;

    mediaTimeline.forEach((media, idx) => {
      const mediaTime = new Date(media.eventTime).getTime();
      const diff = currentTime - mediaTime;
      if (diff >= 0 && diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = idx;
      }
    });

    setActiveMediaIndex(closestIndex);
  }, [positions, index, mediaTimeline, openMedia]);

  const displayedMedia = useMemo(() => {
    const result = { left: [], center: null, right: [] };

    if (activeMediaIndex >= 0 && mediaTimeline[activeMediaIndex]) {
      result.center = mediaTimeline[activeMediaIndex];
      if (activeMediaIndex >= 2) {
        result.left.push(mediaTimeline[activeMediaIndex - 2]);
        result.left.push(mediaTimeline[activeMediaIndex - 1]);
      } else if (activeMediaIndex === 1) {
        result.left.push(mediaTimeline[0]);
      }
      if (activeMediaIndex < mediaTimeline.length - 2) {
        result.right.push(mediaTimeline[activeMediaIndex + 1]);
        result.right.push(mediaTimeline[activeMediaIndex + 2]);
      } else if (activeMediaIndex === mediaTimeline.length - 2) {
        result.right.push(mediaTimeline[activeMediaIndex + 1]);
      }
    }

    return result;
  }, [activeMediaIndex, mediaTimeline]);

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setSelectedDeviceId(deviceId);
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);
    setActiveMediaIndex(-1);
    dispatch(devicesActions.selectId(null));

    try {
      const query = new URLSearchParams({ deviceId, from, to }).toString();
      const [positionsRes, eventsRes] = await Promise.all([
        fetch(`/api/positions?${query}`, { signal }),
        fetch(`/api/reports/events?${query}`, { headers: { Accept: 'application/json' }, signal }),
      ]);

      if (!positionsRes.ok || !eventsRes.ok) throw new Error(t('sharedNoData'));

      const [positionsData, allEvents] = await Promise.all([positionsRes.json(), eventsRes.json()]);
      if (!positionsData.length) throw new Error(t('sharedNoData'));

      setPositions(positionsData);

      const device = devices[deviceId];
      const uniqueId = device?.uniqueId || 'unknown';
      const mediaEvents = allEvents.filter((e) => e.type === 'media');
      const timeline = mediaEvents.map((event, idx) => {
        const file = event.attributes?.file || '';
        const fullUrl = `/api/media/${uniqueId}/${file}`;
        return {
          id: event.id || idx,
          url: fullUrl,
          file,
          isVideo: isVideoFile(file),
          isImage: isImageFile(file),
          eventTime: event.eventTime || event.serverTime,
        };
      });

      setMediaTimeline(timeline);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error loading replay data:', err);
      }
      setPositions([]);
      setMediaTimeline([]);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setAnimationProgress((progress) => {
          const newProgress = progress + 0.02;
          if (newProgress >= 1) {
            setIndex((prev) => {
              const next = prev + 1;
              if (next >= positions.length - 1) {
                setPlaying(false);
                return positions.length - 1;
              }
              return next;
            });
            return 0;
          }
          return newProgress;
        });
      }, 16);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions.length]);

  useEffect(() => {
    if (!positions.length) {
      setSmoothPosition(null);
      return;
    }
    const current = positions[index];
    if (index < positions.length - 1 && animationProgress > 0) {
      const next = positions[index + 1];
      setSmoothPosition({
        ...current,
        latitude: current.latitude + (next.latitude - current.latitude) * animationProgress,
        longitude: current.longitude + (next.longitude - current.longitude) * animationProgress,
      });
    } else {
      setSmoothPosition(current);
    }
  }, [positions, index, animationProgress]);

  const onPointClick = useCallback((_, clickedIndex) => {
    setIndex(clickedIndex);
    setAnimationProgress(0);
    setPlaying(false);
  }, []);

  const handleMediaClick = useCallback((media) => {
    if (!media) return;
    setOpenMedia(media);

    const mediaTime = new Date(media.eventTime).getTime();
    let closestIndex = 0;
    let smallestDiff = Infinity;

    positions.forEach((pos, idx) => {
      const posTime = new Date(pos.fixTime).getTime();
      const diff = Math.abs(mediaTime - posTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = idx;
      }
    });

    setIndex(closestIndex);
    setAnimationProgress(0);
    setPlaying(false);
  }, [positions]);

  const handleClose = useCallback(() => {
    setPositions([]);
    setMediaTimeline([]);
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);
    setOpenMedia(null);
    setActiveMediaIndex(-1);
    dispatch(devicesActions.selectId(null));
  }, [dispatch]);

  const currentPosition = positions[index];

  if (!positions.length) {
    return (
      <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportReplayMedia']}>
        <div className={reportClasses.container}>
          <div className={reportClasses.containerMain}>
            <div className={reportClasses.header}>
              <ReportFilter handleSubmit={handleSubmit} fullScreen showOnly loading={loading} />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportReplay']}>
      <div className={classes.container}>
        <div className={classes.mapContainer}>
          <MapView>
            <MapGeofence />
            <MapRoutePath positions={positions} />
            <MapRoutePoints
              positions={positions}
              onClick={(pos, idx) => {
                onPointClick(pos, idx);
                if (selectedDeviceId) dispatch(devicesActions.selectId(selectedDeviceId));
              }}
            />
            {smoothPosition && <MapPositions positions={[smoothPosition]} titleField="fixTime" customIcon="event-error" />}
          </MapView>
          <MapCamera positions={positions} />
          <MapScale />
        </div>

        <div className={classes.sidebar}>
          <Paper elevation={4}>
            <Toolbar>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }} className={classes.toolbarTitle}>
                {t('reportReplay')}
                {' '}
                -
                {deviceName || t('sharedDevice')}
              </Typography>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </Paper>

          <Paper className={classes.sidebarContent}>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentPosition ? formatTime(currentPosition.fixTime, 'seconds') : '--'}
            </Typography>
            <Slider
              max={positions.length - 1}
              value={index}
              onChange={(_, v) => {
                setIndex(v);
                setAnimationProgress(0);
                setPlaying(false);
              }}
              step={null}
              marks={positions.map((_, i) => ({ value: i }))}
            />
            <Box className={classes.controls}>
              <IconButton onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index <= 0}>
                <FastRewindIcon />
              </IconButton>
              <IconButton onClick={() => setPlaying((p) => !p)} disabled={index >= positions.length - 1 && !playing}>
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton onClick={() => setIndex((i) => Math.min(i + 1, positions.length - 1))} disabled={index >= positions.length - 1}>
                <FastForwardIcon />
              </IconButton>
              <Typography variant="caption">
                {index + 1}
                {' '}
                /
                {positions.length}
              </Typography>
            </Box>
          </Paper>
        </div>

        {mediaTimeline.length > 0 && (
          <Paper className={classes.mediaBar} style={mediaBarStyle} elevation={6}>
            <Box className={`${classes.section} ${classes.leftSection}`}>
              {displayedMedia.left.map((media) => (
                <Box key={media.id} className={classes.thumb}>
                  <MediaThumbnail url={media.url} isVideo={media.isVideo} isImage={media.isImage} />
                </Box>
              ))}
            </Box>

            <Box className={`${classes.section} ${classes.centerSection}`}>
              {displayedMedia.center && (
                <Box className={`${classes.thumb} ${classes.thumbCenter}`} onClick={() => handleMediaClick(displayedMedia.center)}>
                  <MediaThumbnail url={displayedMedia.center.url} isVideo={displayedMedia.center.isVideo} isImage={displayedMedia.center.isImage} />
                </Box>
              )}
            </Box>

            <Box className={`${classes.section} ${classes.rightSection}`}>
              {displayedMedia.right.map((media) => (
                <Box key={media.id} className={classes.thumb}>
                  <MediaThumbnail url={media.url} isVideo={media.isVideo} isImage={media.isImage} />
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {openMedia && <MediaPreview open={!!openMedia} mediaUrl={openMedia.url} onClose={() => setOpenMedia(null)} />}

        {selectedDeviceIdFromRedux && currentPosition && (
          <StatusCard
            deviceId={selectedDeviceIdFromRedux}
            position={currentPosition}
            onClose={() => dispatch(devicesActions.selectId(null))}
            desktopPadding={theme.dimensions.drawerWidthDesktop}
            disableActions
          />
        )}
      </div>
    </PageLayout>
  );
};

export default ReplayMediaPage;
