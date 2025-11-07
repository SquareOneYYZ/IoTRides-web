import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { PlayArrow, Stop, LocationOn } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import VideoBlock from '../common/components/VideoBlock';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    backgroundColor: '#1e1e1e',
    color: '#fff',
    boxShadow: theme.shadows[2],
    position: 'relative',

    [theme.breakpoints.down('md')]: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing(1.5),
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
    },
  },
  leftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(60),

    '& > div:first-child': {
      display: 'flex',
      flexDirection: 'column',
    },

    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: 'auto',
      gap: theme.spacing(0.5),
      flex: 1,
    },
  },
  rightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    position: 'relative',

    [theme.breakpoints.down('md')]: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 'auto',
    },
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),

    [theme.breakpoints.down('md')]: {
      justifyContent: 'flex-end',
      marginTop: theme.spacing(5),
      gap: theme.spacing(1),
      '& button': {
        padding: theme.spacing(0.2, 1.2),
        fontSize: '0.8rem',
        minWidth: 'auto',
      },
    },
  },
  closeBtn: {
    color: '#fff',
    [theme.breakpoints.down('md')]: {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 10,
    },
  },
  liveStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.8),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: 600,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#ff3b30',
    boxShadow: '0 0 6px #ff3b30',
  },
  deviceName: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: theme.spacing(0.5),
    fontSize: '0.9rem',
    [theme.breakpoints.down('md')]: {
      textAlign: 'center',
      fontSize: '0.85rem',
    },
  },
  headerTitle: {
    [theme.breakpoints.down('md')]: {
      display: 'flex',
      fontSize: '1rem',
      width: '100%',
      marginBottom: theme.spacing(1.5),
      textAlign: 'center',
    },
  },
  layoutButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  layoutBtn: {
    minWidth: 30,
    height: 30,
    fontSize: '0.75rem',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    '&.active': {
      backgroundColor: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  },
  content: {
    flex: 1,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1),
    },
  },
  videoGrid: {
    flex: 1,
    display: 'grid',
    gap: theme.spacing(1),
    width: '100%',
    height: '100%',

    [theme.breakpoints.down('md')]: {
      display: 'none',
    },

    '&.layout-1': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    },
    '&.layout-2': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
    },
    '&.layout-3': {
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 1fr',
      '& > *:nth-child(1)': {
        gridRow: '1 / span 2',
        gridColumn: '1 / 2',
      },
      '& > *:nth-child(2)': {
        gridRow: '1 / 2',
        gridColumn: '2 / 3',
      },
      '& > *:nth-child(3)': {
        gridRow: '2 / 3',
        gridColumn: '2 / 3',
      },
    },
    '&.layout-4': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    '&.layout-5': {
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      '& > *:nth-child(1)': {
        gridRow: '1 / span 2',
        gridColumn: '1 / 2',
      },
      '& > *:nth-child(2)': {
        gridRow: '1 / 2',
        gridColumn: '2 / 3',
      },
      '& > *:nth-child(3)': {
        gridRow: '1 / 2',
        gridColumn: '3 / 4',
      },
      '& > *:nth-child(4)': {
        gridRow: '2 / 3',
        gridColumn: '2 / 3',
      },
      '& > *:nth-child(5)': {
        gridRow: '2 / 3',
        gridColumn: '3 / 4',
      },
    },
    '&.layout-6': {
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      '& > *:nth-child(1)': {
        gridRow: '1 / span 3',
        gridColumn: '1 / 2',
      },
      '& > *:nth-child(2)': {
        gridRow: '1 / 2',
        gridColumn: '2 / 4',
      },
      '& > *:nth-child(3)': {
        gridRow: '2 / 3',
        gridColumn: '2 / 3',
      },
      '& > *:nth-child(4)': {
        gridRow: '2 / 3',
        gridColumn: '3 / 4',
      },
      '& > *:nth-child(5)': {
        gridRow: '3 / 4',
        gridColumn: '2 / 3',
      },
      '& > *:nth-child(6)': {
        gridRow: '3 / 4',
        gridColumn: '3 / 4',
      },
    },
  },
  mobileView: {
    display: 'none',
    [theme.breakpoints.down('md')]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: theme.spacing(1),
    },
  },
  mainVideoContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    position: 'relative',
    minHeight: 0,
  },
  mobileVideoGrid: {
    display: 'none',
    [theme.breakpoints.down('md')]: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing(1),
      height: '100%',
      flex: 1,
    },
  },
  thumbnailContainer: {
    minWidth: 100,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    backgroundColor: '#2a2a2a',
    '&.active': {
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    },
    '&:hover': {
      border: '2px solid rgba(255,255,255,0.5)',
    },
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: theme.spacing(0.5),
    fontSize: '0.65rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  thumbnailFocusBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 2,
    minWidth: 24,
    minHeight: 24,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  carouselArrow: {
    minWidth: 32,
    padding: theme.spacing(0.5),
    color: '#fff',
  },
  emptyBlock: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    border: '1px dashed rgba(255,255,255,0.2)',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
}));

const LiveStreamingPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [currentLayout, setCurrentLayout] = useState(1);
  const [focusedCameraIndex, setFocusedCameraIndex] = useState(0);
  const [uniqueId, setUniqueId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { open, deviceId } = useSelector((state) => state.livestream);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const fetchUniqueId = async (devId) => {
    try {
      const response = await fetch(`/api/devices/${devId}`);
      if (!response.ok) {
        throw Error('Failed to fetch device details');
      }
      const deviceData = await response.json();
      return deviceData.uniqueId || devId;
    } catch (error) {
      console.error(`Error fetching uniqueId for device ${devId}:`, error);
      return devId;
    }
  };

  useEffect(() => {
    const loadUniqueId = async () => {
      if (deviceId) {
        setLoading(true);
        const id = await fetchUniqueId(deviceId);
        setUniqueId(id);
        setLoading(false);
      }
    };

    loadUniqueId();
  }, [deviceId]);

  if (!open || !deviceId) return null;

  const handleStartAll = () => console.log('Starting all streams');
  const handleStopAll = () => console.log('Stopping all streams');
  const handleLocation = () => navigate('/map');
  const handleBack = () => navigate(-1);

  const videoSources = uniqueId
    ? [
      {
        id: 1,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch1/`,
        title: 'Front Camera',
      },
      {
        id: 2,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch2/`,
        title: 'Left Camera',
      },
      {
        id: 3,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch3/`,
        title: 'Right Camera',
      },
      {
        id: 4,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch4/`,
        title: 'Rear Camera',
      },
      {
        id: 5,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch5/`,
        title: 'Top Camera',
      },
      {
        id: 6,
        src: `rtsp://137.184.170.216:8554/${uniqueId}_ch6/`,
        title: 'Bottom Camera',
      },
    ]
    : [];

  const totalSlots = Number(currentLayout);

  const reorderedVideos = [...videoSources];
  if (focusedCameraIndex > 0 && focusedCameraIndex < reorderedVideos.length) {
    [reorderedVideos[0], reorderedVideos[focusedCameraIndex]] = [
      reorderedVideos[focusedCameraIndex],
      reorderedVideos[0],
    ];
  }

  const filledVideos = reorderedVideos.slice(0, totalSlots);
  const emptySlots = totalSlots - filledVideos.length;

  const handleCameraFocus = (originalIndex) => {
    if ([3, 5, 6].includes(currentLayout)) {
      setFocusedCameraIndex(originalIndex);
    }
  };

  const handleMobileCameraSwitch = (index) => {
    setFocusedCameraIndex(index);
  };
  const isFocusEnabled = [3, 5, 6].includes(currentLayout);

  if (loading) {
    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <Typography variant="h6">Loading Live Stream...</Typography>
        </div>
        <div className={classes.content}>
          <div className={classes.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" color="textSecondary">
              Fetching device information...
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.leftHeader}>
          <div>
            <div className={classes.liveStatus}>
              <Typography variant="body2">Live Stream</Typography>
              <span className={classes.redDot} />
            </div>
            <Typography variant="h6">
              {device?.name || `Device ${deviceId}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {videoSources.length}
              {' '}
              cameras connected
            </Typography>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className={classes.layoutButtons}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                type="button"
                key={num}
                className={`${classes.layoutBtn} ${
                  currentLayout === num ? 'active' : ''
                }`}
                onClick={() => setCurrentLayout(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className={classes.rightHeader}>
          <div className={classes.controls}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleStartAll}
              sx={{ mr: 1 }}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Stop />}
              onClick={handleStopAll}
              sx={{ mr: 1 }}
            >
              Stop
            </Button>
            <Button
              variant="text"
              color="inherit"
              startIcon={<LocationOn />}
              onClick={handleLocation}
              sx={{ mr: 1, display: { xs: 'none', sm: 'flex' } }}
            >
              Location
            </Button>

            <IconButton
              color="inherit"
              onClick={handleBack}
              className={classes.closeBtn}
              sx={{
                '@media (max-width: 900px)': {
                  padding: 1.5,
                  '& svg': {
                    fontSize: '2rem',
                  },
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </div>
      </div>

      <div className={classes.content}>
        <div className={`${classes.videoGrid} layout-${currentLayout}`}>
          {filledVideos.map((video) => {
            const originalIndex = videoSources.findIndex(
              (v) => v.id === video.id,
            );

            return (
              <VideoBlock
                key={video.id}
                src={video.src}
                title={video.title}
                className={classes.videoContainer}
                showLaunch={false}
                showFocusIcon={isFocusEnabled}
                onFocus={() => handleCameraFocus(originalIndex)}
              />
            );
          })}

          {Array.from({ length: emptySlots > 0 ? emptySlots : 0 }).map(
            (_, i) => {
              const key = `empty-${i}-${currentLayout}-${Date.now()}`;
              return <div key={key} className={classes.emptyBlock} />;
            },
          )}
        </div>

        <div className={classes.mobileView}>
          <div className={classes.mainVideoContainer}>
            {videoSources.map((video) => (
              <VideoBlock
                key={video.id}
                src={video.src}
                title={video.title}
                showLaunch={false}
                showFocusIcon
                onFocus={() => handleMobileCameraSwitch(
                  videoSources.findIndex((v) => v.id === video.id),
                )}
              />
            ))}
          </div>

          <div className={classes.mobileVideoGrid}>
            {videoSources.map((video, index) => (
              <VideoBlock
                key={video.id}
                src={video.src}
                title={video.title}
                showLaunch={false}
                showFocusIcon
                onFocus={() => handleMobileCameraSwitch(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamingPage;
