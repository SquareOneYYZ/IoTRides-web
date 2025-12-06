import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Slider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
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

const ReplayControl = ({
  replayPositions,
  selectedItem,
  deviceName,
  eventPosition,
  onClose,
  showEventType = false,
}) => {
  const t = useTranslation();
  const timerRef = useRef();

  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (replayPlaying && replayPositions.length > 0) {
      timerRef.current = setInterval(() => {
        setReplayIndex((index) => index + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [replayPlaying, replayPositions]);

  useEffect(() => {
    if (replayIndex >= replayPositions.length - 1) {
      clearInterval(timerRef.current);
      setReplayPlaying(false);
    }
  }, [replayIndex, replayPositions]);

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
    onClose();
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
        {replayIndex < replayPositions.length && (
          <MapPositions
            positions={[replayPositions[replayIndex]]}
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
            <Typography variant="h6" style={{ flexGrow: 1 }}>
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
            marginTop: 6,
          }}
          square
        >
          {showEventType && selectedItem?.type && (
            <Typography variant="h6" align="center">
              {t(prefixString('event', selectedItem.type))}
            </Typography>
          )}
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
