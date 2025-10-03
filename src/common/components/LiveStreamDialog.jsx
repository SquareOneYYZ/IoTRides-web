import React, { useRef, useState } from 'react';
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
import { Fullscreen, PlayArrow } from '@mui/icons-material';
import PauseIcon from '@mui/icons-material/Pause';
import { livestreamActions } from '../../store/livestream';

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
}));

const VideoBlock = ({ src, className }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  const handlePlayPause = () => {
    if (!isStarted) {
      setIsStarted(true);
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const handleMouseMove = () => {
    if (isStarted) {
      setShowControls(true);

      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }

      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 2000);

      setControlsTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && isStarted) {
      setShowControls(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!isStarted && (
          <button
            type="button"
            aria-label="Play Pause"
            onClick={handlePlayPause}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000000b1',
              cursor: 'pointer',
              zIndex: 5,
              border: 'none',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="white"
                opacity="0.85"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 3.07 1.99 5.64 4.74 6.57l-.74 2.43h-2a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2h-2l-.74-2.43A7 7 0 0 0 19 9a7 7 0 0 0-7-7zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c.7 0 1.39.1 2.05.29l.58 1.71h-5.26l.58-1.71c.66-.19 1.35-.29 2.05-.29z" />
              </svg>
            </div>
          </button>
        )}

        <video
          ref={videoRef}
          src={src}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            visibility: isStarted ? 'visible' : 'hidden',
          }}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          onClick={handlePlayPause}
          controls={false}
        >
          <track
            kind="captions"
            src="captions.vtt"
            srcLang="en"
            label="English"
          />
        </video>

        {(isStarted || showControls) && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '10%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '12px 16px',
              gap: '12px',
              opacity: showControls ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'auto',
              zIndex: 10,
            }}
            onMouseEnter={() => setShowControls(true)}
          >
            <button
              type="button"
              onClick={handlePlayPause}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              {isPlaying ? (
                <PauseIcon sx={{ fontSize: 25 }} />
              ) : (
                <PlayArrow sx={{ fontSize: 25 }} />
              )}
            </button>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              aria-label="Fullscreen"
              onClick={handleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              <Fullscreen />
            </button>
          </div>
        )}
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

  const frontCameraSrc = 'Sample footage24fps.mp4';
  const leftCameraSrc = 'Sample footage24fps.mp4';
  const rightCameraSrc = 'Sample footage24fps.mp4';
  const rearCameraSrc = 'Sample footage24fps.mp4';

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
            {[
              { title: 'Front Camera', src: frontCameraSrc },
              { title: 'Left Camera', src: leftCameraSrc },
              { title: 'Right Camera', src: rightCameraSrc },
              { title: 'Rear Camera', src: rearCameraSrc },
            ].map((video) => (
              <VideoBlock
                key={video.title}
                title={video.title}
                src={video.src}
                className={classes.videoBlock}
              />
            ))}
          </div>
        </Card>
      </Draggable>
    </div>
  );
};

export default LiveStreamCard;
