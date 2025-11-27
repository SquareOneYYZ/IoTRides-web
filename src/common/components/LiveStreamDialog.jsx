import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Draggable from 'react-draggable';
import {
  Card,
  CardActions,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import { livestreamActions } from '../../store/livestream';
import VideoBlock from './VideoBlock';

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: '370px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
    borderRadius: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      width: '90vw',
      maxWidth: '400px',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1.5),
    cursor: 'move',
    backgroundColor: '#1e1e1e',
    borderBottom: '1px solid #333',
    minHeight: '40px',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.5, 1),
    },
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    backgroundColor: '#000',
    aspectRatio: '16/9',
    [theme.breakpoints.down('sm')]: {
      aspectRatio: '16/9',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0.5),
    },
  },
  videoBlock: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
    borderRadius: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      borderRadius: theme.spacing(0.25),
    },
  },
  actions: {
    color: theme.palette.primary.contrastText,
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  responsiveContainer: {
    [theme.breakpoints.down('sm')]: {
      left: '50% !important',
      top: '20% !important',
      bottom: 'auto !important',
    },
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
}));

const LiveStreamCard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { open, deviceId } = useSelector((state) => state.livestream);
  const device = useSelector((state) => state.devices.items[deviceId]);
  const [uniqueId, setUniqueId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCommandTime, setLastCommandTime] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [numCamera, setNumCamera] = useState(4);
  const [retrySent, setRetrySent] = useState(false);

  const fetchUniqueId = async (devId) => {
    try {
      const response = await fetch(`/api/devices/${devId}`);
      if (!response.ok) {
        throw Error('Failed to fetch device details');
      }
      const deviceData = await response.json();
      const cameras = deviceData.attributes?.NumCamera || 4;
      const maxCameras = Math.min(cameras, 4);
      setNumCamera(maxCameras);
      return { uniqueId: deviceData.uniqueId || devId, numCamera: maxCameras };
    } catch (error) {
      console.error(`Error fetching uniqueId for device ${devId}:`, error);
      setNumCamera(4);
      return { uniqueId: devId, numCamera: 4 };
    }
  };

  const sendChannelCommand = useCallback(async (channels) => {
    const channelKey = channels.join(',');
    const now = Date.now();
    const lastTime = lastCommandTime[channelKey] || 0;
    const timeDiff = (now - lastTime) / 1000;

    if (timeDiff < 15) {
      const remainingTime = Math.ceil(15 - timeDiff);
      setSnackbar({
        open: true,
        message: `Please wait ${remainingTime} seconds before sending command again`,
        severity: 'warning',
      });
      return false;
    }

    const payload = {
      deviceId,
      type: 'liveStream',
      attributes: {
        channels,
        noQueue: false,
      },
    };

    try {
      setLoading(true);
      const response = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw Error(await response.text());
      }

      setLastCommandTime((prev) => ({
        ...prev,
        [channelKey]: now,
      }));
      return true;
    } catch (error) {
      console.error('Failed to send livestream command:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send command',
        severity: 'error',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [deviceId, lastCommandTime]);

  const hasAnyVideoStarted = () => {
    const videos = document.querySelectorAll('.video-block video');
    return Array.from(videos).some((v) => !v.paused && !v.ended);
  };

  useEffect(() => {
    const loadUniqueIdAndStartStream = async () => {
      if (deviceId && open) {
        setLoading(true);
        const { uniqueId: id, numCamera: cameras } = await fetchUniqueId(deviceId);
        setUniqueId(id);

        const ok = await sendChannelCommand(Array.from({ length: cameras }, (_, i) => i + 1));

        if (ok) {
          setTimeout(() => {
            const videos = document.querySelectorAll('.video-block video');
            videos.forEach((v) => v.play().catch(() => {}));
          }, 800);

          setTimeout(async () => {
            if (!hasAnyVideoStarted() && !retrySent) {
              console.log('Playback not started → Sending retry command');
              setRetrySent(true);

              await sendChannelCommand(
                Array.from({ length: cameras }, (_, i) => i + 1),
              );
            }
          }, 15000);
        }

        setLoading(false);
      }
    };

    loadUniqueIdAndStartStream();
  }, [deviceId, open]);

  if (!open || !deviceId) return null;

  const handleClose = () => {
    dispatch(livestreamActions.closeLivestream());
    setLastCommandTime({});
  };

  const cameraStreams = uniqueId
    ? Array.from({ length: numCamera }, (_, i) => ({
      title: `Camera ${i + 1}`,
      src: `https://staging.streaming.iotrides.com:8889/${uniqueId}_ch${i + 1}/`,
      channel: i + 1,
    }))
    : [];

  const getGridLayout = (count) => {
    switch (count) {
      case 1:
        return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
      case 2:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
      case 3:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case 4:
      default:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
    }
  };

  const getAspectRatio = (count) => {
    if (count === 1) return '16/9';
    if (count === 2) return '32/9';
    return '16/9';
  };

  const gridLayout = getGridLayout(numCamera);
  const aspectRatio = getAspectRatio(numCamera);

  return (
    <div
      style={{
        pointerEvents: 'auto',
        position: 'fixed',
        zIndex: 10,
        left: '86%',
        bottom: '1.7rem',
        transform: 'translateX(-50%)',
      }}
      className={classes.responsiveContainer}
    >
      <Draggable
        handle={`.${classes.header}`}
        disabled={window.innerWidth <= 600}
      >
        <Card elevation={5} className={classes.card}>
          <div className={classes.header}>
            <Typography variant="body2" color="textSecondary">
              Live Stream -
              {' '}
              {device?.name || `Device ${deviceId}`}
            </Typography>
            <CardActions className={classes.actions}>
              <Tooltip title="Close Stream">
                <IconButton onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </div>

          {loading ? (
            <div className={classes.loadingContainer}>
              <CircularProgress />
            </div>
          ) : (
            <div
              className={classes.content}
              style={{
                ...gridLayout,
                aspectRatio,
              }}
            >
              {cameraStreams.map((video) => (
                <VideoBlock
                  key={video.title}
                  title={video.title}
                  src={video.src}
                  className={`${classes.videoBlock} video-block`}
                  showLaunch
                  showFocusIcon
                  deviceId={deviceId}
                  channelId={video.channel}
                  onFocus={() => sendChannelCommand([video.channel])}
                  onPlayCommand={() => sendChannelCommand([video.channel])}
                />
              ))}
            </div>
          )}
        </Card>
      </Draggable>
    </div>
  );
};

export default LiveStreamCard;
