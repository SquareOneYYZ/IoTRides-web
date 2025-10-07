import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Typography, Tooltip } from '@mui/material';
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
  },
  layoutButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
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
  controls: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
  },
  videoGrid: {
    flex: 1,
    display: 'grid',
    gap: theme.spacing(1),
    width: '100%',
    height: '100%',

    '&.layout-1': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    },
    '&.layout-2': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
    },
    '&.layout-3': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      '& > *:nth-child(3)': {
        gridColumn: '1 / -1',
        justifySelf: 'center',
        width: '50%',
      },
    },
    '&.layout-4': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    '&.layout-5': {
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      '& > *:nth-child(1)': {
        gridRow: '1 / span 3',
        gridColumn: '1 / 2',
      },
      '& > *:nth-child(n+2)': {
        gridColumn: '2 / 3',
      },
    },
    '&.layout-6': {
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      '& > *:nth-child(1)': {
        gridRow: '1 / span 3',
        gridColumn: '1 / 2',
      },
    },
  },

  emptyBlock: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    border: '1px dashed rgba(255,255,255,0.2)',
  },
}));

const LiveStreamingPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [currentLayout, setCurrentLayout] = useState(4);

  const { open, deviceId } = useSelector((state) => state.livestream);
  const device = useSelector((state) => state.devices.items[deviceId]);
  if (!open || !deviceId) return null;

  const handleStartAll = () => console.log('Starting all streams');
  const handleStopAll = () => console.log('Stopping all streams');
  const handleLocation = () => navigate('/map');
  const handleBack = () => navigate(-1);

  const videoSources = [
    { id: 1, src: '/Sample footage24fps.mp4', title: 'Front Camera' },
    { id: 2, src: '/Sample footage24fps.mp4', title: 'Left Camera' },
    { id: 3, src: '/Sample footage24fps.mp4', title: 'Right Camera' },
    { id: 4, src: '/Sample footage24fps.mp4', title: 'Rear Camera' },
    { id: 5, src: '/Sample footage24fps.mp4', title: 'Top Camera' },
    { id: 6, src: '/Sample footage24fps.mp4', title: 'Bottom Camera' },
  ];

  const totalSlots = Number(currentLayout);
  const filledVideos = videoSources.slice(0, totalSlots);
  const emptySlots = totalSlots - filledVideos.length;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div>
          <Typography variant="h6" fontWeight="bold">
            Live Stream - {device?.name || `Device ${deviceId}`}
          </Typography>
        </div>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {videoSources.length} cameras connected
          </Typography>

          <div className={classes.layoutButtons}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
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

        <div className={classes.controls}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={handleStartAll}
            sx={{ mr: 1 }}
          >
            Start All
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Stop />}
            onClick={handleStopAll}
            sx={{ mr: 1 }}
          >
            Stop All
          </Button>
          <Button
            variant="text"
            color="inherit"
            startIcon={<LocationOn />}
            onClick={handleLocation}
            sx={{ mr: 1 }}
          >
            Location
          </Button>

          <IconButton color="inherit" onClick={handleBack}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div className={classes.content}>
        <div className={`${classes.videoGrid} layout-${currentLayout}`}>
          {filledVideos.map((video) => (
            <VideoBlock
              key={video.id}
              src={video.src}
              title={video.title}
              className={classes.videoContainer}
            />
          ))}

          {Array.from({ length: emptySlots > 0 ? emptySlots : 0 }).map(
            (_, idx) => (
              <div key={`empty-${idx}`} className={classes.emptyBlock} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamingPage;
