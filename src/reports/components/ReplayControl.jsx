import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Slider,
  Box,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import DownloadIcon from '@mui/icons-material/Download';
import { formatTime } from '../../common/util/formatter';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { prefixString } from '../../common/util/stringUtils';
import MapView from '../../map/core/MapView';
import MapGeofence from '../../map/MapGeofence';
import MapRoutePath from '../../map/MapRoutePath';
import MapRoutePoints from '../../map/MapRoutePoints';
import MapPositions from '../../map/MapPositions';
import MapCamera from '../../map/MapCamera';
import MapScale from '../../map/MapScale';
import StatusCard from '../../common/components/StatusCard';
import useChunkedReplay from '../useChunkedReplay';

const SPEED_OPTIONS = [1, 1.5, 2, 5, 10];

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    maxWidth: '90vw',
    transition: 'width 0.3s ease',

    '&.expanded': {
      width: 600,
    },

    [theme.breakpoints.down('md')]: {
      width: 'calc(100% - 16px)',
      maxWidth: 'calc(100% - 16px)',
      margin: theme.spacing(1),
      left: 0,
      right: 0,
    },

    [theme.breakpoints.down('sm')]: {
      width: '100%',
      maxWidth: '100%',
      margin: 0,
      left: 0,
      right: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedControl: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  speedChips: {
    display: 'flex',
    gap: theme.spacing(0.75),
    flexWrap: 'wrap',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
      margin: theme.spacing(1.5),
    },
  },
  bufferIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const interpolatePosition = (pos1, pos2, progress) => ({
  ...pos2,
  latitude: pos1.latitude + (pos2.latitude - pos1.latitude) * progress,
  longitude: pos1.longitude + (pos2.longitude - pos1.longitude) * progress,
  course: pos1.course !== undefined && pos2.course !== undefined
    ? pos1.course + (pos2.course - pos1.course) * progress
    : pos2.course,
});

const ReplayControl = ({
  selectedItem,
  deviceName,
  eventPosition,
  onClose,
  showEventType = false,
  initialSpeed = 1,
  replayFrom,
  replayTo,
  replayPositions: externalPositions,
}) => {
  const t = useTranslation();
  const classes = useStyles();
  const timerRef = useRef();
  const animationRef = useRef();

  const {
    positions: chunkedPositions,
    totalCount,
    isBuffering,
    loadingSession,
    error,
    initSession,
    checkAndPrefetch,
    seekTo,
  } = useChunkedReplay();

  const positions = externalPositions || chunkedPositions;

  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [interpolatedPosition, setInterpolatedPosition] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const getInterval = () => 500 / speed;

  useEffect(() => {
    if (selectedItem?.deviceId && replayFrom && replayTo && !externalPositions) {
      initSession(selectedItem.deviceId, replayFrom, replayTo);
    }
  }, [selectedItem?.deviceId, replayFrom, replayTo, externalPositions]);

  useEffect(() => {
    if (positions.length > 0) {
      setInterpolatedPosition(positions[0]);
    }
  }, [positions]);

  useEffect(() => {
    if (replayPlaying && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setReplayIndex((index) => {
          const nextIndex = index + 1;

          if (!externalPositions) {
            const shouldPause = checkAndPrefetch(nextIndex, () => setReplayPlaying(true));
            if (shouldPause) {
              setReplayPlaying(false);
              return index;
            }
          }

          const maxKnown = totalCount > 0 ? totalCount - 1 : positions.length - 1;
          if (nextIndex >= maxKnown) {
            setReplayPlaying(false);
            return nextIndex;
          }
          return nextIndex;
        });
      }, getInterval());
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [replayPlaying, positions, speed, checkAndPrefetch, totalCount, externalPositions]);

  useEffect(() => {
    if (
      !replayPlaying
      || positions.length === 0
      || replayIndex >= positions.length - 1
    ) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (replayIndex < positions.length) {
        setInterpolatedPosition(positions[replayIndex]);
      }
      return;
    }

    let startTime = null;
    const duration = getInterval();

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (replayIndex < positions.length - 1) {
        setInterpolatedPosition(
          interpolatePosition(positions[replayIndex], positions[replayIndex + 1], progress),
        );
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [replayPlaying, replayIndex, positions, speed]);

  useEffect(() => {
    if (!replayPlaying && positions.length > 0 && replayIndex < positions.length) {
      setInterpolatedPosition(positions[replayIndex]);
    }
  }, [replayIndex, replayPlaying, positions]);

  const onMarkerClick = useCallback((positionId) => {
    setShowCard(!!positionId);
  }, []);

  const onPointClick = useCallback((_, index) => {
    setReplayIndex(index);
    setReplayPlaying(false);
  }, []);

  const handleSliderChange = useCallback(async (_, newIndex) => {
    setReplayPlaying(false);

    if (!externalPositions && newIndex >= positions.length) {
      await seekTo(newIndex);
    }

    setReplayIndex(newIndex);
  }, [externalPositions, positions.length, seekTo]);

  const handleClose = () => {
    clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    onClose();
  };

  const handleDownload = () => {
    if (!selectedItem) return;
    const from = positions[0]?.fixTime;
    const to = positions[positions.length - 1]?.fixTime;
    const query = new URLSearchParams({ deviceId: selectedItem.deviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const displayIndex = Math.min(replayIndex, positions.length - 1);
  const currentPosition = positions[displayIndex];
  const knownTotal = totalCount > 0 ? totalCount : positions.length;
  const sliderMax = knownTotal - 1;
  const isLoading = loadingSession;

  return (
    <div className={classes.root}>
      <MapView>
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} />
        {eventPosition && (
          <MapPositions
            positions={[eventPosition]}
            onClick={onMarkerClick}
            titleField="tollName"
            customIcon="event-error"
          />
        )}
        {interpolatedPosition && (
          <MapPositions positions={[interpolatedPosition]} onClick={onMarkerClick} />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />

      <div className={`${classes.sidebar} ${expanded ? 'expanded' : ''}`}>
        <Paper elevation={3} square>
          <Toolbar
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'unset',
              paddingTop: 1,
              paddingBottom: 1,
            }}
          >
            <IconButton edge="start" sx={{ mr: 2 }} onClick={handleClose}>
              <ArrowBackIcon />
            </IconButton>
            <Tooltip
              title={`${t('reportReplay')}${deviceName ? ` - ${deviceName}` : ''}`}
              arrow
              placement="bottom"
            >
              <Typography
                variant="subtitle1"
                onClick={() => setExpanded((prev) => !prev)}
                noWrap={!expanded}
                sx={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: expanded ? 'unset' : 'ellipsis',
                  whiteSpace: expanded ? 'normal' : 'nowrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexGrow: 1,
                }}
              >
                {t('reportReplay')}
                {deviceName ? ` - ${deviceName}` : ''}
              </Typography>
            </Tooltip>
            <IconButton onClick={handleDownload} disabled={positions.length === 0}>
              <DownloadIcon />
            </IconButton>
          </Toolbar>
        </Paper>

        <Paper className={classes.content} square>
          <Typography
            variant="subtitle1"
            align="center"
            noWrap
            sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
            className={classes.title}
          >
            {showEventType && selectedItem?.type
              ? t(prefixString('event', selectedItem.type))
              : t('reportReplay')}
          </Typography>

          {(isLoading || isBuffering) && (
            <Box className={classes.bufferIndicator}>
              <CircularProgress size={14} />
              <Typography variant="caption">
                {isLoading ? t('sharedLoading') : 'Buffering…'}
              </Typography>
            </Box>
          )}

          {error && (
            <Typography variant="caption" color="error" align="center" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}

          <Box className={classes.speedControl}>
            <Box className={classes.speedChips}>
              {SPEED_OPTIONS.map((speedOption) => (
                <Chip
                  key={speedOption}
                  label={`${speedOption}x`}
                  onClick={() => setSpeed(speedOption)}
                  color={speed === speedOption ? 'primary' : 'default'}
                  variant={speed === speedOption ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ minWidth: 48 }}
                />
              ))}
            </Box>
          </Box>

          <Slider
            className={classes.slider}
            max={sliderMax}
            step={1}
            marks={positions.length < 500
              ? positions.map((_, i) => ({ value: i }))
              : false}
            value={displayIndex}
            onChange={handleSliderChange}
            disabled={isLoading}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: -10,
              marginBottom: 8,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {positions[0] ? formatTime(positions[0].fixTime, 'seconds') : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`${positions.length}${totalCount > positions.length ? `/${totalCount}` : ''} pts`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentPosition ? formatTime(currentPosition.fixTime, 'seconds') : '—'}
            </Typography>
          </div>

          {/* Controls */}
          <div className={classes.controls}>
            <span>{`${displayIndex + 1}/${knownTotal}`}</span>
            <IconButton
              onClick={() => {
                setReplayIndex((i) => Math.max(0, i - 1));
                setReplayPlaying(false);
              }}
              disabled={replayPlaying || isBuffering || displayIndex <= 0}
            >
              <FastRewindIcon />
            </IconButton>
            <IconButton
              onClick={() => setReplayPlaying(!replayPlaying)}
              disabled={isLoading || isBuffering || displayIndex >= knownTotal - 1}
            >
              {replayPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton
              onClick={() => {
                setReplayIndex((i) => i + 1);
                setReplayPlaying(false);
              }}
              disabled={replayPlaying || isBuffering || displayIndex >= positions.length - 1}
            >
              <FastForwardIcon />
            </IconButton>
            <span>
              {currentPosition ? formatTime(currentPosition.fixTime, 'seconds') : ''}
            </span>
          </div>
        </Paper>
      </div>

      {showCard && currentPosition && (
        <StatusCard
          deviceId={selectedItem?.deviceId}
          position={currentPosition}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayControl;