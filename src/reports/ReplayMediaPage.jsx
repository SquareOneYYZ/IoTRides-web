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
    width: 'fit-content',
    maxWidth: 850,
    minWidth: 260,
    zIndex: 1,
    display: 'flex',
    height: 110,
    padding: theme.spacing(1),
    gap: theme.spacing(0.5),
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    overflowX: 'auto',
    overflowY: 'hidden',
    boxShadow: theme.shadows[6],
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.action.hover} transparent`,
    cursor: 'grab',
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '&::-webkit-scrollbar': {
      height: 6,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.action.hover,
      borderRadius: 3,
    },
    [theme.breakpoints.down('md')]: {
      bottom: theme.spacing(2),
      height: 70,
      maxWidth: 680,
    },
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(20),
      height: 85,
      padding: theme.spacing(0.5),
      gap: theme.spacing(0.25),
      maxWidth: 'calc(100vw - 32px)',
      width: 'fit-content',
      left: '50%',
      transform: 'translateX(-50%)',
    },
  },
  thumb: {
    cursor: 'pointer',
    borderRadius: 4,
    overflow: 'hidden',
    border: '2px solid transparent',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    position: 'relative',
    backgroundColor: '#1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    width: 120,
    height: 80,
    '&:hover': {
      border: `2px solid ${theme.palette.primary.main}`,
    },
    [theme.breakpoints.down('md')]: {
      width: 100,
      height: 65,
    },
    [theme.breakpoints.down('sm')]: {
      borderRadius: 2,
      border: '1px solid transparent',
      width: 90,
      height: 60,
      '&:hover': {
        border: `1px solid ${theme.palette.primary.main}`,
      },
    },
  },
  thumbActive: {
    border: `3px solid ${theme.palette.secondary.main}`,
    transform: 'scale(1.05)',
    boxShadow: `0 0 12px ${theme.palette.secondary.main}`,
    [theme.breakpoints.down('sm')]: {
      border: `2px solid ${theme.palette.secondary.main}`,
    },
  },
  thumbSelected: {
    border: `2px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('sm')]: {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  toolbarTitle: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem',
    },
  },
  dialogContent: {
    [theme.breakpoints.down('sm')]: {
      padding: 0,
    },
  },
}));

// Helper to check if file is video
const isVideoFile = (filename) => {
  if (!filename) return false;
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
  return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
};

// Helper to check if file is image
const isImageFile = (filename) => {
  if (!filename) return false;
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
};

const MediaThumbnail = ({ url, isVideo, isImage }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setError(true);
      return undefined;
    }

    if (isImage) {
      setThumbnail(url);
      return undefined;
    }

    if (!isVideo) {
      setError(true);
      return undefined;
    }

    // Generate thumbnail for videos
    setLoading(true);
    setError(false);

    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    const timeoutId = setTimeout(() => {
      setError(true);
      setLoading(false);
      video.remove();
    }, 8000);

    const handleLoadedData = () => {
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setThumbnail(thumbnailDataUrl);
        setLoading(false);
        clearTimeout(timeoutId);
        video.remove();
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        setError(true);
        setLoading(false);
        clearTimeout(timeoutId);
        video.remove();
      }
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
      clearTimeout(timeoutId);
      video.remove();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.remove();
    };
  }, [url, isVideo, isImage]);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
        }}
      >
        <CircularProgress size={24} sx={{ color: '#888' }} />
      </Box>
    );
  }

  if (error || !thumbnail) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
        }}
      >
        {isVideo ? (
          <PlayCircleOutlineIcon sx={{ fontSize: 40, color: '#555' }} />
        ) : (
          <ImageIcon sx={{ fontSize: 40, color: '#555' }} />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    }}
    >
      <img
        src={thumbnail}
        alt="media"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
        }}
      />
      {isVideo && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlayCircleOutlineIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>
      )}
    </Box>
  );
};

const ReplayMediaPage = () => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const classes = useStyles();
  const reportClasses = useReportStyles();
  const theme = useTheme();

  const timerRef = useRef();
  const abortControllerRef = useRef(null);
  const mediaBarRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const devices = useSelector((state) => state.devices.items);
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);
  const selectedDeviceIdFromRedux = useSelector((state) => state.devices.selectedId);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

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
  const [miniVariant, setMiniVariant] = useState(false);

  const deviceName = useMemo(
    () => selectedDeviceId && devices[selectedDeviceId]?.name,
    [selectedDeviceId, devices],
  );

  useEffect(() => {
    const handleDrawerChange = (event) => {
      setMiniVariant(event.detail.miniVariant);
    };

    window.addEventListener('drawerStateChange', handleDrawerChange);
    return () => {
      window.removeEventListener('drawerStateChange', handleDrawerChange);
    };
  }, []);

  // FIXED: Simpler calculation that accounts for drawer position
  const mediaBarStyle = useMemo(() => {
    if (!desktop) {
      return {};
    }

    // Get drawer width based on state
    const drawerWidth = miniVariant ? 73 : 280; // Approximate pixel values
    // Wider when drawer collapsed, narrower when open
    const maxWidth = miniVariant ? 1500 : 1100;

    return {
      left: '50%',
      transform: `translateX(calc(-50% + ${drawerWidth / 2}px))`,
      maxWidth,
      width: 'fit-content',
    };
  }, [desktop, miniVariant]);

  const activeMediaIndex = useMemo(() => {
    if (!positions.length || !mediaTimeline.length) return -1;

    const currentPos = positions[index];
    if (!currentPos) return -1;

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

    return closestIndex;
  }, [positions, index, mediaTimeline]);

  useEffect(() => {
    if (activeMediaIndex >= 0 && mediaBarRef.current) {
      const mediaBar = mediaBarRef.current;
      const activeThumb = mediaBar.children[activeMediaIndex];

      if (activeThumb) {
        const thumbLeft = activeThumb.offsetLeft;
        const thumbWidth = activeThumb.offsetWidth;
        const barWidth = mediaBar.offsetWidth;
        const { scrollLeft } = mediaBar;

        if (thumbLeft < scrollLeft || thumbLeft + thumbWidth > scrollLeft + barWidth) {
          mediaBar.scrollTo({
            left: thumbLeft - barWidth / 2 + thumbWidth / 2,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [activeMediaIndex]);

  const fetchLocationName = useCallback(async (latitude, longitude, signal) => {
    try {
      const res = await fetch(
        `/api/server/geocode?latitude=${latitude}&longitude=${longitude}`,
        { signal },
      );
      if (res.ok) {
        const data = await res.json();
        return (
          data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
      }
    } catch {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }, []);

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);
    dispatch(devicesActions.selectId(null));

    try {
      const query = new URLSearchParams({ deviceId, from, to }).toString();
      const [positionsRes, eventsRes] = await Promise.all([
        fetch(`/api/positions?${query}`, { signal }),
        fetch(`/api/reports/events?${query}`, {
          headers: { Accept: 'application/json' },
          signal,
        }),
      ]);

      if (!positionsRes.ok) throw new Error(await positionsRes.text());
      if (!eventsRes.ok) throw new Error(await eventsRes.text());

      const [positionsData, allEvents] = await Promise.all([
        positionsRes.json(),
        eventsRes.json(),
      ]);
      if (!positionsData.length) throw new Error(t('sharedNoData'));

      setPositions(positionsData);

      const [startLoc, endLoc] = await Promise.all([
        fetchLocationName(
          positionsData[0].latitude,
          positionsData[0].longitude,
          signal,
        ),
        fetchLocationName(
          positionsData[positionsData.length - 1].latitude,
          positionsData[positionsData.length - 1].longitude,
          signal,
        ),
      ]);
      setStartLocation(startLoc);
      setEndLocation(endLoc);

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
          time: new Date(
            event.eventTime || event.serverTime,
          ).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
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
          const newProgress = progress + 0.02 * speed;
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
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [playing, positions.length, speed]);

  useEffect(() => {
    if (!positions.length) {
      setSmoothPosition(null);
      return;
    }
    if (index >= positions.length) {
      setSmoothPosition(positions[positions.length - 1]);
      return;
    }
    const current = positions[index];
    if (index < positions.length - 1 && animationProgress > 0) {
      const next = positions[index + 1];
      const t = animationProgress;
      setSmoothPosition({
        ...current,
        latitude: current.latitude + (next.latitude - current.latitude) * t,
        longitude: current.longitude + (next.longitude - current.longitude) * t,
      });
    } else setSmoothPosition(current);
  }, [positions, index, animationProgress]);

  const onPointClick = useCallback((_, clickedIndex) => {
    setIndex(clickedIndex);
    setAnimationProgress(0);
    setPlaying(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!mediaBarRef.current) return;
    isDraggingRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollRef.current = mediaBarRef.current.scrollLeft;
    mediaBarRef.current.style.cursor = 'grabbing';
    mediaBarRef.current.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (dragStartXRef.current === 0) return;

    const dx = e.pageX - dragStartXRef.current;

    if (Math.abs(dx) > 5) {
      isDraggingRef.current = true;
    }

    if (mediaBarRef.current && isDraggingRef.current) {
      mediaBarRef.current.scrollLeft = dragStartScrollRef.current - dx;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (mediaBarRef.current) {
      mediaBarRef.current.style.cursor = 'grab';
      mediaBarRef.current.style.userSelect = 'auto';
    }
    dragStartXRef.current = 0;

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  }, []);

  const handleMediaClick = useCallback((media) => {
    if (isDraggingRef.current) {
      return;
    }

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

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleClose = useCallback(() => {
    setPositions([]);
    setMediaTimeline([]);
    setStartLocation('');
    setEndLocation('');
    setIndex(0);
    setAnimationProgress(0);
    setPlaying(false);
    setOpenMedia(null);
    dispatch(devicesActions.selectId(null));
  }, [dispatch]);

  const currentPosition = positions[index];

  if (!positions.length) {
    return (
      <PageLayout
        menu={<ReportsMenu />}
        breadcrumbs={['reportTitle', 'reportReplayMedia']}
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
            <MapRoutePoints
              positions={positions}
              onClick={(pos, idx) => {
                onPointClick(pos, idx);

                if (selectedDeviceId) {
                  dispatch(devicesActions.selectId(selectedDeviceId));
                }
              }}
            />
            {smoothPosition && (
              <MapPositions
                positions={[smoothPosition]}
                titleField="fixTime"
                customIcon="event-error"
              />
            )}
          </MapView>
          <MapCamera positions={positions} />
          <MapScale />
        </div>

        <div className={classes.sidebar}>
          <Paper elevation={4}>
            <Toolbar>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ flexGrow: 1 }}
                className={classes.toolbarTitle}
              >
                {t('reportReplay')}
                {' '}
                -
                {' '}
                {deviceName || t('sharedDevice')}
              </Typography>
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
              <IconButton
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={playing || index <= 0}
              >
                <FastRewindIcon />
              </IconButton>
              <IconButton
                onClick={() => setPlaying((p) => !p)}
                disabled={index >= positions.length - 1 && !playing}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton
                onClick={() => setIndex((i) => Math.min(i + 1, positions.length - 1))}
                disabled={playing || index >= positions.length - 1}
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
            </Box>
          </Paper>
        </div>

        {mediaTimeline.length > 0 && (
        <Paper
          ref={mediaBarRef}
          className={classes.mediaBar}
          style={mediaBarStyle}
          elevation={6}
          onMouseDown={handleMouseDown}
        >
          {mediaTimeline.map((item, idx) => (
            <Box
              key={item.id}
              onClick={() => handleMediaClick(item)}
              className={`${classes.thumb} ${
                openMedia?.id === item.id ? classes.thumbSelected : ''
              } ${
                idx === activeMediaIndex ? classes.thumbActive : ''
              }`}
            >
              <MediaThumbnail
                url={item.url}
                isVideo={item.isVideo}
                isImage={item.isImage}
              />
            </Box>
          ))}
        </Paper>
        )}

        {openMedia && (
        <MediaPreview
          open={!!openMedia}
          mediaUrl={openMedia.url}
          onClose={() => setOpenMedia(null)}
        />
        )}

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
