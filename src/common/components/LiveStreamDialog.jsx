import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Draggable from 'react-draggable';
import {
  Card,
  CardActions,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { livestreamActions } from '../../store/livestream';

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: '20vw',
    height: '40vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0, 1.5),
  },
  content: {
    flex: 1,
    display: 'grid',
    gridTemplateRows: '2fr 1fr',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: '#000',
    minHeight: 0, // Important for proper grid sizing
  },
  topBlock: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    position: 'relative',
    minHeight: 0, // Important for iframe sizing
    overflow: 'hidden',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1),
    height: '100%',
  },
  streamBlock: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    position: 'relative',
    minHeight: 0, // Important for iframe sizing
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'block', // Changed from flex to block
    '&:hover $videoControls': {
      opacity: 1,
    },
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    border: 'none',
    borderRadius: 0,
  },
  videoControls: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 2,
  },
  fullscreenBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  actions: {
    color: theme.palette.primary.contrastText,
    justifyContent: 'flex-end',
  },
}));

const VideoBlock = ({ title, src, className }) => {
  const classes = useStyles();
  const iframeRef = useRef(null);

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      } else if (iframeRef.current.mozRequestFullScreen) {
        iframeRef.current.mozRequestFullScreen();
      } else if (iframeRef.current.msRequestFullscreen) {
        iframeRef.current.msRequestFullscreen();
      }
    }
  };

  return (
    <div className={className}>
      <div className={classes.videoContainer}>
        <iframe
          ref={iframeRef}
          src={src}
          className={classes.video}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <div className={classes.videoControls}>
          <Tooltip title="Fullscreen">
            <IconButton
              onClick={handleFullscreen}
              className={classes.fullscreenBtn}
              size="small"
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
        {/* Title overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
};

const LiveStreamCard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { open, deviceId } = useSelector((state) => state.livestream);
  const device = useSelector((state) => state.devices.items[deviceId]);

  if (!open || !deviceId) return null;

  const handleClose = () => {
    dispatch(livestreamActions.closeLivestream());
  };

  // YouTube embed URLs converted from your links
  const frontCameraSrc =
    'https://www.youtube.com/embed/m5BFMn56sos?si=jivn85wANj6EphDP&autoplay=1&mute=1';
  const leftCameraSrc =
    'https://www.youtube.com/embed/OX5bf1lN7LE?si=ASrLJgqFhhf0WtgB&autoplay=1&mute=1';
  const rightCameraSrc =
    'https://www.youtube.com/embed/kIqikl_0xAs?si=pn_hEzgO8l-Uzwzy&autoplay=1&mute=1';

  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 10,
        left: '82%',
        bottom: '1.5rem',
        transform: 'translateX(-50%)',
      }}
    >
      <Draggable handle={`.${classes.header}`}>
        <Card elevation={5} className={classes.card}>
          <div className={classes.header}>
            <Typography variant="body2" color="textSecondary">
              Live Stream - {device?.name || `Device ${deviceId}`}
            </Typography>
            <CardActions className={classes.actions}>
              <Tooltip title="Close Stream">
                <IconButton onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </div>

          <div className={classes.content}>
            <VideoBlock
              title="Front Camera"
              src={frontCameraSrc}
              className={classes.topBlock}
            />

            <div className={classes.bottomRow}>
              <VideoBlock
                title="Left Camera"
                src={leftCameraSrc}
                className={classes.streamBlock}
              />
              <VideoBlock
                title="Right Camera"
                src={rightCameraSrc}
                className={classes.streamBlock}
              />
            </div>
          </div>
        </Card>
      </Draggable>
    </div>
  );
};

export default LiveStreamCard;
