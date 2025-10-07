import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Typography, Tooltip } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { PlayArrow, Stop, LocationOn, ArrowBack } from '@mui/icons-material';
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
  layoutOptions: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
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
      },
    },
    '&.layout-4': {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
  },
}));

const LiveStreamingPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [currentLayout, setCurrentLayout] = useState('2');

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
  ];

  return (
    <div className={classes.root}>
      {/* Header */}
      <div className={classes.header}>
        {/* Left Section */}
        <div className={classes.layoutOptions}>
          <Typography variant="h6" fontWeight="bold">
            Live Stream - {device?.name || `Device ${deviceId}`}
          </Typography>
        </div>

        {/* Center Section */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {videoSources.length} cameras connected
          </Typography>
        </div>

        {/* Right Section */}
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
            <ArrowBack />
          </IconButton>
        </div>
      </div>

      {/* Video Content */}
      <div className={classes.content}>
        <div className={`${classes.videoGrid} layout-${currentLayout}`}>
          {videoSources.map((video) => (
            <VideoBlock
              key={video.id}
              src={video.src}
              title={video.title}
              className={classes.videoContainer}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamingPage;
