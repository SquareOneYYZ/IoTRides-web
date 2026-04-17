import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Paper, Toolbar, Typography, IconButton, Slider, Box, Chip, Tooltip, CircularProgress,
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
import useChunkedReplay from './useChunkedReplay';

const SPEED_OPTIONS = [1, 1.5, 2, 5, 10];

const LOG = {
  play:   (msg, data) => console.log(`%c[RC:PLAY]   ${msg}`, 'color:#10b981;font-weight:bold', data ?? ''),
  slider: (msg, data) => console.log(`%c[RC:SLIDER] ${msg}`, 'color:#f97316;font-weight:bold', data ?? ''),
  interp: (msg, data) => console.log(`%c[RC:INTERP] ${msg}`, 'color:#a78bfa;font-weight:bold', data ?? ''),
  warn:   (msg, data) => console.warn(`[RC:WARN]   ${msg}`, data ?? ''),
};

const useStyles = makeStyles((theme) => ({
  root: { height: '100%' },
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
    '&.expanded': { width: 600 },
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
  title: { flexGrow: 1 },
  slider: { width: '100%' },
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
  latitude:  pos1.latitude  + (pos2.latitude  - pos1.latitude)  * progress,
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
  replayPositions: externalPositions, // legacy fallback
}) => {
  const t = useTranslation();
  const classes = useStyles();
  const timerRef = useRef(null);
  const animRef  = useRef(null);

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

  const [replayIndex, setReplayIndex]             = useState(0);
  const [replayPlaying, setReplayPlaying]         = useState(false);
  const [showCard, setShowCard]                   = useState(false);
  const [speed, setSpeed]                         = useState(initialSpeed);
  const [interpolatedPosition, setInterpolatedPosition] = useState(null);
  const [expanded, setExpanded]                   = useState(false);

  // Refs for stable interval callbacks
  const indexRef     = useRef(0);
  const speedRef     = useRef(initialSpeed);
  const positionsRef = useRef([]);
  const playingRef   = useRef(false);

  useEffect(() => { indexRef.current = replayIndex; }, [replayIndex]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { playingRef.current = replayPlaying; }, [replayPlaying]);

  const getInterval = () => 500 / speedRef.current;

  // ─── Auto-init from props ────────────────────────────────────────────────
  useEffect(() => {
    if (selectedItem?.deviceId && replayFrom && replayTo && !externalPositions) {
      console.log('%c[ReplayControl] Auto-init session from props', 'color:#0ea5e9;font-weight:bold', {
        deviceId: selectedItem.deviceId, replayFrom, replayTo,
      });
      initSession(selectedItem.deviceId, replayFrom, replayTo);
    }
  }, [selectedItem?.deviceId, replayFrom, replayTo]);

  // ─── Log position array changes ─────────────────────────────────────────
  useEffect(() => {
    if (positions.length > 0) {
      LOG.play('Positions updated in ReplayControl', {
        length: positions.length,
        totalCount,
        source: externalPositions ? 'external (legacy)' : 'chunked session',
      });
      setInterpolatedPosition(positions[0]);
    }
  }, [positions.length]);

  // ─── Playback timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!replayPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        LOG.play('Playback stopped');
      }
      return;
    }

    LOG.play('Playback started', {
      speed,
      index: replayIndex,
      loaded: positions.length,
      totalCount,
      interval: `${getInterval()}ms`,
    });

    timerRef.current = setInterval(() => {
      const pos = positionsRef.current;
      const currentIdx = indexRef.current;
      const nextIndex = currentIdx + 1;

      if (nextIndex >= pos.length) {
        const shouldPause = !externalPositions && checkAndPrefetch(nextIndex, () => {
          LOG.play('Auto-resume from buffer refill');
          setReplayPlaying(true);
        });
        if (shouldPause) {
          LOG.play('Buffer underrun — pausing');
          setReplayPlaying(false);
          return;
        }
        LOG.play('Reached end');
        setReplayPlaying(false);
        return;
      }

      if (!externalPositions) {
        checkAndPrefetch(nextIndex, () => {
          LOG.play('Auto-resume from buffer refill');
          setReplayPlaying(true);
        });
      }

      LOG.play(`Tick → ${currentIdx} → ${nextIndex}`, {
        lat: pos[nextIndex]?.latitude,
        lng: pos[nextIndex]?.longitude,
        fixTime: pos[nextIndex]?.fixTime,
      });

      setReplayIndex(nextIndex);
      indexRef.current = nextIndex;
    }, getInterval());

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [replayPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Animation frame for smooth interpolation ───────────────────────────
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    if (!replayPlaying || positions.length === 0 || replayIndex >= positions.length - 1) {
      const clamped = Math.min(replayIndex, positions.length - 1);
      if (clamped >= 0 && positions[clamped]) {
        setInterpolatedPosition(positions[clamped]);
      }
      return;
    }

    let startTime = null;
    const duration = getInterval();

    const animate = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const idx = indexRef.current;
      const pos = positionsRef.current;

      if (idx < pos.length - 1 && pos[idx] && pos[idx + 1]) {
        setInterpolatedPosition(interpolatePosition(pos[idx], pos[idx + 1], progress));
      }

      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [replayPlaying, replayIndex]);

  // ─── Sync position when paused/seeking ──────────────────────────────────
  useEffect(() => {
    if (!replayPlaying && positions.length > 0) {
      const clamped = Math.min(replayIndex, positions.length - 1);
      if (positions[clamped]) {
        LOG.interp('Setting position on pause/seek', {
          index: clamped,
          lat: positions[clamped].latitude,
          lng: positions[clamped].longitude,
        });
        setInterpolatedPosition(positions[clamped]);
      }
    }
  }, [replayIndex, replayPlaying]);

  // ─── Callbacks ───────────────────────────────────────────────────────────
  const onMarkerClick = useCallback((positionId) => setShowCard(!!positionId), []);

  const onPointClick = useCallback((_, idx) => {
    LOG.slider('Route point clicked', { idx });
    setReplayIndex(idx);
    indexRef.current = idx;
    setReplayPlaying(false);
  }, []);

  const handleSliderChange = useCallback(async (_, newIndex) => {
    LOG.slider('Slider changed', { newIndex, loaded: positionsRef.current.length, totalCount });
    setReplayPlaying(false);

    if (!externalPositions && newIndex >= positionsRef.current.length) {
      LOG.slider('Beyond buffer — fetching on demand');
      await seekTo(newIndex);
    }

    setReplayIndex(newIndex);
    indexRef.current = newIndex;
  }, [externalPositions, seekTo]);

  const handleClose = () => {
    clearInterval(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    onClose();
  };

  const handleDownload = () => {
    if (!selectedItem || positions.length === 0) return;
    const query = new URLSearchParams({
      deviceId: selectedItem.deviceId,
      from: positions[0]?.fixTime,
      to:   positions[positions.length - 1]?.fixTime,
    });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const handlePlayPause = () => {
    const next = !replayPlaying;
    LOG.play(`User clicked ${next ? 'Play' : 'Pause'}`, {
      index: replayIndex, loaded: positions.length, totalCount,
    });
    setReplayPlaying(next);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  const displayIndex = Math.min(replayIndex, Math.max(0, positions.length - 1));
  const currentPos   = positions[displayIndex];
  const knownTotal   = totalCount > 0 ? totalCount : positions.length;
  const atEnd        = displayIndex >= knownTotal - 1;

  return (
    <div className={classes.root}>
      <MapView>
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} />
        {eventPosition && (
          <MapPositions positions={[eventPosition]} onClick={onMarkerClick} titleField="tollName" customIcon="event-error" />
        )}
        {interpolatedPosition && (
          <MapPositions positions={[interpolatedPosition]} onClick={onMarkerClick} />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />

      <div className={`${classes.sidebar} ${expanded ? 'expanded' : ''}`}>
        <Paper elevation={3} square>
          <Toolbar sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 'unset', paddingTop: 1, paddingBottom: 1 }}>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={handleClose}>
              <ArrowBackIcon />
            </IconButton>
            <Tooltip title={`${t('reportReplay')}${deviceName ? ` - ${deviceName}` : ''}`} arrow placement="bottom">
              <Typography
                variant="subtitle1"
                onClick={() => setExpanded((p) => !p)}
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
          <Typography variant="subtitle1" align="center" noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }} className={classes.title}>
            {showEventType && selectedItem?.type
              ? t(prefixString('event', selectedItem.type))
              : t('reportReplay')}
          </Typography>

          {(loadingSession || isBuffering) && (
            <Box className={classes.bufferIndicator}>
              <CircularProgress size={14} />
              <Typography variant="caption">{loadingSession ? t('sharedLoading') : 'Buffering…'}</Typography>
            </Box>
          )}

          {error && (
            <Typography variant="caption" color="error" align="center" sx={{ mb: 1 }}>{error}</Typography>
          )}

          <Box className={classes.speedControl}>
            <Box className={classes.speedChips}>
              {SPEED_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={`${opt}x`}
                  onClick={() => { setSpeed(opt); speedRef.current = opt; }}
                  color={speed === opt ? 'primary' : 'default'}
                  variant={speed === opt ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ minWidth: 48 }}
                />
              ))}
            </Box>
          </Box>

          <Slider
            className={classes.slider}
            max={knownTotal > 1 ? knownTotal - 1 : 0}
            step={1}
            marks={positions.length < 500 ? positions.map((_, i) => ({ value: i })) : false}
            value={displayIndex}
            onChange={handleSliderChange}
            disabled={loadingSession || positions.length === 0}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -10, marginBottom: 8 }}>
            <Typography variant="caption" color="text.secondary">
              {positions[0] ? formatTime(positions[0].fixTime, 'seconds') : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`${positions.length}${totalCount > positions.length ? `/${totalCount}` : ''} pts`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentPos ? formatTime(currentPos.fixTime, 'seconds') : '—'}
            </Typography>
          </div>

          <div className={classes.controls}>
            <span>{`${displayIndex + 1}/${knownTotal}`}</span>
            <IconButton
              onClick={() => {
                const ni = Math.max(0, replayIndex - 1);
                setReplayIndex(ni);
                indexRef.current = ni;
                setReplayPlaying(false);
              }}
              disabled={replayPlaying || isBuffering || displayIndex <= 0}
            >
              <FastRewindIcon />
            </IconButton>
            <IconButton
              onClick={handlePlayPause}
              disabled={loadingSession || isBuffering || atEnd || positions.length === 0}
            >
              {replayPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton
              onClick={() => {
                const ni = Math.min(positions.length - 1, replayIndex + 1);
                setReplayIndex(ni);
                indexRef.current = ni;
                setReplayPlaying(false);
              }}
              disabled={replayPlaying || isBuffering || displayIndex >= positions.length - 1}
            >
              <FastForwardIcon />
            </IconButton>
            <span>{currentPos ? formatTime(currentPos.fixTime, 'seconds') : '—'}</span>
          </div>
        </Paper>
      </div>

      {showCard && currentPos && (
        <StatusCard
          deviceId={selectedItem?.deviceId}
          position={currentPos}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayControl;