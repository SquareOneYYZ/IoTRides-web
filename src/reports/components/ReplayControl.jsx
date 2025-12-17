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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import SpeedIcon from '@mui/icons-material/Speed';
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

const SPEED_OPTIONS = [0.75, 0.5, 1, 1.5, 2];
const ANIMATION_FPS = 60;

// Helper function to interpolate between two positions
const interpolatePosition = (pos1, pos2, progress) => ({
  ...pos2,
  latitude: pos1.latitude + (pos2.latitude - pos1.latitude) * progress,
  longitude: pos1.longitude + (pos2.longitude - pos1.longitude) * progress,
  course: pos1.course !== undefined && pos2.course !== undefined
    ? pos1.course + (pos2.course - pos1.course) * progress
    : pos2.course,
});

const ReplayControl = ({
  replayPositions,
  selectedItem,
  deviceName,
  eventPosition,
  onClose,
  showEventType = false,
  initialSpeed = 1,
}) => {
  const t = useTranslation();
  const timerRef = useRef();
  const animationRef = useRef();

  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [interpolatedPosition, setInterpolatedPosition] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const getInterval = () => 500 / speed;

  useEffect(() => {
    if (replayPositions.length > 0) {
      setInterpolatedPosition(replayPositions[0]);
    }
  }, [replayPositions]);

  useEffect(() => {
    if (replayPlaying && replayPositions.length > 0) {
      timerRef.current = setInterval(() => {
        setReplayIndex((index) => {
          const nextIndex = index + 1;
          if (nextIndex >= replayPositions.length - 1) {
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
  }, [replayPlaying, replayPositions, speed]);

  useEffect(() => {
    if (!replayPlaying || replayPositions.length === 0 || replayIndex >= replayPositions.length - 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (replayIndex < replayPositions.length) {
        setInterpolatedPosition(replayPositions[replayIndex]);
      }
      return;
    }

    let startTime = null;
    const duration = getInterval();

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (replayIndex < replayPositions.length - 1) {
        const currentPos = replayPositions[replayIndex];
        const nextPos = replayPositions[replayIndex + 1];
        const interpolated = interpolatePosition(currentPos, nextPos, progress);
        setInterpolatedPosition(interpolated);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [replayPlaying, replayIndex, replayPositions, speed]);

  useEffect(() => {
    if (!replayPlaying && replayPositions.length > 0 && replayIndex < replayPositions.length) {
      setInterpolatedPosition(replayPositions[replayIndex]);
    }
  }, [replayIndex, replayPlaying, replayPositions]);

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [setShowCard],
  );

  const onPointClick = useCallback((_, index) => {
    setReplayIndex(index);
    setReplayPlaying(false);
  }, []);

  const handleClose = () => {
    clearInterval(timerRef.current);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    onClose();
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  return (
    <div style={{ height: '100%' }}>
      <MapView>
        <MapGeofence />
        <MapRoutePath positions={replayPositions} />
        <MapRoutePoints positions={replayPositions} onClick={onPointClick} />
        {eventPosition && (
          <MapPositions
            positions={[eventPosition]}
            onClick={onMarkerClick}
            titleField="tollName"
            customIcon="event-error"
          />
        )}
        {interpolatedPosition && (
          <MapPositions
            positions={[interpolatedPosition]}
            onClick={onMarkerClick}
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={replayPositions} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          zIndex: 3,
          left: 0,
          top: 0,
          margin: 12,
          width: 400,
        }}
      >
        <Paper elevation={3} square>
          <Toolbar>
            <Typography noWrap variant="h6" style={{ flexGrow: 1, maxWidth: 'calc(100% - 48px)' }}>
              {t('reportReplay')}
              {deviceName && ` - ${deviceName}`}
            </Typography>
            <IconButton edge="end" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </Paper>

        <Paper
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            marginTop: 2,
          }}
          square
        >
          {showEventType && selectedItem?.type && (
            <Typography variant="h6" align="center">
              {t(prefixString('event', selectedItem.type))}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              {SPEED_OPTIONS.map((speedOption) => (
                <Chip
                  key={speedOption}
                  label={`${speedOption}x`}
                  onClick={() => handleSpeedChange(speedOption)}
                  color={speed === speedOption ? 'primary' : 'default'}
                  variant={speed === speedOption ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ minWidth: 50 }}
                />
              ))}
            </Box>
          </Box>

          <Slider
            style={{ width: '100%', margin: '16px 0' }}
            min={0}
            max={replayPositions.length - 1}
            step={null}
            marks={replayPositions.map((_, index) => ({ value: index }))}
            value={replayIndex}
            onChange={(e, newValue) => {
              setReplayIndex(newValue);
              setReplayPlaying(false);
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: -15,
            }}
          >
            <Typography variant="caption">-1hr</Typography>
            <Typography variant="caption">+1hr</Typography>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{`${replayIndex + 1}/${replayPositions.length}`}</span>
            <IconButton
              onClick={() => setReplayIndex((i) => i - 1)}
              disabled={replayPlaying || replayIndex <= 0}
            >
              <FastRewindIcon />
            </IconButton>

            <IconButton
              onClick={() => setReplayPlaying(!replayPlaying)}
              disabled={replayIndex >= replayPositions.length - 1}
            >
              {replayPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <IconButton
              onClick={() => setReplayIndex((i) => i + 1)}
              disabled={
                replayPlaying || replayIndex >= replayPositions.length - 1
              }
            >
              <FastForwardIcon />
            </IconButton>
            <span>
              {replayIndex < replayPositions.length
                ? formatTime(replayPositions[replayIndex].fixTime, 'seconds')
                : ''}
            </span>
          </div>
        </Paper>
      </div>

      {showCard && replayIndex < replayPositions.length && (
        <StatusCard
          deviceId={selectedItem.deviceId}
          position={replayPositions[replayIndex]}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayControl;
