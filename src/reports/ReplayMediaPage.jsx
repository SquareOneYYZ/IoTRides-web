import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  IconButton,
  Paper,
  Box,
  Toolbar,
  Typography,
  Slider,
  Dialog,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
import MapPositions from '../map/MapPositions';
import MapGeofence from '../map/MapGeofence';
import MapCamera from '../map/MapCamera';
import MapScale from '../map/MapScale';
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
      backgroundColor: '#bbb', // line color
      zIndex: 0,
    },
    '&:last-child::before': {
      display: 'none', // hide line after last item
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

  // Mock media timeline - replace with actual API call
  const mediaTimeline = [
    { id: 1, thumb: 'https://picsum.photos/id/1015/120/80', full: 'https://picsum.photos/id/1015/800/500', time: '10:00 AM' },
    { id: 2, thumb: 'https://picsum.photos/id/1016/120/80', full: 'https://picsum.photos/id/1016/800/500', time: '10:05 AM' },
    { id: 3, thumb: 'https://picsum.photos/id/1018/120/80', full: 'https://picsum.photos/id/1018/800/500', time: '10:10 AM' },
    { id: 4, thumb: 'https://picsum.photos/id/1020/120/80', full: 'https://picsum.photos/id/1020/800/500', time: '10:15 AM' },
    { id: 5, thumb: 'https://picsum.photos/id/1021/120/80', full: 'https://picsum.photos/id/1021/800/500', time: '10:20 AM' },
    { id: 6, thumb: 'https://picsum.photos/id/1022/120/80', full: 'https://picsum.photos/id/1022/800/500', time: '10:25 AM' },
    { id: 7, thumb: 'https://picsum.photos/id/1023/120/80', full: 'https://picsum.photos/id/1023/800/500', time: '10:30 AM' },
    { id: 8, thumb: 'https://picsum.photos/id/1024/120/80', full: 'https://picsum.photos/id/1024/800/500', time: '10:35 AM' },
    { id: 9, thumb: 'https://picsum.photos/id/1025/120/80', full: 'https://picsum.photos/id/1025/800/500', time: '10:40 AM' },
    { id: 10, thumb: 'https://picsum.photos/id/1026/120/80', full: 'https://picsum.photos/id/1026/800/500', time: '10:45 AM' },
  ];

  const deviceName = selectedDeviceId && devices[selectedDeviceId]?.name;

  // Fetch location names using reverse geocoding
  const fetchLocationName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `/api/server/geocode?latitude=${latitude}&longitude=${longitude}`,
      );
      if (response.ok) {
        const data = await response.json();
        return data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    setLoading(true);
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    const query = new URLSearchParams({ deviceId, from, to });

    try {
      const response = await fetch(`/api/positions?${query.toString()}`);
      if (response.ok) {
        setIndex(0);
        const positions = await response.json();
        setPositions(positions);

        if (positions.length > 0) {
          // Fetch start and end locations
          const startLoc = await fetchLocationName(
            positions[0].latitude,
            positions[0].longitude,
          );
          const endLoc = await fetchLocationName(
            positions[positions.length - 1].latitude,
            positions[positions.length - 1].longitude,
          );
          setStartLocation(startLoc);
          setEndLocation(endLoc);
        } else {
          throw Error(t('sharedNoData'));
        }
      } else {
        throw Error(await response.text());
      }
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
                return next;
              }
              return next;
            });
            return 0;
          }
          return newProgress;
        });
      }, 16);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions, speed]);

  useEffect(() => {
    if (positions.length > 0 && index < positions.length - 1) {
      const cur = positions[index];
      const next = positions[index + 1];
      if (cur && next) {
        const interp = {
          ...cur,
          latitude: cur.latitude + (next.latitude - cur.latitude) * animationProgress,
          longitude: cur.longitude + (next.longitude - cur.longitude) * animationProgress,
        };
        setSmoothPosition(interp);
      }
    } else if (positions.length > 0 && index < positions.length) {
      setSmoothPosition(positions[index]);
    }
  }, [positions, index, animationProgress]);

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

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
            {smoothPosition && (
              <MapPositions positions={[smoothPosition]} titleField="fixTime" />
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
              <IconButton onClick={() => setPositions([])}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </Paper>

          <Paper className={classes.sidebarContent}>
            <Typography variant="subtitle1" fontWeight="bold">
              {positions[index]
                ? new Date(positions[index].fixTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZoneName: 'short',
                })
                : '--'}
            </Typography>

            <Box className={classes.timelineContainer}>
              <Box className={classes.timelineItem}>
                <Box className={classes.marker}>B</Box>
                <Box>
                  <Typography fontWeight="bold">End: 43.3796, -79.8377</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Aug 29, 8:22 PM GMT+5:30
                  </Typography>
                </Box>
              </Box>

              <Box className={classes.timelineItem}>
                <Box className={classes.marker}>A</Box>
                <Box>
                  <Typography fontWeight="bold">Start: 41.9791, -87.8778</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Aug 19, 10:53 PM GMT+5:30
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Slider
              max={positions.length - 1}
              step={null}
              marks={positions.map((_, i) => ({ value: i }))}
              value={index}
              onChange={(_, i) => setIndex(i)}
            />

            <div className={classes.controls}>
              <IconButton
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={playing || index <= 0}
                size="small"
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={() => setPlaying(!playing)}
                disabled={index >= positions.length - 1}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={() => setIndex((i) => Math.min(i + 1, positions.length - 1))}
                disabled={playing || index >= positions.length - 1}
                size="small"
              >
                <FastForwardIcon />
              </IconButton>

              <Typography variant="caption">
                {index + 1}
                {' '}
                /
                {positions.length}
              </Typography>
            </div>
          </Paper>
        </div>

        <Paper elevation={8} className={classes.mediaBar}>
          {mediaTimeline.map((item) => (
            <Box
              key={item.id}
              onClick={() => setOpenMedia(item)}
              className={`${classes.thumb} ${openMedia?.id === item.id ? classes.thumbSelected : ''}`}
            >
              <img src={item.thumb} alt="thumb" width={120} height={80} style={{ display: 'block' }} />
              <Typography align="center" variant="caption" sx={{ fontSize: '0.65rem', p: 0.5 }}>
                {item.time}
              </Typography>
            </Box>
          ))}
        </Paper>

        <Dialog open={!!openMedia} onClose={() => setOpenMedia(null)} maxWidth="md">
          {openMedia && (
            <img src={openMedia.full} alt="preview" style={{ width: '100%', height: 'auto' }} />
          )}
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default ReplayMediaPage;
