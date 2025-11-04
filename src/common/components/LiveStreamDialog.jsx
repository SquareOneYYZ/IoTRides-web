import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Draggable from 'react-draggable';
import {
  Card,
  CardActions,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
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
  const [loading, setLoading] = useState(true);

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

  const handleClose = () => {
    dispatch(livestreamActions.closeLivestream());
  };

  const cameraStreams = uniqueId ? [
    { title: 'Front Camera', src: `http://143.110.213.79:8889/${uniqueId}_ch1/` },
    { title: 'Left Camera', src: `http://143.110.213.79:8889/${uniqueId}_ch2/` },
    { title: 'Right Camera', src: `http://143.110.213.79:8889/${uniqueId}_ch3/` },
    { title: 'Rear Camera', src: `http://143.110.213.79:8889/${uniqueId}_ch4/` },
  ] : [];

  return (
    <div
      style={{
        pointerEvents: 'auto',
        position: 'fixed',
        zIndex: 10,
        left: '82%',
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
            <div className={classes.content}>
              {cameraStreams.map((video) => (
                <VideoBlock
                  key={video.title}
                  title={video.title}
                  src={video.src}
                  className={classes.videoBlock}
                  showLaunch
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
